# Optional usage reporting — operational privacy record

Review date: 2026-10-12. Scope: the separate optional-usage service only, not all NEO-LIB integrations. This records current implementation and a proportionate risk screening, not a professional legal opinion or universal compliance certification.

## Controller and choices

Controller: Kenneth Lund; contact: psyfungi100@gmail.com. Both expressly supplied for public use. No other owner account identity or personal details are included. The owner approved reporting only for users who affirm they are 16 or older and confirmed acceptance of Cloudflare's processing terms on 2026-10-12. This is a record of owner confirmation, not a claim that a separate signed contract was downloaded.

Consent version 2 covers the notice, age affirmation and reporting scope. Controls start off; declining removes no features. Old consent version 1 does not authorize collection under the new notice. No birthday, exact age or identity-document collection. This is a low-data self-declaration, not verified age assurance; reassess if the service is deliberately targeted at children or local law requires stronger assurance.

## Processing activity and necessity

Purpose: estimate opted-in first opens, completed setup and continued meaningful use; not advertising attribution, surveillance of games, unique-person verification or automated decisions. Categories: reporting UUID in transit/local storage, salted hash at rest, UTC event day, event kind, app version and notice version. Activity uses local input recency to qualify foreground time; no input contents, library, game names or hardware identifiers leave the client.

Analytics basis: consent, Article 6(1)(a). Consent evidence: notice version stored with first report day and app version, matched to the versioned user-facing text and opt-in UI. Public events can be forged, so this is not cryptographic proof of an individual click.

IP-derived hourly rate bucket: legitimate interests in availability/abuse prevention, Article 6(1)(f); short retention and salted identifiers reduce intrusion. A legitimate-interest screening finds no advertising, cross-service matching or individual score, while public ingress needs rate limiting. Objection contact and purpose are disclosed.

Withdrawal marker: minimum hashed identity plus expiry, Article 6(1)(c), to honor erasure and stop delayed uploads reinstating deleted records. No analytics use. Thirty-five days covers the provider's documented recovery window plus a small operational margin. Do not repurpose it.

## Recipients, location and provider terms

Cloudflare processes Worker/D1/KV data for the controller; only the owner accesses the authenticated aggregate dashboard or a narrowly scoped privacy-request export. No other analytics vendor or advertising recipient. Owner credentials remain in Windows Credential Manager and Worker secrets, never the client.

Cloudflare's Self-Serve Subscription Agreement section 6.1 incorporates its DPA. Owner confirmation is recorded above. DPA sections 4 and 6 describe sub-processors and contractual transfer safeguards. Review changes and relevant provider notifications; do not claim EEA-only processing. One observed D1 query was served in EEUR/ARN, which is not a guarantee of regional confinement.

The proportionate transfer screening considers global IP/connection processing and potential foreign-law access. Only pseudonymous minimal reports are transferred; HTTPS, access controls, private salting, no raw IP analytics field, no game/library matching and short security retention reduce consequences. Cloudflare still sees connection IPs and may process infrastructure metadata; salting does not anonymize everything or eliminate transfer risk. Seek specialist review if volume, linkage, sensitive data or purposes expand, or if a suitable transfer safeguard ceases to apply. Contract clauses alone are not a claim of zero risk.

## Retention, deletion and recovery

Daily cron removes active-day rows older than 90 days, install/setup rows older than 365 days and withdrawal markers past their 35-day expiry. Days are UTC; deletion occurs at the next successful cleanup. Hourly KV rate buckets expire after one hour.

Withdrawal aborts reporting, clears usage events and requests deletion of the installation's live rows. While offline, only its UUID is retained for erasure retry at reconnect/start; no new reporting starts until acknowledgment. A never-opted-in client creates no ID and makes no analytics/deletion request.

D1 recovery copies retain previous states for up to 30 days (seven on Free). They are not used for statistics. Before restoring any database, pause collection, preserve the latest deletion markers separately, restore in isolation, reapply markers/removals and retention, verify, and only then resume. Do not export unbounded database backups elsewhere. Security/provider metadata follows Cloudflare's documented purpose-based policies; no invented fixed provider-log expiry is promised.

Persisted Worker invocation logs are explicitly disabled in the deployed Wrangler configuration; collector code never logs request bodies or IDs. Provider service/security metrics are separate and cannot be represented as disabled by this setting.

## Requests, incidents and continuing duties

Access/portability: use the owner-only privacy-request helper with the voluntarily supplied reporting ID; authenticated lookup returns only that identity's data. Erasure: app withdrawal or the owner's exact-ID helper. Correction/restriction: assess the request, stop/restrict linked processing as appropriate, correct or erase inaccurate records without collecting unrelated identity data. If no ID can be linked, explain that limitation; do not identify someone just to find anonymous-looking records.

Normally respond within one month; document justified extensions. Keep request/incident correspondence privately, not in Git or release resources. Delete temporary exports after fulfilling requests. Any record retained for legal claims requires a separately documented necessity, access limit and retention schedule.

For a suspected breach: stop affected collection/access, preserve limited evidence securely, rotate compromised admin credentials, assess affected scope and risks, document decisions. GDPR Article 33 generally requires notifying the authority within 72 hours of awareness unless unlikely to risk individuals; Article 34 requires informing affected individuals without undue delay where high risk, subject to its exceptions. Do not blindly rotate the stable privacy salt: it affects record linkage and erasure.

Preliminary DPIA/DPO screening: no special-category/criminal data, decisions about individuals, public-area monitoring, matching with advertising datasets or known large-scale sensitive monitoring in this limited service. No mandatory DPIA/DPO trigger is identified on these facts, not an exemption for every future feature. Reassess growing scale, children, sensitive/linkable data and new purposes. Recurring reporting is not treated as merely occasional: keep this processing record available for supervisory requests.

## Evidence and references

- Source tests exercise consent reset, no-consent/no-network, actual SQLite deletion/access, offline retry, scoped authenticated lookup, late-upload protection and notice parity.
- Deployed upgrade adds consent_version and withdrawals; live synthetic lookup/withdrawal/anti-replay tests passed and only the fixture rows/marker were removed. Real user records were not exported.
- Full prebuild passes; packaged Windows first-run/Settings/privacy/controller acceptance remains an independent release gate.
- Production renderer compile passes (2385 modules); actual saved owner credentials were checked against compiled client text and were absent. Dashboard auth/nonce/origin checks and zero baseline are confirmed. No client version bump, push or installer publication has occurred.
- GDPR: https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng
- EDPB small-business guide: https://www.edpb.europa.eu/sme/be-compliant/be-compliant_en
- Cloudflare agreement: https://www.cloudflare.com/terms/ (section 6.1)
- DPA: https://www.cloudflare.com/cloudflare-customer-dpa/
- Sub-processors: https://www.cloudflare.com/gdpr/subprocessors/
- Infrastructure privacy: https://www.cloudflare.com/privacypolicy/
- D1 recovery: https://developers.cloudflare.com/d1/reference/time-travel/
