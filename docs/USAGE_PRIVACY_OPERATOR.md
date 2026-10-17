# Optional usage reporting — operator checklist

This is an internal operational document, not legal certification. The readable user notice is shown beside the opt-in controls in Welcome and Settings. A copy ships in the installed app's privacy folder.

## Before enabling reporting

The owner confirmed the public controller identity as Kenneth Lund, approved 16+ reporting and accepted Cloudflare's processing terms on 2026-10-12. Both user-facing copies use that name and the expressly supplied contact email only. See USAGE_PROCESSING_RECORD.md for the processing/provider/transfer/risk record and verified service changes. Reporting still requires individual version-2 opt-in, not an automatically satisfied legal certification.

- Obtain the owner's expressly supplied legal controller identity; do not infer it from usernames, account details or deployment URLs. Public contact authorized by the owner: psyfungi100@gmail.com. No phone number, home address, credentials or account identifiers are needed in these documents.
- Set controllerName in src/services/usage-privacy.mjs and update the matching privacy/optional-usage.md copy. Until then, both opt-in controls and the runtime reporter prevent collection.
- Review the applicable Cloudflare contract/DPA, subprocessors, actual service/log retention and international-transfer safeguards for the deployed account. A generic DPA link is not proof that the deployment's legal obligations are fulfilled.
- Check notice accuracy against actual collection and retention. Do not call persistent hashed installation records anonymous. Document future changes; obtain fresh consent if purposes or scope materially change.
- Confirm opt-in starts reporting only after consent, withdrawal aborts work, and privacy links work in the packaged app. Reading a notice is not consent.

## Handling privacy requests

Monitor the contact inbox. Usually respond within one month; document any legally permitted extension. Do not request identity documents or extra personal information solely to link pseudonymous usage records.

If the user voluntarily supplies their reporting UUID, validate its format. Derive the stored installation hash using the existing private salt and the collector's exact digest algorithm in trusted owner-side code. Never disclose the salt, admin token or UUID publicly. Requests without an available ID may be impossible to link; explain this rather than asking for library exports, hardware identifiers or unrelated identity data.

From the repository root, use node admin/usage-dashboard/privacy-request.mjs export for an access/portability request or node admin/usage-dashboard/privacy-request.mjs erase for an applicable deletion request. The helper prompts for the UUID, never an email lookup; export requires the existing admin credential from Windows Credential Manager. Erase requires typed DELETE confirmation. The collector uses exact-ID bound queries and never returns other installation records. Export files are in the ignored admin/usage-dashboard/private folder: transmit securely to the requester and remove after fulfillment. Do not put requests/exports in Git or send them to a third party without authority.

Turning off reporting now requests live server deletion automatically. Pending usage events are removed; only the UUID needed for offline erasure retry is held until acknowledgment. New reporting waits for deletion. A 35-day hashed anti-replay marker and provider recovery copies are disclosed, not hidden analytics retention. The ID lookup can show a pending-deletion UUID. Users can retry deletion from the notice without enabling reports.

Before any database recovery, stop collection and preserve the latest deletion markers outside the database being restored. Reapply those exact-ID removals/markers and scheduled retention before restarting. Never restore withdrawn data into active analytics. Maintain the owner contact inbox and follow the incident/request checklist in USAGE_PROCESSING_RECORD.md.

## Internal records, not extra public personal details

Keep a proportionate record of purposes, data categories, consent handling, recipients, safeguards, retention and request handling. Keep provider contracts and any required transfer assessment privately. Consider whether a formal processing record is required for this continuing activity; a small/private project is not a blanket GDPR exemption.

No standalone website page is inherently mandated by GDPR Articles 12–13 if users receive accessible information before consent inside the app. Other services (feedback, AI, online providers) require their own accurate disclosures where applicable; this notice does not certify the whole app.

Reference: https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng (Articles 5, 7, 11–13, 28, 30 and 44–49).
Provider: https://www.cloudflare.com/cloudflare-customer-dpa/
