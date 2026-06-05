# Import Audiblytics layout wireframes into Figma

**Why not a `.fig` file?** Figma's native `.fig` format is proprietary and only created inside Figma. There is no reliable way to generate a real `.fig` from this repo. Use the SVG wireframes below instead (fully editable vectors after import).

This folder gives you **editable vector wireframes** you can import and rearrange - **no new features**, only where existing components should move.

## Files

| File | Purpose |
|------|---------|
| `audiblytics-layout-rearrange.svg` | All frames on one canvas — **import this** |
| `audiblytics-layout-rearrange-frames/*.svg` | 8 separate artboards (one file per screen) if you prefer smaller imports |

## Import steps (Figma)

1. Open Figma → **File → New design file** (or open an existing file).
2. **File → Import** (or drag the SVG onto the canvas).
3. Select `audiblytics-layout-rearrange.svg`.
4. Figma creates a group per top-level frame. **Right-click → Frame selection** (or `⌥⌘G` / `Ctrl+Alt+G`) to turn each artboard into a Frame.
5. Rename layers using the labels in the file (`CURRENT — …`, `PROPOSED — …`).
6. Rearrange components inside **PROPOSED** frames only — no new UI; labels mark **existing** React components.

## What’s on the canvas

- **CURRENT** artboards match today’s routes: Home, Today, Review, Collection, Settings (chrome only).
- **PROPOSED** artboards show **rearrange-only**: wire `StatRail` into `layout.tsx`, expand `TopNav` links, keep the same blocks (`ParagraphHero`, `RecordPanel`, `HomeDashboard`, etc.). **DayRail is deprecated** — see `ux-design-specification.md` §Layout Revision 2026-05-20 (user decision: no left DAYS rail).
- Dashed boxes = **placement slots** for metrics you already compute on Home (collection count, streak) — not new product features.

## Optional: live app → Figma

If you want pixels from `localhost:3000` instead of wireframes:

1. Run `cd apps/web && pnpm dev`.
2. Install the Figma plugin **html.to.design** (or **Anima**).
3. Capture `/`, `/today`, `/review`, `/collection`, `/settings`.
4. Align captures with the **PROPOSED** wireframes.

## Tokens (match `globals.css`)

- Surface cream: `#f5f0e6`
- Elevated: `#ebe5d6`
- Border: `#d9d2c5`
- Ink: `#1a1a1a`
- Forest primary: `#2d5b3a`

## Component map (for layer names in Figma)

| Label in SVG | Code |
|--------------|------|
| TopNav | `src/components/audiblytics/TopNav.tsx` |
| DayRail | `src/components/audiblytics/DayRail.tsx` |
| StatRail / StreakStatCard | `StatRail.tsx`, `StreakStatCard.tsx` |
| MainContentShell | `MainContentShell.tsx` |
| HomeDashboard | `HomeDashboard.tsx` |
| ParagraphHero | `ParagraphHero.tsx` |
| RecordPanel | `RecordPanel.tsx` |
| HardWordsList | `HardWordsList.tsx` |
| TodayParagraphControls | `TodayParagraphControls.tsx` |
| HonestyFooter | `HonestyFooter.tsx` |
| SettingsForm + SettingsPillTabs | `settings-form.tsx`, `SettingsPillTabs.tsx` |
| Flashcard | `Flashcard.tsx` |
| CollectionRow | `CollectionRow.tsx` |
| CalendarDayCell | `CalendarDayCell.tsx` |
