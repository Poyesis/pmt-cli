import { promises as fsp } from "node:fs";
import fs from "node:fs";
import * as path from "node:path";
import { readLoginConfig } from "./config.js";
export const DEFAULT_IGNORES = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    ".turbo",
    "coverage",
    "out",
    ".vercel",
    ".cache",
]);
export function looksLikeEnvFile(basename) {
    return /^\.env(\..+)?$/i.test(basename) || /^\..+\.env$/i.test(basename);
}
export async function scanEnvFiles(rootDir) {
    const results = new Set();
    await walk(rootDir, results);
    return Array.from(results).sort();
}
async function walk(dir, results) {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
        const name = ent.name;
        const full = path.join(dir, name);
        if (ent.isDirectory()) {
            if (DEFAULT_IGNORES.has(name))
                continue;
            if (name.startsWith(".") && name !== ".")
                continue;
            await walk(full, results);
        }
        else if (ent.isFile()) {
            const base = path.basename(full);
            if (looksLikeEnvFile(base)) {
                const rel = path.relative(process.cwd(), full) || base;
                results.add(rel);
            }
        }
    }
}
export function emptyConfig() {
    return { project: "", category: "", envs: [] };
}
export async function safeLoadConfigObj(p) {
    try {
        if (!fs.existsSync(p))
            return emptyConfig();
        const raw = await fsp.readFile(p, "utf8");
        const parsed = JSON.parse(raw);
        const envs = Array.isArray(parsed?.envs)
            ? parsed.envs
                .map((x) => ({ name: x?.name, secret: x?.secret || "" }))
                .filter((x) => !!x.name)
            : [];
        const project = typeof parsed?.project === "string" ? parsed.project : "";
        const category = typeof parsed?.category === "string" ? parsed.category : "";
        return { project, category, envs };
    }
    catch {
        return emptyConfig();
    }
}
export async function saveConfigObj(p, obj) {
    const clean = {
        project: obj.project || "",
        category: obj.category || "",
        envs: (obj.envs || []).map((x) => ({
            name: x.name,
            secret: x.secret || "",
        })),
    };
    const text = JSON.stringify(clean, null, 2) + "\n";
    await fsp.writeFile(p, text, "utf8");
}
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
export function mergeEnvConfigObj(cfg, discoveredPaths) {
    const out = {
        project: cfg.project || "",
        category: cfg.category || "",
        envs: Array.isArray(cfg.envs) ? [...cfg.envs] : [],
    };
    const byName = new Map(out.envs.map((e) => [e.name, e]));
    for (const p of discoveredPaths) {
        if (!byName.has(p))
            byName.set(p, { name: p, secret: "" });
    }
    out.envs = Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
    return out;
}
export function ensureLeadingSlash(s) {
    return s.startsWith("/") ? s : "/" + s;
}
export async function fetchJson(url, init) {
    const login = await readLoginConfig();
    const headers = {
        "Content-Type": "application/json",
        ...init?.headers,
    };
    if (login?.token) {
        headers["Authorization"] = `Bearer ${login.token}`;
    }
    else {
        throw new Error("Not logged in");
    }
    const res = await fetch(url, { ...init, headers });
    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}\n${body}`);
    }
    const text = await res.text();
    if (!text)
        return {};
    try {
        return JSON.parse(text);
    }
    catch {
        return {};
    }
}
export function fileExists(p) {
    try {
        return fs.existsSync(p);
    }
    catch {
        return false;
    }
}
