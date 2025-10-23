import prompts from "prompts";
import { readLoginConfig, writeLoginConfig } from "../core/config.js";
import { LoginResponse } from "../types.js";

export default async function login() {
  const cur = (await readLoginConfig()) ?? {
    apiBaseUrl: "https://api.poyesis.fr",
  };
  const { email, password } = await prompts([
    {
      type: "text",
      name: "email",
      message: "Email",
      initial: cur.email ?? "",
      validate: (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? true : "Enter a valid email",
    },
    {
      type: "password",
      name: "password",
      message: "Password",
      validate: (v) => (v && v.length > 0 ? true : "Enter your password"),
    },
  ]);

  const endpoint = "https://api.poyesis.fr/auth-pm/login-cli";
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (e: any) {
    console.error(
      `Network error while calling ${endpoint}: ${e?.message ?? e}`
    );
    process.exit(1);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      `Login failed: HTTP ${res.status} ${res.statusText}${
        body ? `\n${body}` : ""
      }`
    );
    process.exit(1);
  }

  const json: LoginResponse = await res.json();

  const token = json.accessToken;

  if (!token) {
    console.error("Login failed: response did not include a token.");
    process.exit(1);
  }

  // Prefer API base URL from server; fallback to fixed domain
  const apiBaseUrl = cur.apiBaseUrl;

  await writeLoginConfig({
    apiBaseUrl,
    token,
    email,
  });

  console.log("✅ Logged in. Token saved to ~/.pmt/config.json");
}
