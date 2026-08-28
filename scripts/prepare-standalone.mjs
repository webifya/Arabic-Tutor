import { cp, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const standaloneRoot = path.join(projectRoot, ".next", "standalone");

async function copyIfPresent(source, destination) {
  try {
    await stat(source);
  } catch {
    return;
  }

  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true, force: true });
}

await copyIfPresent(
  path.join(projectRoot, ".next", "static"),
  path.join(standaloneRoot, ".next", "static"),
);
await copyIfPresent(
  path.join(projectRoot, "public"),
  path.join(standaloneRoot, "public"),
);
