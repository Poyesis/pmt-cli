import { scanEnvFiles, mergeEnvConfigObj, safeLoadConfigObj, } from "../../core/io.js";
import { makeLogger, createSecretIfNeeded, saveAndLogConfig, } from "./shared.js";
export default async function doCreate(F, logger) {
    const log = logger ?? makeLogger(F.quiet);
    const cfg = await safeLoadConfigObj(F.config);
    const discovered = await scanEnvFiles(process.cwd());
    const merged = mergeEnvConfigObj(cfg, discovered);
    await saveAndLogConfig(F.config, merged, "create", log);
    if (!merged.project) {
        log.warn(`create: no "project" in ${F.config}. Run: pmt env init <project> <category>`);
    }
    let changed = false;
    for (const item of merged.envs) {
        const { name, secret } = item || {};
        if (!name)
            continue;
        if (secret && String(secret).trim() !== "") {
            log.info(`create: ${name} already has a secret, skipping`);
            continue;
        }
        const newSecret = await createSecretIfNeeded(name, merged, F, log);
        if (newSecret) {
            item.secret = newSecret;
            log.info(`create: ${name} → secret saved`);
            changed = true;
        }
        else {
            log.warn(`create: ${name} missing or empty locally, skipping secret creation`);
        }
    }
    if (changed) {
        await saveAndLogConfig(F.config, merged, "create", log);
    }
}
