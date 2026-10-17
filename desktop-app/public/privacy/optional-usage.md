# Optional usage reporting — privacy and consent

Updated 2026-10-12 · Notice version 2

Responsible operator: Kenneth Lund. NEO-LIB is an independent private project. Contact: psyfungi100@gmail.com.

## Your choice

Optional usage reporting helps this independent, privately operated NEO-LIB project understand first opens, setup completion and continued app use. The legal basis for these usage reports is your consent. Reporting is off by default. Ticking Help improve NEO-LIB confirms that you are 16 or older and gives consent to this specific reporting; opening this notice does not. Do not enable reporting if you are under 16. Declining does not remove any features. No date of birth or exact age is collected.

## What is reported

Reports contain a random installation ID, app version, event type (first open, setup complete or active day), date in UTC, and reporting/consent format versions. Active days mean at least two minutes of foreground app activity with recent interaction. Input is observed locally to qualify activity, but keystrokes, clicks and input history are not sent. First open means first reported opt-in use, not proof of an installation or a unique person.

## What is not reported

No game names, library contents, files, usernames, hardware identifiers, precise location, advertising identifiers or input history are included in usage reports. No advertising or automated decisions about you are made from these reports. This notice covers optional usage reporting only, not online services you separately choose to use.

## Storage and recipients

The project operator receives aggregate statistics through a private dashboard. Cloudflare hosts the collector and storage as a service provider. Server records use a privately salted hash of the random installation ID and record the consent-notice version. These records are pseudonymous, not guaranteed anonymous. Cloudflare receives your IP address and ordinary connection metadata to deliver and secure the service. The collector does not store a raw IP field in the usage database; it uses a salted hourly IP-derived rate-limit bucket with a one-hour expiry. Persisted Worker invocation logs are disabled. Cloudflare may separately process infrastructure/security metadata under its published policies.

## International processing

Cloudflare operates globally, so processing may occur outside Norway and the EEA, including the United States. Cloudflare describes its processing terms and international-transfer safeguards, including standard contractual clauses, in its Data Processing Addendum. This is not a promise of EEA-only storage.

## Service security

The short-lived IP-derived rate-limit bucket protects the service against abuse. Its legal basis is the operator’s legitimate interest in service security, not consent to analytics. It is not used for advertising or to follow your app activity. You may object to this processing by contacting the operator; necessary security processing may continue where legally justified.

## Retention

Daily cleanup removes active-day records older than 90 days and installation/setup records older than 365 days from the first recorded day. The local pending queue contains at most ten events; events older than eight days are discarded before sending. Cloudflare D1 recovery copies may retain deleted database records for up to 30 further days (seven days on its Free plan); they are not used for ordinary statistics. A hashed deletion marker is kept for 35 days solely to prevent delayed uploads restoring withdrawn records; its legal basis is compliance with erasure/withdrawal obligations, not analytics consent. Cloudflare infrastructure metadata has separate provider policies and is not covered by these usage-database retention limits.

## Withdraw consent

Turn off Help improve NEO-LIB in Settings at any time. This stops reporting, aborts pending uploads, clears queued usage events and requests deletion of that installation’s live server usage records. If offline or the request fails, only the old reporting ID is retained locally for deletion retry on the next connection/app start; it is removed when deletion is confirmed. New reporting waits until that deletion completes. Withdrawal does not make earlier lawful processing unlawful. The deletion request sends the old ID and connection metadata only, not another usage event. Never send your library, password, API keys or hardware details.

## Your rights and contact

Email psyfungi100@gmail.com for questions or requests for access, correction, deletion, restriction or portability where applicable. Providing your reporting ID, if still available, helps locate pseudonymous records; an email address alone does not identify them. We will not ask you to identify yourself further solely to link usage records. Requests are normally answered within one month, subject to lawful extensions. You may complain to Norway’s Datatilsynet or your local data-protection authority.

Provider terms: https://www.cloudflare.com/cloudflare-customer-dpa/
Provider privacy: https://www.cloudflare.com/privacypolicy/
Complaints: https://www.datatilsynet.no/en/
