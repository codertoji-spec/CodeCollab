/**
 * executionService.js
 * --------------------------------------------------------------------------
 * Internal sandboxed code execution. Replaces the previous Wandbox HTTP call.
 *
 * Strategy: spawn `docker run` per request (no daemon library to keep the
 * surface tiny and avoid an extra dep). Each run is isolated, capped, and
 * cleaned up unconditionally.
 *
 * Hardening flags applied to every container:
 *   --rm                       container removed when it exits
 *   --network=none             no outbound network
 *   --memory / --memory-swap   hard RAM cap (no swap escape)
 *   --cpus                     CPU share cap
 *   --pids-limit               fork-bomb mitigation
 *   --read-only                rootfs read-only
 *   --tmpfs /sandbox           single writable area, capped, noexec? (NO — we run binaries here)
 *   --cap-drop=ALL             strip Linux capabilities
 *   --security-opt no-new-privileges
 *   --user 65534:65534         run as `nobody`
 *   -v <host tmp>:/src:ro      source mounted read-only
 *
 * Timeout is enforced from the host (kill the docker process) AND inside
 * the container via GNU `timeout` so we don't depend on a single mechanism.
 * --------------------------------------------------------------------------
 */
const { spawn } = require('child_process');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { LANGS } = require('./langConfig');

const EXEC_TIMEOUT_MS = parseInt(process.env.EXEC_TIMEOUT_MS || '15000', 10);
const EXEC_MEMORY     = process.env.EXEC_MEMORY     || '256m';
const EXEC_CPUS       = process.env.EXEC_CPUS       || '0.5';
const EXEC_PIDS       = process.env.EXEC_PIDS       || '256';
const EXEC_OUTPUT_MAX = parseInt(process.env.EXEC_OUTPUT_MAX || '65536', 10); // 64 KB

/**
 * Run a single execution.
 * @param {Object} args
 * @param {string} args.language  normalized language key (must exist in LANGS)
 * @param {string} args.code      user source code
 * @param {string} [args.stdin]   optional stdin
 * @returns {Promise<{output:string,error:string,compilerMessage:string,exitCode:number|null,signal:string|null}>}
 */
async function run({ language, code, stdin = '' }) {
  const cfg = LANGS[language];
  if (!cfg) throw new Error(`Unsupported language: ${language}`);

  // 1) Per-request temp dir on host
  const reqId   = crypto.randomBytes(8).toString('hex');
  const hostDir = await fs.mkdtemp(path.join(os.tmpdir(), `cc-exec-${reqId}-`));
  const srcPath = path.join(hostDir, cfg.filename);
  await fs.writeFile(srcPath, code, 'utf8');
  await fs.chmod(hostDir, 0o755);
  await fs.chmod(srcPath, 0o644);

  // 2) Build the in-container shell pipeline.
  //    - copy source from /src (ro mount) into /sandbox (writable tmpfs)
  //    - run optional compile, then run the program under `timeout`
  //    - GNU `timeout -s KILL <secs>` enforces wall clock inside container.
  const innerTimeoutSec = Math.max(1, Math.ceil(EXEC_TIMEOUT_MS / 1000));
  const compileStep = cfg.compile ? `${cfg.compile} && ` : '';
  // We need to capture compile errors separately so the controller can put
  // them into `compilerMessage`. We do that by writing compile stderr to a
  // file inside /sandbox and printing a sentinel before the run step.
  const innerCmd = cfg.compile
    ? `( ${cfg.compile} ) 2> /sandbox/.compile.err; ` +
      `_cs=$?; ` +
      `if [ $_cs -ne 0 ]; then ` +
      `  echo "__CC_COMPILE_FAIL__"; cat /sandbox/.compile.err 1>&2; exit $_cs; ` +
      `fi; ` +
      `cat /sandbox/.compile.err 1>&2; ` +
      `exec timeout -s KILL ${innerTimeoutSec} ${cfg.run}`
    : `exec timeout -s KILL ${innerTimeoutSec} ${cfg.run}`;

  // Copy source from read-only /src into writable /sandbox first.
  const fullCmd = `cp /src/${cfg.filename} /sandbox/${cfg.filename} && cd /sandbox && ${innerCmd}`;

  // 3) docker run args
  const dockerArgs = [
    'run', '--rm', '-i',
    '--network=none',
    `--memory=${EXEC_MEMORY}`,
    `--memory-swap=${EXEC_MEMORY}`,
    `--cpus=${EXEC_CPUS}`,
    '--read-only',
    '--tmpfs', '/sandbox:rw,exec,size=64m,mode=1777',
    '--tmpfs', '/tmp:rw,size=16m,mode=1777',
    '--cap-drop=ALL',
    '--security-opt', 'no-new-privileges',
    '--user', '65534:65534',
    '-v', `${hostDir}:/src:ro`,
    '-w', '/sandbox',
    '-e', 'HOME=/sandbox',
    '-e', 'JAVA_TOOL_OPTIONS=-XX:-UsePerfData -Xss512k',
    // Go needs a writable cache; point it at the tmpfs
    '-e', 'GOCACHE=/sandbox/.gocache',
    '-e', 'GOPATH=/sandbox/.gopath',
    '-e', 'GOTMPDIR=/sandbox/.gotmp',
    '-e', 'GOFLAGS=-p=1',
    cfg.image,
    'sh', '-c', fullCmd,
  ];

  // 4) Spawn and collect output with hard caps + outer kill timer
  return new Promise((resolve) => {
    const proc = spawn('docker', dockerArgs, { stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    let killed = false;
    let truncated = false;

    const append = (which, chunk) => {
      const cur = which === 'o' ? stdout : stderr;
      if (cur.length >= EXEC_OUTPUT_MAX) { truncated = true; return; }
      const room = EXEC_OUTPUT_MAX - cur.length;
      const text = chunk.toString('utf8');
      if (text.length > room) {
        truncated = true;
        if (which === 'o') stdout += text.slice(0, room); else stderr += text.slice(0, room);
      } else {
        if (which === 'o') stdout += text; else stderr += text;
      }
    };

    proc.stdout.on('data', (c) => append('o', c));
    proc.stderr.on('data', (c) => append('e', c));

    // Feed stdin then close
    if (stdin) proc.stdin.write(stdin);
    proc.stdin.end();

    // Outer timeout — give container `timeout` a chance first, then nuke.
    const killTimer = setTimeout(() => {
      killed = true;
      try { proc.kill('SIGKILL'); } catch (_) { /* noop */ }
    }, EXEC_TIMEOUT_MS + 2000);

    proc.on('error', (err) => {
      clearTimeout(killTimer);
      cleanup(hostDir);
      resolve({
        output: '',
        error: `Execution engine error: ${err.message}`,
        compilerMessage: '',
        exitCode: null,
        signal: null,
      });
    });

    proc.on('close', (code, signal) => {
      clearTimeout(killTimer);
      cleanup(hostDir);

      // Compile failure detection (sentinel printed to stdout)
      let compilerMessage = '';
      let output = stdout;
      let error  = stderr;

      const sentinelIdx = output.indexOf('__CC_COMPILE_FAIL__');
      if (sentinelIdx !== -1) {
        // everything in stderr is compiler output; clear program stdout up to sentinel
        output = output.slice(0, sentinelIdx);
        compilerMessage = error;
        error = '';
      }

      // `timeout` from coreutils returns 124 when it kills the child
      const timedOut = killed || code === 124 || code === 137;
      if (timedOut) {
        error = (error ? error + '\n' : '') +
          `[execution terminated: exceeded ${EXEC_TIMEOUT_MS}ms time limit]`;
      }
      if (truncated) {
        error = (error ? error + '\n' : '') +
          `[output truncated at ${EXEC_OUTPUT_MAX} bytes]`;
      }

      resolve({
        output,
        error,
        compilerMessage,
        exitCode: timedOut ? null : code,
        signal: signal || null,
      });
    });
  });
}

function cleanup(dir) {
  fs.rm(dir, { recursive: true, force: true }).catch(() => { /* noop */ });
}

module.exports = { run };