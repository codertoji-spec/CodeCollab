# Sandbox images — not currently wired up

The Dockerfiles in this directory (one per supported language) are a scoped
**future direction**: self-hosted, resource-capped code execution to replace
the JDoodle API and its 200 requests/day free-tier limit.

**Current state: unused.** The live execution path
(`backend/src/services/executionService.js`) calls JDoodle's hosted API over
HTTPS — it does not build, run, or otherwise reference these images. Running
`build-images.sh` will produce working containers, but nothing in the app
invokes them yet (no container-spawn code, no bind-mount wiring beyond the
placeholder `docker.sock`/`/tmp` mounts previously left in `docker-compose.yml`).

To actually adopt this direction, someone would need to:
1. Write the container-spawn logic (mount source, run with the resource
   limits already set in each Dockerfile, capture stdout/stderr/exit code).
2. Swap `executionService.js`'s JDoodle call for that local spawn call,
   keeping the existing `{ output, error, compilerMessage, exitCode, signal }`
   response shape so the rest of the app doesn't need to change.
3. Re-add the sandbox tuning env vars (`EXEC_MEMORY`, `EXEC_CPUS`,
   `EXEC_PIDS`, `EXEC_OUTPUT_MAX`) to `docker-compose.yml`.

Until then, treat this directory as a design sketch, not part of the running
system.
