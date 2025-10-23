import { promises as fsp } from "node:fs";
import * as path from "node:path";
import type { EnvsJson, EnvCliFlags } from "../../types.js";
import {
  ensureLeadingSlash,
  fetchJson,
  fileExists,
  safeLoadConfigObj,
  saveConfigObj,
} from "../../core/io.js";
import {
  Logger,
  makeLogger,
  pullToString,
  upsertEnvMapping,
} from "./shared.js";

export default async function doInit(
  project: string,
  category: string,
  F: EnvCliFlags,
  logger?: Logger
) {
  const { info } = logger ?? makeLogger(F.quiet);

  const listUrl = `${F.baseUrl}${ensureLeadingSlash(
    F.listPath
      .replace("{project}", encodeURIComponent(project))
      .replace("{category}", encodeURIComponent(category))
  )}`;
  info(`init: GET ${listUrl}`);

  const listResp = await fetchJson(listUrl, { method: "GET" });

  const raw = Array.isArray(listResp)
    ? listResp
    : Array.isArray(listResp?.envs)
    ? listResp.envs
    : [];

  const remoteItems = raw
    .map((x: any) => ({
      name: x?.name,
      secret: x?.secret || "",
      env: typeof x?.env === "string" ? x.env : null,
    }))
    .filter((x: any) => !!x.name);

  // fetch body if not included
  for (const item of remoteItems) {
    if (item.env == null && item.secret) {
      item.env = await pullToString(item.secret, F);
    }
  }

  // write local files
  for (const { name, env } of remoteItems) {
    if (typeof env !== "string") continue;
    const abs = path.resolve(name);
    const exists = fileExists(abs);
    if (exists && !F.overwrite) {
      info(`init: ${name} exists (skipped). Use --overwrite to replace.`);
      continue;
    }
    await fsp.mkdir(path.dirname(abs), { recursive: true });
    await fsp.writeFile(abs, env, "utf8");
    await fsp.chmod(abs, 0o600);
    info(`init: wrote ${abs} (${env.length} bytes)`);
  }

  // merge into envs.json
  const existing = await safeLoadConfigObj(F.config);
  let merged: EnvsJson = {
    project,
    category,
    envs: Array.isArray(existing.envs) ? [...existing.envs] : [],
  };
  for (const { name, secret } of remoteItems) {
    merged = upsertEnvMapping(merged, name, secret);
  }
  await saveConfigObj(F.config, merged);
  info(
    `init: updated ${F.config} with project="${project}" and ${
      merged.envs.length
    } env entr${merged.envs.length === 1 ? "y" : "ies"}`
  );
}
