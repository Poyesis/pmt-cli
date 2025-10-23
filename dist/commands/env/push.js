import { safeLoadConfigObj } from "../../core/io.js";
import { makeLogger, pushOne } from "./shared.js";
export default async function doPush(F, logger) {
    const log = logger ?? makeLogger(F.quiet);
    const cfg = await safeLoadConfigObj(F.config);
    if (!cfg.envs?.length) {
        log.warn(`push: no entries in ${F.config} (run "pmt env init <project> <category>" and/or "pmt env create")`);
        return;
    }
    for (const item of cfg.envs) {
        const { name, secret } = item || {};
        if (!name || !secret) {
            log.warn(`push: skipping ${name || "(no name)"} (missing secret)`);
            continue;
        }
        await pushOne(name, secret, F, log);
    }
}
