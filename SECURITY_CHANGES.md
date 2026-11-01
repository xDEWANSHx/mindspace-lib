# Local fixes and validation

No migration, schema change, key rotation, remote insert, update, or delete was
performed while implementing or testing these changes. Automated tests use
in-memory database mocks and reject unexpected network access.

## Server configuration

The ignored `.env.local` contains the existing database credential and existing
login credentials, moved out of client source. It also contains a new random
`SESSION_SECRET`. Configure these same **server-only** variables when deploying:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL` (or the existing `NEXT_PUBLIC_SUPABASE_URL`)
- `SESSION_SECRET` (at least 32 random characters)
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `STAFF_USERNAME`, `STAFF_PASSWORD`

Do not use a `NEXT_PUBLIC_` prefix for secrets. Do not commit `.env.local`.
Existing cloud login settings, if present, take priority over environment
defaults. Passwords are never returned by the public settings endpoint. Future
password edits are hashed, and settings saves merge with existing settings.

## Behavior changes

- Signed, eight-hour HttpOnly cookies authorize dashboard and API requests.
  Browser local storage is only a display cache. Existing users must sign in again.
- Database requests go through a same-origin server gateway with staff/admin
  permissions and origin checks. Realtime credential exposure is replaced by
  authenticated refresh every ten seconds and on window focus.
- Payment insert failure stops all balance updates. A saved payment whose member
  update fails returns a warning identifying the existing receipt, rather than
  encouraging duplicate payment entry. These are still separate database writes:
  full transaction atomicity requires a future database transaction/RPC migration.
- Member/payment matching uses IDs, including legacy permanent/student IDs.
  Name-only unlinked legacy payments are retained but are not guessed onto a
  member. No historical records are rewritten or deleted.
- Invoice lookup is exact. Missing/ambiguous IDs return an error. Shared receipts
  use signed links valid for thirty days and return one receipt, not the ledger.
  Old unsigned links require staff/admin login; create a new share link for visitors.
- Enquiry failures preserve form inputs and show an error. No false success state.
- Lint now checks application files. Existing React performance/style warnings
  remain visible instead of being hidden by an ignore-all configuration.
- Google fonts use the same families/weights through a browser stylesheet, so
  production builds do not require Google font downloads. Offline browsers use
  the specified system font fallbacks.

## Remaining security operations

An exposed credential cannot be made secret again by changing source code.
Previously published service-role keys and default passwords may still exist in
Git history and old deployments. Rotate them and retire old deployments before
claiming the application is fully secured. Those remote changes were intentionally
not performed. A durable edge rate limiter is recommended for multi-instance
production hosting; the included login/enquiry throttles are process-local.

## Checks

Run `npm test`, `npm run lint`, and `npm run build -- --webpack`.
Never run the repository's legacy database/wipe scripts as a smoke test.
For production smoke tests, verify anonymous requests to `/api/database/rest/v1/members`
and `/api/invoice?id=missing` return 401, and `/dashboard` redirects to `/login`.
Do not submit admissions, payments, settings, or enquiries against production just
to test the UI. Use the mocked regression suite instead.
