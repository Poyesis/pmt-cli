import path from "node:path";
import { env as ENV } from "node:process";
import type { EnvCliFlags } from "../types.js";

export function defaultEnvFlags(argv: Record<string, any>): EnvCliFlags {
  const get = (k: string, short?: string) =>
    argv[k] ?? (short ? argv[short] : undefined);

  const baseUrl = (get("base-url", "u") ??
    ENV.POYESIS_ENV_BASE_URL ??
    "https://api.poyesis.fr") as string;

  return {
    config: path.resolve((get("config", "c") as string) ?? "envs.json"),
    baseUrl: String(baseUrl).replace(/\/+$/, ""),
    listPath:
      (argv["list-path"] as string) ?? "/env/list-cli/{project}/{category}",
    readPath: (argv["read-path"] as string) ?? "/env/read-cli/{secret}",
    createPath: (argv["create-path"] as string) ?? "/env/create-cli",
    pushPath: (argv["push-path"] as string) ?? "/env/push-cli/{secret}",
    overwrite: !!argv["overwrite"],
    path: (get("path", "p") as string) ?? ".env",
    mapName: (argv["name"] as string) ?? null,
    quiet: !!(argv["quiet"] || argv["q"]),
  };
}
