import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { USAGE_PRIVACY, USAGE_PRIVACY_READY } from '../src/services/usage-privacy.mjs';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const copy = read('../public/privacy/optional-usage.md');
assert.equal(USAGE_PRIVACY.contact, 'psyfungi100@gmail.com');
assert.equal(USAGE_PRIVACY.controllerName, 'Kenneth Lund');
assert.equal(USAGE_PRIVACY_READY, Boolean(USAGE_PRIVACY.controllerName.trim()));
assert(copy.includes(USAGE_PRIVACY.controllerName || 'Not yet confirmed — draft notice; reporting unavailable'));
for (const [title, body] of USAGE_PRIVACY.sections) { assert(copy.includes(title)); assert(copy.includes(body)); }
assert(!/ADMIN_TOKEN|PRIVACY_SALT|workers\.dev|account_id|C:\\Users/i.test(copy));
assert(copy.includes('pseudonymous') && copy.includes('90 days') && copy.includes('365 days'));
assert(copy.includes('requests deletion') && copy.includes('one month') && copy.includes('16 or older'));
assert(copy.includes('35 days') && copy.includes('30 further days'));
const welcome = read('../src/components/WelcomeModal.jsx');
const settings = read('../src/components/SettingsModal.jsx');
const component = read('../src/components/UsagePrivacyNotice.jsx');
const hook = read('../src/state/use-usage-reporting.mjs');
assert(read('../src/App.jsx').includes('settings.usageConsentVersion === 2'));
assert(read('../src/components/modules/ModuleWindowApp.jsx').includes('value?.themeSettings?.usageConsentVersion === 2'), 'detached Lounge must use the same consent version, not withdraw an opted-in main window');
assert(welcome.includes('<UsagePrivacyNotice />') && settings.includes('<UsagePrivacyNotice />'));
assert(welcome.includes('disabled={busy || !USAGE_PRIVACY_READY}'));
assert(settings.includes('v && USAGE_PRIVACY_READY'));
assert(hook.includes('enabled = enabled === true && USAGE_PRIVACY_READY'));
assert(component.includes('aria-expanded={expanded}') && component.includes('aria-controls={regionId}'));
assert(component.includes('Retry deletion now') && hook.includes("window.addEventListener('neolib:usage-delete-retry', online)"));
assert(component.includes("localStorage.getItem(USAGE_KEY)") && !component.includes('fetch('));
assert(!component.includes('onImprove') && !component.includes('setSettings'));
assert(welcome.includes('a[href], [tabindex="0"]'), 'welcome trap includes notice links and scroll region');
const pkg = JSON.parse(read('../package.json'));
assert(pkg.build.files.includes('dist-renderer/**/*'));
assert(pkg.build.extraResources.some(item => item.from === 'public/privacy' && item.to === 'privacy'));
const require = createRequire(import.meta.url);
const babel = createRequire(require.resolve('@vitejs/plugin-react'))('@babel/core');
for (const file of ['UsagePrivacyNotice', 'WelcomeModal', 'SettingsModal']) {
  babel.parseSync(read('../src/components/' + file + '.jsx'), { configFile: false, babelrc: false, parserOpts: { plugins: ['jsx'] } });
}
console.log('PASS: matching shipped privacy copy, authorized contact only, both opt-in links, operator-readiness runtime/UI gate, notice does not grant consent, local-only reporting-ID lookup, focus access and packaging configuration. Legal/provider review and packaged UI acceptance remain separate.');
