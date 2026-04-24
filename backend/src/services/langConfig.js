/**
 * Per-language sandbox configuration.
 *
 * Each entry describes:
 *   image     : docker image tag (built from backend/sandbox/Dockerfile.<lang>)
 *   filename  : source filename written into the per-request temp dir
 *   compile   : optional shell command run BEFORE `run` (compile errors → compilerMessage)
 *   run       : shell command actually executed inside the container
 *
 * The whole pipeline is invoked inside the container as:
 *     sh -c "<compile> && <run>"   (or just "<run>" when compile is null)
 *
 * Working dir inside container = /sandbox (writable tmpfs), source mounted read-only
 * at /src and copied into /sandbox by the entrypoint shell line below.
 */
const LANGS = {
  javascript: {
    image: 'codecollab-sandbox-node',
    filename: 'main.js',
    compile: null,
    run: 'node /sandbox/main.js',
  },
  typescript: {
    image: 'codecollab-sandbox-node',
    filename: 'main.ts',
    compile: null,
    // tsx is preinstalled globally in the node sandbox image
    run: 'tsx /sandbox/main.ts',
  },
  python: {
    image: 'codecollab-sandbox-python',
    filename: 'main.py',
    compile: null,
    run: 'python3 -I /sandbox/main.py',
  },
  cpp: {
    image: 'codecollab-sandbox-cpp',
    filename: 'main.cpp',
    compile: 'g++ -std=gnu++20 -O0 -w /sandbox/main.cpp -o /sandbox/a.out',
    run: '/sandbox/a.out',
  },
  go: {
    image: 'codecollab-sandbox-go',
    filename: 'main.go',
    // -p 1 = sequential compilation (1 worker), avoids fork storm under pids-limit
    compile: 'go build -p 1 -o /sandbox/a.out /sandbox/main.go',
    run: '/sandbox/a.out',
  },
  rust: {
    image: 'codecollab-sandbox-rust',
    filename: 'main.rs',
    // No 2>&1 — rustc errors must go to stderr so .compile.err captures them
    compile: 'rustc --edition=2021 -O /sandbox/main.rs -o /sandbox/a.out',
    run: '/sandbox/a.out',
  },
  java: {
    image: 'codecollab-sandbox-java',
    filename: 'Main.java',
    compile: "grep -oP '(?<=public class )\\w+' /sandbox/Main.java 2>/dev/null | head -1 > /sandbox/.classname; [ -s /sandbox/.classname ] || echo Main > /sandbox/.classname; cp /sandbox/Main.java \"/sandbox/$(cat /sandbox/.classname).java\"; javac \"/sandbox/$(cat /sandbox/.classname).java\" -d /sandbox",
    run: "java -XX:-UsePerfData -Djava.io.tmpdir=/tmp -Xss512k -cp /sandbox \"$(cat /sandbox/.classname 2>/dev/null || echo Main)\"",
  },
};

const ALIASES = {
  js: 'javascript', node: 'javascript', nodejs: 'javascript',
  ts: 'typescript',
  py: 'python', python3: 'python',
  'c++': 'cpp', cxx: 'cpp', cc: 'cpp',
  golang: 'go',
  rs: 'rust',
  java: 'java',
};

const normalizeLang = (lang) => {
  if (!lang) return null;
  const k = String(lang).trim().toLowerCase();
  return ALIASES[k] || k;
};

module.exports = { LANGS, normalizeLang };