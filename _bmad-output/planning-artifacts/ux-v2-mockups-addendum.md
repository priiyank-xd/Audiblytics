# UX v2 Mockups Addendum

One-page pointer for **Epic 14: Product UI Refresh** (May 2026). Supplements [`ux-design-specification.md`](ux-design-specification.md) (Direction A editorial shell); the v2 mocks define the **soft-card dashboard** target shipped in Epic 14.

## Mockup folder

[`_bmad-output/design/ui-mockups-v2/`](../design/ui-mockups-v2/index.md) — screen index, palette notes, and PNG references per route (Home, Today, Voice Journal, Collection, Review, Journey, Settings sub-pages).

**Palette (approximate):** cream background `#F9F7F2`, forest green primary `#1B3D2F`, white cards, 12–16px border radius, serif headings + sans UI.

**Stretch (UI shells only in Epic 14.9):** live pace/clarity badges, AI session reflection, mood picker — no new LLM calls unless a future story wires them.

## API mode vs mockups

The mockups assume the v2 sidebar shell (Home, Review, Collection, Voice Journal, Journey, Stats). When `NEXT_PUBLIC_STORAGE_BACKEND=api`:

| Mockup assumption | Implementation |
|-------------------|----------------|
| Settings → Advanced provider/key | Gemini key saved via `PATCH /settings` → Postgres `gemini_api_key` (not browser localStorage vault) |
| Login before app | `/login` + `AuthGate`; httpOnly `audiblytics_session` cookie; `/api/v1/*` proxied through Next.js for same-origin cookies |
| Today paragraph generate | Server `POST /paragraphs/generate` using DB-stored key; optional `GEMINI_API_KEY` in `apps/api/.env` as dev fallback only |

Local-only mode (`NEXT_PUBLIC_STORAGE_BACKEND=local`) still uses the provider-key vault in Settings and browser LLM client — unchanged from Epic 1.

## Related docs

- [`architecture-v2-fastapi-backend.md`](architecture-v2-fastapi-backend.md) — BV4–BV12 backend phases
- [`epics.md`](epics.md) — UX-V2-UI1–UI9 requirements mapped to Epic 14 stories
