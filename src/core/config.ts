import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { PMTConfig } from "../types.js";

const DIR = path.join(os.homedir(), ".pmt");
const FILE = path.join(DIR, "config.json");

export async function readLoginConfig(): Promise<PMTConfig | null> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as PMTConfig;
  } catch {
    return null;
  }
}

export async function writeLoginConfig(cfg: PMTConfig) {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(cfg, null, 2), "utf8");
}

export async function clearLoginToken() {
  const cur = (await readLoginConfig()) ?? { apiBaseUrl: "" };
  delete cur.token;
  await writeLoginConfig(cur);
}
