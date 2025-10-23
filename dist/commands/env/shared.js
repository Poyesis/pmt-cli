import { promises as fsp } from "node:fs";
import fs from "node:fs";
import * as path from "node:path";
import { ensureLeadingSlash, fetchJson, saveConfigObj, fileExists, } from "../../core/io.js";
export function makeLogger(quiet) {
    return {
        info: (m) => {
            if (!quiet)
                console.log(m);
        },
        warn: (m) => console.warn(m),
        error: (m) => console.error(m),
    };
}
/** GET /env/read-cli/{secret} → env string */
export async function pullToString(secret, F) {
    const url = `${F.baseUrl}${ensureLeadingSlash(F.readPath.replace("{secret}", encodeURIComponent(secret)))}`;
    const res = await fetchJson(url, { method: "GET" });
    return res && typeof res.env === "string" ? res.env : "";
}
/** Write pulled env to file with 0600 perms */
export async function pullToFile(secret, filePath, F) {
    const envText = await pullToString(secret, F);
    if (!envText)
        return;
    const abs = path.resolve(filePath);
    await fsp.mkdir(path.dirname(abs), { recursive: true });
    await fsp.writeFile(abs, envText, "utf8");
    await fsp.chmod(abs, 0o600);
}
/** Upsert {name, secret} into envs.json shape */
export function upsertEnvMapping(cfg, name, secret) {
    const out = {
        project: cfg.project || "",
        category: cfg.category || "",
        envs: Array.isArray(cfg.envs) ? [...cfg.envs] : [],
    };
    const idx = out.envs.findIndex((e) => e?.name === name);
    if (idx >= 0)
        out.envs[idx].secret = secret;
    else
        out.envs.push({ name, secret });
    out.envs.sort((a, b) => a.name.localeCompare(b.name));
    return out;
}
/** POST /env/create-cli -> returns {secret} */
export async function createSecretIfNeeded(name, merged, F, { info }) {
    const filePath = path.resolve(name);
    if (!fileExists(filePath))
        return null;
    const envText = await fsp.readFile(filePath, "utf8");
    if (!envText.trim())
        return null;
    const url = `${F.baseUrl}${ensureLeadingSlash(F.createPath)}`;
    info(`create: POST ${url} (project="${merged.project || ""}", category="${merged.category || ""}", name="${name}")`);
    const payload = { name, env: envText };
    if (merged.project)
        payload.project = merged.project;
    if (merged.category)
        payload.category = merged.category;
    const res = await fetchJson(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res || !res.secret) {
        throw new Error(`API did not return a "secret" for ${name}`);
    }
    return String(res.secret);
}
/** PUT /env/push-cli/{secret} */
export async function pushOne(name, secret, F, { info, warn }) {
    const filePath = path.resolve(name);
    if (!fs.existsSync(filePath)) {
        warn(`push: ${name} missing locally, skipping`);
        return;
    }
    const envText = await fsp.readFile(filePath, "utf8");
    const url = `${F.baseUrl}${ensureLeadingSlash(F.pushPath.replace("{secret}", encodeURIComponent(secret)))}`;
    info(`push: PUT ${url} (name="${name}")`);
    await fetchJson(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ env: envText }),
    });
    info(`push: ${name} pushed`);
}
/** Save updated envs.json and log a friendly line */
export async function saveAndLogConfig(filePath, obj, label, { info }) {
    await saveConfigObj(filePath, obj);
    info(`${label}: wrote ${filePath} with project="${obj.project || ""}" and ${obj.envs.length} entr${obj.envs.length === 1 ? "y" : "ies"}`);
}
