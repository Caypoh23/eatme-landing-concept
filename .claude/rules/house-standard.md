# House standard (agent-kit)

The default way Bobur's projects are built. It was distilled from what Oyna, eatme mobile and Statura
already do. Precedence: the repository's own `AGENTS.md` / `CLAUDE.md` / `.claude/rules/` win where they
are more specific; this standard fills every gap and is the default for new projects and new code.

## 1. Process: decide first, then code

1. **Spec before code.** Every non-trivial task starts with a spec: goal, acceptance criteria, edge cases,
   open questions, out of scope. Store it in `docs/specs/<TASK-ID>-<slug>.md` (or in the task tracker).
   If an open question changes behaviour, stop and ask; never guess business rules.
2. **Tests first** for domain logic and state: write the failing test, then the code.
3. **Verify with evidence.** Run lint and tests until green and paste the summary lines. "Done" without
   command output is not done.
4. **Small draft PR** that links the spec and says how to check it. Never merge, force-push, deploy,
   change CI or release without an explicit request.
5. **Corrections become rules.** When the same review comment appears twice, add it to the repo rules
   (or to agent-kit if it applies to every project).

## 2. Flutter architecture

- **Workspace monorepo** (Dart workspace or melos). The app (`app/` or `lib/`) is the composition root
  only: `main.dart`, bootstrap, router, DI wiring.
- **Feature packages:** `features/<feature>/lib/src/{domain,data,di,presentation}`;
  `presentation/{bloc,view,widgets,router}` as needed. Shared code lives in `packages/`
  (`core`, `uikit`, `localization`, `test_utils`, …).
- **domain:** pure Dart. Entities, repository interfaces, use cases (only when there is real logic).
  No Flutter, no Supabase, no Dio imports.
- **data:** DTOs, data sources, repository implementations. Map every external error to the sealed
  `AppFailure` (or the repo's equivalent) at this boundary.
- **di:** Riverpod `Provider`s for composition only. No business state lives in Riverpod.
- **presentation:** BLoC/Cubit owns state and workflows (use `bloc_concurrency` transformers for
  events that can overlap). Views are dumb. States are immutable and comparable (sealed + Equatable).
- **Isolation:** features never import each other. Compose their public APIs in the app; share
  contracts through `core` or a domain package.
- **Navigation:** `go_router`; each feature exports its routes.
- **Strings:** `slang`; no hard-coded user-facing text.
- **UI:** components from the UI kit package and design tokens; no raw hex colours or magic spacing
  outside the brand/token package.
- **Backend:** Supabase only through the data layer. Secrets never in the repo.

## 2b. Web (Next.js / React / TypeScript)

Distilled from the eatme admin panel engineering contract; that repo's `AGENTS.md` stays the authority there.

- **pnpm workspace + Turborepo.** The Next.js app (`src/app/`) owns URLs, layouts and composition only;
  a `page.tsx` adapter stays tiny and holds no business rule.
- **Feature packages** with `domain/`, `data/`, `di/`, `presentation/` and a `routes/` delivery adapter.
  Domain imports neither data nor React/Next; data implements domain ports; presentation never imports
  data or DI. No feature-to-feature imports, no wildcard barrels, explicit `package.json` `exports`.
- **Runtime markers, not layers:** `.server.ts(x)` + `server-only`, `.client.ts(x)` + `client-only`.
  Request-scoped data comes from server-only adapters into Server Components; TanStack Query only for
  client-interactive cache; shareable filters live in the URL.
- **UI:** one UIKit package is the only reusable component source; brand tokens are generated from the
  design-token contract; no raw colours, spacing, typography, radius, shadow or z-index outside tokens.
- **Code rules:** TypeScript strict, no `any`, no unexplained `eslint-disable`/`@ts-ignore`; every async
  state covers success, loading, empty, error, permission-denied and retry; destructive actions confirm,
  are idempotent and have a tested failure path; auth is enforced server-side.
- **Tests:** Vitest for unit/component/contract, Playwright for E2E and visual snapshots, axe for
  accessibility; coverage follows the feature's evidence matrix.

## 2c. Small services and static sites

- **Deno/Node services** (e.g. the team bot): web-standard core in `src/`, runtime-specific code at the
  edge, `deno task test|check|lint` (or `pnpm` equivalents) green before commit, secrets only in the
  macOS Keychain or the platform secret store.
- **Static sites** (concepts, landings): plain HTML/CSS/JS, no build step unless needed, assets
  optimised, deployed by GitHub Pages from `main`; brand tokens copied from the brand package.

## 3. Testing

| Layer | Required | Tools |
|---|---|---|
| domain | a unit test per use case and per non-trivial entity rule | `test` |
| state | every event → states, including failures and loading | `bloc_test` |
| dependencies | always mocked | `mocktail` |
| screens | widget tests for key screens, golden tests for the UI kit and key screens | `flutter_test`, golden harness |
| end-to-end | 3–5 critical user journeys per app | `patrol` or `integration_test` |

`flutter analyze` must report no issues and all tests must pass before a commit.

## 4. Same verbs in every repository

`make setup` · `make lint` · `make test` · `make e2e` · `make run` · `make release`.
If a repository has no `Makefile` yet, map these verbs to its melos/fvm commands, say which command you
ran, and propose adding the `Makefile`.

## 5. Git and worktrees

- One task = one branch = one worktree = one PR. Branch name: `<type>/<TASK-ID>-<slug>`
  (e.g. `feat/TSK-255-cancel-subscription`). Never name worktrees after cities or random words.
- Conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
- Notes never live next to code; they go to the hq vault.
- Remove a worktree after its PR is merged.

## 6. Safety

- Never open, print or copy secrets, keystores, certificates, signing folders or production backups.
- Never message people (Telegram, email, Slack); prepare drafts only.
- When something is missing (access, secret, answer), say exactly what and stop — do not mock or guess.

## 7. Handoff

At the end of a working session run `/handoff`: update `projects/<project>/now.md` in the hq vault
(`~/Documents/hq` unless `HQ_DIR` is set) and the PR description, so the next session — yours, another
account's or Codex's — starts where this one stopped.
