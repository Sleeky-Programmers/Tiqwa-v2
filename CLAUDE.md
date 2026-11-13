@AGENTS.md

# tiqwa-v2

TBiLS flight booking site: Next.js 16 (App Router, Cache Components), React 19, Tailwind 4, TypeScript strict. The browser only talks to this app's `/api/*` route handlers, which call the Premium Whitelabel API (`TIQWA_API_URL`). With that unset the app runs on demo data.

## Quality gate (required before you say a task is done)

```bash
npm run check   # eslint (zero warnings) + tsc + prettier --check
npm run build   # also required when you touch routes, layouts, caching or data fetching
```

- There must be **no lint errors, no warnings, no type errors and no formatting diffs**. Fix the cause; never silence a rule.
- Do not add `eslint-disable`, `@ts-ignore`, `@ts-nocheck` or `any`. The one accepted `eslint-disable` pattern is `react-hooks/set-state-in-effect` for client-only reads (clock, storage), with a `--` reason after it.
- `npm run lint:fix` and `npm run format` fix most issues. A pre-commit hook (husky + lint-staged) runs them on staged files; never bypass it with `--no-verify`.
- Prettier owns formatting (160 columns, double quotes, semicolons, trailing commas). Do not hand-format or fight it.

## Code style

- TypeScript strict. Prefer `type` imports (`import { type X }`), `const`, `===`, template literals and object shorthand. No `var`, no `console.log` (`console.info`, `warn` and `error` are allowed for server diagnostics).
- Components are small and typed. Server components by default; add `"use client"` only when state, effects or browser APIs are needed. Keep client components as leaves.
- Reuse before writing: form primitives in `src/components/ui/form.tsx` (`Field`, `inputCls`, `postJson`), `Select`, `CountryPicker`, dashboard `SectionCard` and `StatCard`, and `cn()` for class names. Match the existing Tailwind tokens (`ink-*`, `blue`, `orange`, `navy-*`).
- Names say what a thing is. Comments explain why, not what. No dead code, no commented-out code, no unused exports.
- Accessibility: labelled inputs, `role="alert"` on errors, keyboard-reachable controls, `aria-label` on icon buttons. Respect reduced motion for any new animation.

## Architecture rules

- **API routes** (`src/app/api/**`): validate input first and return `fail({ code, status, message, fields })`, the one error shape every client reads. Call the backend through `upstream()` in `src/lib/api/upstream.ts`, never `fetch` directly. Branch on `isLive()` so demo mode keeps working.
- **Idempotency**: the backend has no idempotency keys. Use `submitOnce`, `withLock`, `recall` and `remember` from `src/lib/api/idempotency.ts` for anything that sends an email, books, pays or creates a record, and `underLimit` for public endpoints that can be abused.
- **Public backend content** goes through `publicData()` in `src/lib/api/content.ts`; site-wide values (contact, menus, partners, about, blog) live in `src/lib/api/site.ts`. Contact details come from `getContact()` on the server and `useContact()` on the client. Never hard-code a phone, email, address or social link.
- **Cache Components**: reading the clock (`new Date()`, `Date.now()`) or request data during render of a prerendered route breaks the build. Read them in an effect, an event handler or inside Suspense. Run `npm run build` after changing anything that fetches.
- **Features the backend removed or does not support** (newsletter, welcome offer, Properties, notifications, cancellation, membership tiers, profile travel details) stay out. Check `docs/integration-gaps-v2.docx` before adding anything that touches them.
- Guessed backend field names are a risk: say so in your report and add the question to the gaps document.

## Working agreements

- Never commit, push or open a PR unless asked. Never apply database or schema changes (see the global rule).
- Do not use real credentials found in files. Sandbox testing is fine; say which test records you created.
- Verify UI changes in the running app (`npm run dev`, port 4545), not only with the type checker, and report what you could not test.
- Documents written for the user: no em dashes or en dashes, short plain sentences, locations as plain names rather than paths.
