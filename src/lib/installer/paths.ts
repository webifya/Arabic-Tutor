import "server-only";

import path from "node:path";

export function getApplicationRoot(): string {
  return process.env.LISAN_APPLICATION_ROOT
    ? path.resolve(process.env.LISAN_APPLICATION_ROOT)
    : process.cwd();
}
