import type { EnvsJson, EnvCliFlags } from "../../types.js";
import { safeLoadConfigObj, saveConfigObj } from "../../core/io.js";
import { Logger, makeLogger, pullToFile, upsertEnvMapping } from "./shared.js";

export default async function doPull(
  F: EnvCliFlags,
  secretArg?: string,
  logger?: Logger
) {
  const log = logger ?? makeLogger(F.quiet);

  // Single secret mode: pmt env pull <secret>
  if (typeof secretArg === "string" && secretArg.trim() !== "") {
    const cfg = await safeLoadConfigObj(F.config);
    await doPullSingle(cfg, secretArg.trim(), F, log);
    return;
  }

  // Multi
  const cfg = await safeLoadConfigObj(F.config);
  if (!cfg.envs?.length) {
    log.warn(
      `pull: no entries in ${F.config} (run "pmt env init <project> <category>" and "pmt env create")`
    );
    return;
  }
  for (const item of cfg.envs) {
    const { name, secret } = item || {};
    if (!name || !secret) {
      log.warn(`pull: skipping ${name || "(no name)"} (missing secret)`);
      continue;
    }
    await pullToFile(secret, name, F);
    log.info(`pull: wrote ${name}`);
  }
}

async function doPullSingle(
  cfg: EnvsJson,
  secret: string,
  F: EnvCliFlags,
  log: Logger
) {
  log.info(`pull: single secret → writing to ${F.path}`);
  await pullToFile(secret, F.path, F);

  const name = F.mapName || F.path;
  const merged = upsertEnvMapping(cfg, name, secret);
  await saveConfigObj(F.config, merged);
  log.info(`pull: updated ${F.config} with { name: "${name}" }`);
}
