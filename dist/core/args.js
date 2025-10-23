import path from "node:path";
import { env as ENV } from "node:process";
export function defaultEnvFlags(argv) {
    const get = (k, short) => argv[k] ?? (short ? argv[short] : undefined);
    const baseUrl = (get("base-url", "u") ??
        ENV.POYESIS_ENV_BASE_URL ??
        "https://api.poyesis.fr");
    return {
        config: path.resolve(get("config", "c") ?? "envs.json"),
        baseUrl: String(baseUrl).replace(/\/+$/, ""),
        listPath: argv["list-path"] ?? "/env/list-cli/{project}/{category}",
        readPath: argv["read-path"] ?? "/env/read-cli/{secret}",
        createPath: argv["create-path"] ?? "/env/create-cli",
        pushPath: argv["push-path"] ?? "/env/push-cli/{secret}",
        overwrite: !!argv["overwrite"],
        path: get("path", "p") ?? ".env",
        mapName: argv["name"] ?? null,
        quiet: !!(argv["quiet"] || argv["q"]),
    };
}
