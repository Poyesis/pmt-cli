import { defaultEnvFlags } from "../../core/args.js";
import doInit from "./init.js";
import doCreate from "./create.js";
import doPull from "./pull.js";
import doPush from "./push.js";
export default function mountEnv(parent) {
    const env = parent.command("env").description("Environment management");
    const addCommon = (cmd) => cmd
        .option("-c, --config <path>", "Path to envs.json")
        .option("-u, --base-url <url>", "API base URL")
        .option("--list-path <tpl>", "List endpoint template")
        .option("--read-path <tpl>", "Read endpoint template")
        .option("--create-path <path>", "Create endpoint path")
        .option("--push-path <tpl>", "Push endpoint template")
        .option("-q, --quiet", "Quiet mode");
    addCommon(env
        .command("init")
        .description("Fetch remote env list, write local .env files, fill/merge envs.json")
        .argument("<project>")
        .argument("<category>")
        .option("--overwrite", "Overwrite local files if they exist")).action(async (project, category, options, cmd) => {
        const flags = defaultEnvFlags(optsToArgv(cmd, options));
        await doInit(project, category, flags);
    });
    addCommon(env
        .command("create")
        .description("Scan/merge envs.json, create missing secrets")).action(async (options, cmd) => {
        const flags = defaultEnvFlags(optsToArgv(cmd, options));
        await doCreate(flags);
    });
    addCommon(env
        .command("pull")
        .description("Pull envs (multi via envs.json) or single secret when <secret> is provided")
        .argument("[secret]")
        .option("-p, --path <file>", "Output file for single pull")
        .option("--name <name>", "Mapping name stored in envs.json for single pull")).action(async (secret, options, cmd) => {
        const flags = defaultEnvFlags(optsToArgv(cmd, options));
        await doPull(flags, secret);
    });
    addCommon(env
        .command("push")
        .description("Push local .env* files for entries with secret")).action(async (options, cmd) => {
        const flags = defaultEnvFlags(optsToArgv(cmd, options));
        await doPush(flags);
    });
}
function optsToArgv(_cmd, options) {
    const out = { _: [] };
    for (const [k, v] of Object.entries(options || {})) {
        out[k] = v;
        out[k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)] = v;
    }
    return out;
}
