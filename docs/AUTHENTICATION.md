# Authentication and Authorization

## Sign-in and session model

Lisan uses Auth.js credentials authentication and the installer-compatible salted scrypt password format. Login accepts every active role; destination routes enforce authorization independently. Sessions are encrypted JWTs with an eight-hour maximum age and 30-minute update interval. Cookies are HTTP-only, `SameSite=Lax`, scoped to `/`, and use `Secure` plus `__Secure-`/`__Host-` names in production.

Every session lookup reads the user by immutable ID and refreshes role, status, name, email, and session version from MySQL. Missing/suspended/deleted accounts produce no authenticated user. Password reset increments `session_version`, invalidating prior sessions. Future hash upgrades must verify the current scrypt envelope and replace it only after a successful login.

## Authorization

Server-only helpers include `requireSession`, `requireUser`, `requireRole`, `requireAdmin`, and `requireSuperAdmin`. Student-only onboarding uses `requireRole(["student"])`; admin routes use `requireAdmin`. Direct page access is protected server-side, and later actions/handlers must repeat authorization at their mutation boundary. Browser fields, unrefreshed JWT role claims, and UI visibility are not trusted.

## Registration

Signup validates full name, normalized email, a 12–128 character mixed password, and matching confirmation. Creation is transactional: the learner receives the active `student` role, Bangla native/Arabic target language, Bangladesh/Asia-Dhaka defaults, standard mode, ten-minute goal, onboarding state, and an enrollment in the initial draft course when present. The unique email constraint is authoritative and database errors are translated to safe messages.

## Password recovery

Forgot-password always returns an account-neutral response. Requests and token attempts use MySQL rate-limit buckets. For an active account, Lisan invalidates older unused reset records, generates 256 random bits, stores only a SHA-256 hash, and sends a 30-minute link through `EmailProvider`. Token consumption locks the row, updates the scrypt hash, increments session version, and marks the token used in one transaction.

SMTP is the initial email adapter. When it is absent or delivery fails, the public response still avoids enumeration and does not promise confirmed delivery. The application never logs the address/token combination. Verification and invitation tables are prepared for later workflows.

## Route behavior

- Uninstalled applications redirect protected/auth routes to `/install`.
- Authenticated users visiting login, signup, forgot, or reset routes go to `/learn`.
- Unauthenticated private routes go to `/login`.
- A student requesting `/admin` is redirected to `/learn`.
- `/admin/login` remains a compatibility redirect to `/login`.
- An authenticated student whose onboarding is incomplete is redirected from learner dashboard/profile/settings/course pages to `/learn/onboarding`.
- Onboarding completion and all learner profile/settings actions repeat student authorization server-side; no user or role identifier is accepted from the browser.
