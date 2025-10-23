import { clearLoginToken } from "../core/config.js";
export default async function logout() {
    await clearLoginToken();
    console.log("✅ Logged out (token removed).");
}
