/*
 * Build-time Discord Rich Presence configuration.
 *
 * This checked-in fallback always remains empty. GitHub Actions validates the
 * optional `NEOLIB_DISCORD_APP_ID` setting and writes the ignored sibling
 * `discord-config.generated.js` before provenance/build. Packaged code prefers
 * that generated file. Empty = Discord RPC disabled silently.
 *
 * To enable for a local release build, set the three NEOLIB release environment
 * values and run `npm run prepare:release-config` before building. Never edit
 * this tracked fallback or commit the generated sibling.
 */
module.exports = {
  DISCORD_APP_ID: '',
};
