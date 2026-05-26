# online-tools

Personal tools site hosted on GitHub Pages — [amitcsenita.github.io/online-tools](https://amitcsenita.github.io/online-tools/)

Built as a hands-on exploration of hosting a full end-to-end production app entirely on free-tier infrastructure: static frontend on GitHub Pages, serverless backend on Vercel, Postgres on Supabase, and identity via Firebase Auth.

---

## Live Pages

| Page | URL | Description |
|---|---|---|
| Home | `/index.html` | About + tools directory |
| Calculator | `/calculator.html` | Four-function calculator with persistent history |
| Scientific Calculator | `/scientific-calculator.html` | Trig, logarithms, powers, constants |
| Daily Planner | `/todo.html` | 24-hour scheduler with week chart |
| Admin Dashboard | `/admin.html` | Owner-only view of all users' data |

---

## Architecture

```
GitHub Pages (this repo)          Vercel Serverless API
  Static HTML + JS           →    github.com/amitcsenita/vercel-api-backend
  Firebase Auth (client)          Firebase Admin SDK (server)
                                  Supabase (Postgres)
```

**No build step.** Plain HTML, CSS, and vanilla JS — no frameworks, no bundler. Every page is a self-contained file.

**Auth flow:**
1. User clicks "Sign in" → Google OAuth popup via Firebase Authentication
2. Firebase returns an ID token (JWT) stored in memory
3. Every API call sends `Authorization: Bearer <token>` to the Vercel backend
4. Backend verifies the token, extracts `uid`, scopes all DB queries to that user

**Data flow:**
- Calculator history and planner tasks are stored per-user in Supabase
- `uid` from Firebase is the foreign key linking identity to data
- Names are never stored in Supabase — resolved on-the-fly from Firebase Admin when needed (admin view only)

---

## Pages in Detail

### `index.html` — Home
- Personal bio, role, and links
- Tool directory with navigation
- Shows sign-in nudge when logged out
- Reveals Admin Dashboard link only for the owner account

### `calculator.html` — Calculator
- Standard four-function calculator
- Saves each calculation to the backend on `=`
- History panel loads on sign-in; hidden behind auth gate when signed out

### `scientific-calculator.html` — Scientific Calculator
- Trigonometric functions (sin, cos, tan) with DEG/RAD toggle
- Logarithms (log, ln), powers, square root, factorial
- Constants: π, e
- Same history persistence as the basic calculator

### `todo.html` — Daily Planner
- 24-hour grid (00:00 – 23:00), one task per hour
- Click any hour to add or edit a task; saves automatically on blur (no Save button)
- Mark tasks done with the checkmark button; strikethrough + green highlight
- Categories: Work (blue), Personal (terracotta), Health (green), General (gray)
- Navigate days with ← → arrows or the date picker
- **This Week chart** — stacked bar per day showing done (green) vs pending (tan), with `done/total` count label
- **Day streak** badge counts consecutive days with at least one task

### `admin.html` — Admin Dashboard
- Restricted to `amitcse.nita@gmail.com` — enforced both on the frontend (link hidden) and backend (token email check)
- **Summary tab:** all users with real display names (resolved from Firebase), calculation count, task count
- **Calculations tab:** last 100 calculations across all users
- **Tasks tab:** all tasks for a selected date across all users

---

## Shared Auth Module — `firebase-auth.js`

Included by every page. Provides:

| Export | Description |
|---|---|
| `window.fbSignIn()` | Opens Google OAuth popup |
| `window.fbSignOut()` | Signs out and reloads |
| `window.getIdToken()` | Returns current Firebase ID token |
| `window.authHeaders()` | Returns `{ Content-Type, Authorization }` headers for API calls |
| `window.showAuthGate(elementId)` | Replaces an element with a sign-in prompt |
| `window.onAuthReady(user)` | Callback fired once auth state is known — each page implements this |

Renders the auth area in the page header: user avatar + name when signed in, Sign In button when signed out.

---

## Infrastructure (all free tier)

| Service | Role | Cost |
|---|---|---|
| GitHub Pages | Static file hosting | Free |
| Firebase Authentication | Google OAuth, ID tokens | Free (Spark plan) |
| Vercel | Serverless API functions | Free (Hobby plan) |
| Supabase | Postgres database | Free (500 MB) |

---

## Design

- **Color palette:** warm paper tones — `#F1EBDF` background, `#B65A33` accent
- **Typography:** Instrument Serif (italic headings) + Geist (body/UI)
- **No CSS framework** — all styles are hand-written per page
- Subtle grain texture and radial gradient on the background
- Cards with inner highlight shadow for depth
- Responsive down to mobile; reduced-motion media query respected

---

## Related Repos

- **[vercel-api-backend](https://github.com/amitcsenita/vercel-api-backend)** — the Vercel serverless API this frontend calls
