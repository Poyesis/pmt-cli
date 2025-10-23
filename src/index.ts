#!/usr/bin/env node
import { Command } from "commander";
import login from "./commands/login.js";
import logout from "./commands/logout.js";
import mountEnv from "./commands/env/index.js";

const program = new Command();
program
  .name("pmt")
  .description("Poyesis Management Tools CLI")
  .version("0.1.0");

program
  .command("login")
  .description("Authenticate CLI (save API base URL + token)")
  .action(login);
program.command("logout").description("Clear saved token").action(logout);

mountEnv(program);

program.parseAsync().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
