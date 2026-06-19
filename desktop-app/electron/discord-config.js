/*
 * Build-time Discord Rich Presence configuration.
 *
 * This file is OVERWRITTEN by the GitHub Actions Windows build using the
 * `NEOLIB_DISCORD_APP_ID` repository secret. On local dev builds the value
 * is empty by default, which disables Discord RPC silently.
 *
 * To enable locally: paste your Discord Application ID below as a string.
 *   1. Go to https://discord.com/developers/applications -> New Application
 *   2. Copy the Application ID from "General Information"
 *   3. Paste between the quotes on the next line, save, restart NEO-LIB.
 */
module.exports = {
  DISCORD_APP_ID: '',
};
