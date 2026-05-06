---
version: alpha
name: eddi
description: A warm, school-admin SaaS anchored on a cream canvas (`{colors.background}` — oklch(0.9818 0.0054 95.0986), ~#faf8f3) and a single voltage of warm amber (`{colors.primary}` — oklch(0.6171 0.1375 39.0427), ~#c87a3f) that carries every primary CTA, brand mark, and active sidebar state. Type runs the platform system stack — no custom webfont — at modest sizes; `text-sm` and `text-xs` dominate body copy because eddi is information-rich (timetables, rosters, attendance) rather than editorial. Page titles run a confident `text-3xl font-bold tracking-tight`. Shape language is uniformly soft: every interactive element rounds at 6–8px (`{rounded.md}` / `{rounded.lg}`), avatars and pill badges go full circle. Layout is sidebar-led — a persistent collapsible icon-mode sidebar (`{component.app-sidebar}`) with its own dedicated token group (`{colors.sidebar}`, `{colors.sidebar-foreground}`, etc.) frames every authenticated page. The system trusts shadcn-svelte primitives (42 of them, neutral base) almost untouched, with two semantic colors added on top of stock — `{colors.success}` (warm green) and `{colors.warning}` (amber-yellow) — and one extra Button variant (`success`) for confirmation flows.

colors:
  primary: "oklch(0.6171 0.1375 39.0427)"
  primary-foreground: "oklch(1 0 0)"
  primary-dark: "oklch(0.6724 0.1308 38.7559)"
  secondary: "oklch(0.9245 0.0138 92.9892)"
  secondary-foreground: "oklch(0.4334 0.0177 98.6048)"
  background: "oklch(0.9818 0.0054 95.0986)"
  background-dark: "oklch(0.2679 0.0036 106.6427)"
  foreground: "oklch(0.3438 0.0269 95.7226)"
  foreground-dark: "oklch(0.8074 0.0142 93.0137)"
  card: "oklch(0.9818 0.0054 95.0986)"
  card-foreground: "oklch(0.1908 0.002 106.5859)"
  popover: "oklch(1 0 0)"
  popover-foreground: "oklch(0.2671 0.0196 98.939)"
  muted: "oklch(0.9341 0.0153 90.239)"
  muted-foreground: "oklch(0.6059 0.0075 97.4233)"
  accent: "oklch(0.9245 0.0138 92.9892)"
  accent-foreground: "oklch(0.2671 0.0196 98.939)"
  border: "oklch(0.8847 0.0069 97.3627)"
  input: "oklch(0.7621 0.0156 98.3528)"
  ring: "oklch(0.5937 0.1673 253.063)"
  destructive: "oklch(0.65786 0.20367 24.675)"
  destructive-foreground: "oklch(1 0 0)"
  success: "oklch(0.6171 0.1375 142.0427)"
  success-foreground: "oklch(1 0 0)"
  warning: "oklch(0.80877 0.17029 75.348)"
  warning-foreground: "oklch(1 0 0)"
  sidebar: "oklch(0.9663 0.008 98.8792)"
  sidebar-foreground: "oklch(0.359 0.0051 106.6524)"
  sidebar-primary: "oklch(0.6171 0.1375 39.0427)"
  sidebar-primary-foreground: "oklch(0.9881 0 0)"
  sidebar-accent: "oklch(0.9245 0.0138 92.9892)"
  sidebar-accent-foreground: "oklch(0.325 0 0)"
  sidebar-border: "oklch(0.9401 0 0)"
  sidebar-ring: "oklch(0.7731 0 0)"
  chart-1: "oklch(0.5583 0.1276 42.9956)"
  chart-2: "oklch(0.6898 0.1581 290.4107)"
  chart-3: "oklch(0.8816 0.0276 93.128)"
  chart-4: "oklch(0.8822 0.0403 298.1792)"
  chart-5: "oklch(0.5608 0.1348 42.0584)"

typography:
  page-title:
    fontFamily: "{font.sans}"
    fontSize: 30px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.025em
  display-lg:
    fontFamily: "{font.sans}"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.02em
  display-md:
    fontFamily: "{font.sans}"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0
  card-title:
    fontFamily: "{font.sans}"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: 0
  body-md:
    fontFamily: "{font.sans}"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "{font.sans}"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: 0
  body-xs:
    fontFamily: "{font.sans}"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: 0
  label:
    fontFamily: "{font.sans}"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.43
    letterSpacing: 0
  caption:
    fontFamily: "{font.sans}"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: 0
  button-md:
    fontFamily: "{font.sans}"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.43
    letterSpacing: 0
  button-sm:
    fontFamily: "{font.sans}"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.38
    letterSpacing: 0
  mono:
    fontFamily: "{font.mono}"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: 0

font:
  sans: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
  serif: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"

rounded:
  none: 0px
  sm: 4px   # --radius-sm = calc(0.5rem - 4px)
  md: 6px   # --radius-md = calc(0.5rem - 2px) — Button default
  lg: 8px   # --radius-lg = 0.5rem — Card default
  xl: 12px  # --radius-xl = calc(0.5rem + 4px)
  full: 9999px

spacing:
  px: 1px
  0_5: 2px
  1: 4px
  1_5: 6px
  2: 8px
  3: 12px
  4: 16px
  6: 24px
  8: 32px
  12: 48px
  16: 64px

shadows:
  "2xs": "0 1px 3px 0px hsl(0 0% 0% / 0.05)"
  xs: "0 1px 3px 0px hsl(0 0% 0% / 0.05)"
  sm: "0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 1px 2px -1px hsl(0 0% 0% / 0.1)"
  default: "0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 1px 2px -1px hsl(0 0% 0% / 0.1)"
  md: "0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 2px 4px -1px hsl(0 0% 0% / 0.1)"
  lg: "0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 4px 6px -1px hsl(0 0% 0% / 0.1)"
  xl: "0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 8px 10px -1px hsl(0 0% 0% / 0.1)"
  "2xl": "0 1px 3px 0px hsl(0 0% 0% / 0.25)"

components:
  button-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: 8px 16px
    height: 36px
    shadow: "{shadows.xs}"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "#ffffff"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: 8px 16px
    height: 36px
    shadow: "{shadows.xs}"
  button-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.success-foreground}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: 8px 16px
    height: 36px
    shadow: "{shadows.xs}"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: 8px 16px
    height: 36px
    shadow: "{shadows.xs}"
    border: "1px solid {colors.border}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: 8px 16px
    height: 36px
    shadow: "{shadows.xs}"
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.foreground}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: 8px 16px
    height: 36px
  button-link:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.none}"
  button-icon:
    backgroundColor: transparent
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: 36px
    width: 36px
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xl}"
    border: "1px solid {colors.border}"
    padding: 24px
  card-title:
    typography: "{typography.card-title}"
  card-description:
    textColor: "{colors.muted-foreground}"
    typography: "{typography.body-sm}"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 6px 12px
    height: 36px
    border: "1px solid {colors.input}"
  textarea:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 8px 12px
    border: "1px solid {colors.input}"
  badge-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    padding: 2px 8px
  badge-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    padding: 2px 8px
  badge-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.success-foreground}"
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    padding: 2px 8px
  badge-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.destructive-foreground}"
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    padding: 2px 8px
  badge-outline:
    backgroundColor: transparent
    textColor: "{colors.foreground}"
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    padding: 2px 8px
    border: "1px solid {colors.border}"
  app-sidebar:
    backgroundColor: "{colors.sidebar}"
    textColor: "{colors.sidebar-foreground}"
    typography: "{typography.body-sm}"
    border: "1px solid {colors.sidebar-border}"
  sidebar-item-active:
    backgroundColor: "{colors.sidebar-accent}"
    textColor: "{colors.sidebar-accent-foreground}"
    rounded: "{rounded.md}"
  dialog:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    border: "1px solid {colors.border}"
    shadow: "{shadows.lg}"
    padding: 24px
    maxWidth: 425px
  sheet:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    border: "1px solid {colors.border}"
    shadow: "{shadows.lg}"
    width: 75%
  scrim:
    backgroundColor: "hsl(0 0% 0% / 0.5)"
  event-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    border: "1px solid {colors.border}"
    shadow: "{shadows.lg}"
  timetable-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    border: "1px solid {colors.border}"
    shadow: "{shadows.lg}"
  type-badge-teacher:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
  type-badge-student:
    backgroundColor: "{colors.success}"
    textColor: "{colors.success-foreground}"
  type-badge-admin:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.destructive-foreground}"
  type-badge-other:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
---

## Overview

eddi is a school management and timetabling SaaS — multi-tenant, with student / guardian / teacher / staff / principal / admin roles, and an FET-driven automated timetable generator. The visual system reflects that: it is a **warm school admin** product, not a fintech dashboard, not a consumer marketplace. The cream canvas, golden-amber accent, and friendly Lucide iconography all push toward "institutional but human" — closer to a well-designed school office than to a SaaS bank statement.

The base canvas is **warm off-white** (`{colors.background}` — oklch(0.9818 0.0054 95.0986), ~#faf8f3) with a deep **warm charcoal foreground** (`{colors.foreground}` — oklch(0.3438 0.0269 95.7226), ~#56503e). The single brand voltage is **warm amber** (`{colors.primary}` — oklch(0.6171 0.1375 39.0427), ~#c87a3f), used scarcely — most pages are 95% cream + charcoal with one or two amber moments (the active sidebar item, a single primary CTA, a brand badge).

Type runs the **platform system stack** — `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`. There is no custom webfont. This is a deliberate choice for a school product: every browser renders something native and familiar, no FOUT, no licensing.

The shape language is **uniformly soft**. The base radius is `--radius: 0.5rem` (8px), with a 2px-tighter step for buttons (`{rounded.md}` — 6px) and a 4px-looser step for floating cards (`{rounded.xl}` — 12px). There is essentially no hard corner anywhere except the sidebar border and base table cells.

**Key Characteristics:**

- Single accent color: `{colors.primary}` (~#c87a3f — warm amber). Carries every primary CTA, the active sidebar state, the `default` Button variant, the `default` Badge, and the teacher `type-badge`. Used scarcely.
- No custom webfont. Pure system stack via `--font-sans`. Display weight tops out at 700 (page titles); body sits at 400.
- Two semantic extras on top of stock shadcn-svelte: `{colors.success}` (warm green at the same lightness/chroma as primary) and `{colors.warning}` (amber-yellow). Most shadcn projects only ship `destructive`.
- Sidebar gets its own dedicated token group (`{colors.sidebar}`, `{colors.sidebar-foreground}`, `{colors.sidebar-primary}`, `{colors.sidebar-accent}`, `{colors.sidebar-border}`, `{colors.sidebar-ring}`) — distinct from the page background, slightly more cream.
- Information density leans high: `text-sm` (14px) is the most common type size in the app (303 occurrences), `text-xs` (12px) second (141). Body running at 16px (`text-base`) is rare. Page titles are bold (`text-3xl font-bold tracking-tight`).
- Layout is sidebar-led: a persistent `Sidebar.Provider` with `collapsible="icon"` mode wraps every authenticated route. Public surfaces (login, marketing) bypass it.
- Elevation is **mostly flat**. The system declares 8 progressive shadow tiers (`{shadows.2xs}` through `{shadows.2xl}`) but in practice only `{shadows.xs}` (built into Buttons) and `{shadows.lg}` (on `event-card` and `timetable-card`) appear in markup.
- 4px base spacing (`--spacing: 0.25rem`). The most common conventions in markup are `gap-4`, `gap-6`, `p-3`, `p-8`, `space-y-4`, `space-y-6` — generous but not editorial.

## Colors

The system runs OKLCH end-to-end (declared in `src/app.css` under `:root` and `.dark`). OKLCH is perceptually uniform — the same lightness/chroma applied to a different hue produces a visually-equivalent-weight color. eddi uses this deliberately: `{colors.primary}` (warm amber, hue 39°) and `{colors.success}` (warm green, hue 142°) share lightness 0.6171 and chroma 0.1375, which is why they feel like the same "weight" of accent on the page.

### Brand & Accent

- **Primary** (`{colors.primary}` — oklch(0.6171 0.1375 39.0427), ~#c87a3f): The single brand color. Used for the `default` Button variant, the active sidebar item underline, the brand mark in the sidebar header, the teacher `type-badge`, and the icon backplates on the admin overview cards. Most pages have one or zero appearances of this color.
- **Primary (dark mode)** (`{colors.primary-dark}` — oklch(0.6724 0.1308 38.7559)): Slightly lighter and slightly less saturated for legibility on the dark charcoal background. Same hue.
- **Primary Foreground** (`{colors.primary-foreground}` — oklch(1 0 0) / pure white): The label color on top of `{colors.primary}` surfaces.

### Surface

- **Background** (`{colors.background}` — oklch(0.9818 0.0054 95.0986), ~#faf8f3): The default page floor in light mode. Warm off-white, biased toward cream.
- **Background (dark)** (`{colors.background-dark}` — oklch(0.2679 0.0036 106.6427)): Deep warm charcoal — not pure black. Same hue family as the light background.
- **Card** (`{colors.card}` — same as background in light mode): Cards visually separate from the page via 1px border + occasional shadow, not via a different fill. This is intentional and gives the system its flat, papery feel.
- **Card Foreground** (`{colors.card-foreground}` — oklch(0.1908 0.002 106.5859)): A near-black for card titles and stats — slightly darker than the body foreground for emphasis.
- **Popover** (`{colors.popover}` — oklch(1 0 0) / pure white): Dropdowns, comboboxes, and command menus float on a slightly whiter surface than the page to read as "above" the canvas.
- **Muted** (`{colors.muted}` — oklch(0.9341 0.0153 90.239)): Disabled fields, sub-nav hover backgrounds, skeleton loaders.
- **Accent** (`{colors.accent}` — oklch(0.9245 0.0138 92.9892)): Hover state for ghost buttons, dropdown items, sidebar items. Slightly stronger than `{colors.muted}`.

### Borders

- **Border** (`{colors.border}` — oklch(0.8847 0.0069 97.3627)): The default 1px stroke. Card borders, table separators, dialog edges, input outlines (paired with `{colors.input}` for focus delta).
- **Input** (`{colors.input}` — oklch(0.7621 0.0156 98.3528)): A noticeably stronger gray reserved specifically for form input outlines so they pop slightly above other 1px lines.
- **Ring** (`{colors.ring}` — oklch(0.5937 0.1673 253.063)): A blue focus ring — the only blue in the entire palette. Applied at 50% opacity (`focus-visible:ring-ring/50`) on every focused interactive. Surprising choice given the warm amber brand, but it is the WCAG-friendliest focus tone and reads unambiguously as "keyboard focus" against the cream canvas.

### Text

- **Foreground** (`{colors.foreground}` — oklch(0.3438 0.0269 95.7226), ~#56503e): The dominant body and headline color on light surfaces. Warm charcoal — never pure black.
- **Foreground (dark)** (`{colors.foreground-dark}` — oklch(0.8074 0.0142 93.0137)): The corresponding warm cream on dark backgrounds.
- **Muted Foreground** (`{colors.muted-foreground}` — oklch(0.6059 0.0075 97.4233)): Subtitles, helper text, table column headers, "no results" empty-state copy, card descriptions. Used heavily — most pages have 5–10 instances.
- **Secondary Foreground** (`{colors.secondary-foreground}` — oklch(0.4334 0.0177 98.6048)): Label color on `{component.button-secondary}` surfaces.

### Semantic

- **Destructive** (`{colors.destructive}` — oklch(0.65786 0.20367 24.675), ~#e75240): The system's red — used on `{component.button-destructive}`, the admin-type `{component.type-badge-admin}`, and inline form error text. More saturated than the primary (chroma 0.20 vs 0.13) so it visually outpaces the brand on the same page.
- **Success** (`{colors.success}` — oklch(0.6171 0.1375 142.0427)): Warm green at the _same_ lightness and chroma as `{colors.primary}` — only the hue differs (142° vs 39°). Used on `{component.button-success}` (a confirmation variant eddi added on top of stock shadcn) and the student `{component.type-badge-student}`.
- **Warning** (`{colors.warning}` — oklch(0.80877 0.17029 75.348)): Yellow-amber — lighter and more saturated than the primary. Reserved for warning toasts, "behind schedule" banners, and the warning-state in form validation. Token exists; usage in markup is sparse.
- **Foreground tokens** for each semantic (`{colors.destructive-foreground}`, `{colors.success-foreground}`, `{colors.warning-foreground}`) all resolve to pure white — the saturated semantic surfaces always carry white labels.

### Sidebar

A dedicated token group, separate from the page surface system. Sidebars sit at `{colors.sidebar}` (oklch(0.9663) — slightly creamier than the page background), are bounded by `{colors.sidebar-border}`, and use `{colors.sidebar-accent}` for the hover/active item background. The active sidebar item also carries `{colors.sidebar-primary}` (which equals `{colors.primary}` in light mode — see Known Gaps for the dark-mode quirk).

### Charts

Five tonal swatches (`{colors.chart-1}` through `{colors.chart-5}`) for data visualization — a warm orange, a violet, a cream, a lavender, and a deep terracotta. Designed to share lightness so multi-series bars and lines read as a unified palette rather than a clown circus. Used by the Chart shadcn primitive.

## Typography

### Font Family

The system runs the **platform system stack** for everything — display, body, navigation, captions:

```
ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
"Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans",
sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
"Segoe UI Symbol", "Noto Color Emoji"
```

`--font-serif` (Georgia, Cambria, Times) and `--font-mono` (SFMono, Menlo, Consolas) are declared but rarely invoked — the only mono-font surface is code blocks inside discussion threads.

There is no custom webfont. No Inter. No Cereal. The decision is to render fast and feel native on every machine.

### Hierarchy

Empirically extracted from `src/routes/**/*.svelte` and `src/lib/components/**/*.svelte`. Frequencies count uses across the codebase.

| Token                     | Tailwind                            | Size | Weight | Use                                                          | Frequency |
| ------------------------- | ----------------------------------- | ---- | ------ | ------------------------------------------------------------ | --------- |
| `{typography.page-title}` | `text-3xl font-bold tracking-tight` | 30px | 700    | Top-of-page H1 (admin pages, dashboard greeting)             | ~28       |
| `{typography.display-lg}` | `text-2xl font-bold`                | 24px | 700    | Section heads, dashboard column titles                       | ~43       |
| `{typography.display-md}` | `text-xl` (often `font-semibold`)   | 20px | 600    | Sub-section titles, dialog titles                            | ~28       |
| `{typography.card-title}` | `text-lg font-semibold`             | 18px | 600    | Card titles inside grids                                     | ~71       |
| `{typography.body-md}`    | `text-base`                         | 16px | 400    | Long-form copy (rare in admin; common on login + marketing)  | ~14       |
| `{typography.body-sm}`    | `text-sm`                           | 14px | 400    | The dominant body size — table cells, card body, form labels | **~303**  |
| `{typography.body-xs}`    | `text-xs`                           | 12px | 400    | Helper text, meta lines, badge labels, timestamps            | **~141**  |
| `{typography.label}`      | `text-sm font-medium`               | 14px | 500    | Form labels (`Form.Label`)                                   | —         |
| `{typography.caption}`    | `text-xs font-medium`               | 12px | 500    | Badges, table column headers (`Table.Head`)                  | —         |
| `{typography.button-md}`  | `text-sm font-medium`               | 14px | 500    | All button labels (default size)                             | —         |
| `{typography.button-sm}`  | `text-[13px] font-medium`           | 13px | 500    | Compact button labels (`size="sm"`)                          | —         |

### Principles

Type weight tops out at 700, only on page titles. Most body text runs at 400. The hierarchy comes from **size**, not weight — the jump from `text-sm` (14px body) to `text-3xl` (30px title) is large enough that titles read as authoritative even without heavier weight.

Eddi pages are admin-dense, so the system intentionally biases small. Setting body at 14px (rather than the more typical 16px) lets a card grid show 4 cards across at desktop without feeling cramped. Pages that read more (login, marketing, profile) bump body to 16px (`text-base`).

The `tracking-tight` modifier on page titles is a deliberate aesthetic choice — at 30px+, the system stack's default tracking feels slightly loose, and tightening to `-0.025em` makes titles feel decisive without going to a heavier weight.

### Note on Substitutes

If a school deploys eddi behind a corporate browser policy that overrides system fonts, the system stack falls through cleanly. **Inter** would be the closest open-source substitute if a custom font ever ships; the proportions transfer at a 1:1 ratio because Inter was designed to mimic the modern system-UI look.

## Layout

### Spacing System

Base unit is **4px** (`--spacing: 0.25rem`), inherited from Tailwind v4 default. The conventions in markup:

- **Inline gaps:** `gap-1` (4px), `gap-2` (8px), `gap-3` (12px), `gap-4` (16px), `gap-6` (24px), `gap-8` (32px). `gap-4` and `gap-6` dominate.
- **Padding:** `p-2` (8px) — tight UI elements like icon buttons. `p-3` (12px) — card cell padding. `p-4` (16px) — card body padding. `p-6` (24px) — card body, dialog padding. `p-8` (32px) — admin page padding.
- **Vertical stack:** `space-y-4` (16px) inside form field groups. `space-y-6` (24px) inside card content sections. `space-y-8` (32px) between major page sections.

### Grid & Container

eddi does not enforce a single max content width — pages set their own constraints based on what they show:

- **Login form** (`src/routes/(public)/login/+page.svelte`): inner form caps at `max-w-xs` (320px), centered inside a 50% column.
- **Marketing hero** (public root): `max-w-4xl` (896px) for hero copy.
- **Dashboard** (`src/routes/dashboard/+page.svelte`): full-width inset, no explicit cap — the 3-column `xl:grid-cols-[1fr_1fr_1fr]` rides all available space.
- **Profile, grades, reading-heavy pages:** `max-w-6xl` (~1152px) with `container mx-auto`.
- **Admin pages:** full-bleed inside the `Sidebar.Inset`, padded with `p-8`. No outer max-width — the sidebar collapsing controls how wide content gets.
- **Discussion threads:** `max-w-4xl` (896px) for readability.

### Page Layout Pattern

Most authenticated pages share a structure:

1. **Sidebar** (`{component.app-sidebar}`) on the left — `Sidebar.Provider` with `collapsible="icon"`. Always present.
2. **Sidebar.Inset** as the main content surface, height `h-[calc(100vh-1rem)]`.
3. Inside the inset:
   - Page title in `text-3xl font-bold tracking-tight`.
   - Optional subtitle in `text-muted-foreground`.
   - Filter / action row — typically a flex row with an `Input` (`max-w-sm`) on the left and one or more Buttons on the right.
   - Content body — either a card grid (`grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`) or a TanStack DataTable.

### Whitespace Philosophy

Generous but not editorial. Section gaps run at 24–32px, not the 64–80px a marketing site would use. The system biases toward "I can see more on screen" — appropriate for a tool teachers and admins use daily.

## Elevation

The system declares **eight progressive shadow tiers** in `src/app.css` (`{shadows.2xs}` through `{shadows.2xl}`). Both light and dark modes use the same shadow tokens — the shadows are pure black at varying opacity, not tinted.

In **practice**, the codebase uses three:

- **Flat (no shadow):** ~95% of surfaces. Page bodies, default cards, sidebar surfaces, dialog content interior.
- **`{shadows.xs}` — buttons:** Built into the Button base variant (every variant except `ghost` and `link` carries `shadow-xs`). Almost invisible — adds a 1px soft drop that gives buttons a hint of physicality.
- **`{shadows.lg}` — floating cards:** Applied explicitly on `{component.event-card}` and `{component.timetable-card}` to lift them off the dashboard surface. Also implicitly on Dialog content and Sheet content (via shadcn defaults).

There are no custom progressive elevation tiers in markup — when something needs more depth, it jumps from flat to `shadow-lg`. The mid-tier shadows (`md`, `xl`) are available but unused.

**Modal scrim:** `hsl(0 0% 0% / 0.5)` — pure black at 50% — the global Dialog and Sheet backdrop, identical in light and dark modes.

## Components

eddi consumes **42 shadcn-svelte primitives** essentially as-stock, with token-driven theming in `src/app.css` doing all the customization work. Below is a tour of the ones that actually appear in markup, plus the custom domain components built on top.

### Button

Defined in `src/lib/components/ui/button/button.svelte`. Seven variants × six sizes:

**Variants** (with the actual Tailwind class lists):

- **`default`** (`{component.button-default}`) — `bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs`. The amber primary CTA. Rare in markup (~4 uses) — most pages have at most one.
- **`destructive`** (`{component.button-destructive}`) — `bg-destructive hover:bg-destructive/90 ... text-white shadow-xs`. Delete / archive / sign-out actions. Always carries explicit white text (the foreground token isn't trusted here because some dark-mode renderings shift hue).
- **`outline`** (`{component.button-outline}`) — `bg-background hover:bg-accent hover:text-accent-foreground ... border shadow-xs`. The most common variant in the app (~38 uses). Pattern: one `default` per page, every other action is `outline`.
- **`secondary`** (`{component.button-secondary}`) — `bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-xs`. Used rarely (~1 use) — `outline` covers most of its space.
- **`ghost`** (`{component.button-ghost}`) — `hover:bg-accent hover:text-accent-foreground ...`. Used for icon-only buttons inside cards and rows (~10 uses). No background until hover.
- **`link`** (`{component.button-link}`) — `text-primary underline-offset-4 hover:underline`. Inline text links styled as buttons.
- **`success`** (`{component.button-success}`) — `bg-success text-success-foreground shadow-xs hover:bg-success/90`. **eddi's addition** beyond stock shadcn-svelte. Used for confirmation flows ("Mark complete", "Submit timetable").

**Sizes:**

- **`default`** — `h-9 px-4 py-2` (36px tall, 16px horizontal padding). Most common.
- **`sm`** — `h-8 gap-1.5 rounded-md px-3` (32px tall).
- **`lg`** — `h-10 rounded-md px-6` (40px tall).
- **`icon`** — `size-9` (36×36px square).
- **`icon-sm`** — `size-8`.
- **`icon-lg`** — `size-10`.

Base classes shared by every variant: `inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium`. So every button is 14px / 500, 6px radius, with a built-in `gap-2` for icon-label spacing. Lucide icons drop in directly without sizing classes (`[&_svg:not([class*='size-'])]:size-4`).

### Card

Defined under `src/lib/components/ui/card/`. Sub-parts: `Card.Root`, `Card.Header`, `Card.Title`, `Card.Description`, `Card.Content`, `Card.Footer`. No variants — one shape, everywhere.

`Card.Root` carries `bg-card text-card-foreground rounded-xl border` plus the shadcn-default padding of 24px. `Card.Title` runs `text-lg font-semibold` (`{typography.card-title}`). `Card.Description` runs `text-sm text-muted-foreground`.

The dashboard's signature 3-column layout is built from three `Card.Root` instances arranged as `grid gap-6 xl:grid-cols-[1fr_1fr_1fr]`. The admin overview page builds its 8-card menu from `grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` over `Card.Root class="h-40"` cells.

### Input / Textarea / Form

Inputs (`{component.input}`) carry `bg-background border-input rounded-md h-9 px-3 py-1 text-sm`. On focus, `--ring` (the blue focus ring) becomes visible at 50% opacity. The 36px height matches the default Button height — inputs and primary buttons line up flush.

Forms use **superforms + Zod v4**. The pattern (canonical example from `src/routes/admin/timetables/+page.svelte`):

```svelte
<Form.Field {form} name="name">
	<Form.Control>
		{#snippet children({ props })}
			<Form.Label>Name</Form.Label>
			<Input {...props} bind:value={$formData.name} placeholder="Term 1" />
		{/snippet}
	</Form.Control>
	<Form.FieldErrors />
</Form.Field>
```

Field rows stack vertically inside a `grid gap-4` parent. `Form.FieldErrors` renders inline error text in `{colors.destructive}` at `text-sm`.

### Badge

Five variants: `default`, `secondary`, `success`, `destructive`, `outline`. All render at `text-xs` (12px) with `font-medium`, `rounded-md` (6px), and `px-2 py-0.5` padding. Used heavily for status labels, role indicators, and the custom `{component.type-badge}` wrapper that maps user types (teacher → `default` amber, student → `success` green, admin → `destructive` red, else → `secondary` gray).

### Dialog & Sheet

Dialogs (`{component.dialog}`) are the dominant modal surface — used for create/edit forms across admin pages. Standard max-width is `sm:max-w-[425px]`. They sit on a black 50% scrim. Closing reveals the underlying page unchanged.

Sheets (`{component.sheet}`) are available with side variants `top` / `bottom` / `left` / `right` (default `right`, max width 75% of viewport). **No active consumers in `src/routes/` at the moment** — declared but not yet adopted. Marked in Known Gaps.

### Sidebar

The sidebar primitive is the heaviest single component in the system. `Sidebar.Provider` wraps the root `+layout.svelte`, with `collapsible="icon"` enabling the icon-mode collapse. Composition:

- **`Sidebar.Header`** — School logo + name + a campus selector dropdown.
- **`Sidebar.Content`** — Main `Sidebar.Group` with permission-gated items (Dashboard, Admin, Calendar, Attendance), then a Subjects/Classes group with collapsible nested items rendered via `Collapsible.Root` + `ChevronRight` rotation animation.
- **`Sidebar.Footer`** — User profile dropdown with theme toggle. On mobile (`sidebar.isMobile === true`), the dropdown's `side` flips from `right` to `bottom` so the menu doesn't overflow the screen edge.
- **`Sidebar.Rail`** — The 4px-wide collapse trigger on the right edge.

Active items carry `{component.sidebar-item-active}` styling — `bg-sidebar-accent text-sidebar-accent-foreground rounded-md`. Hover items use the same accent color at slightly reduced opacity.

### DataTable

`src/lib/components/ui/data-table/` wraps `@tanstack/table-core`. Used on `src/routes/admin/users/+page.svelte` and similar list-heavy admin views. Features: column-level sorting, row checkboxes, a column-visibility dropdown (pinned top-right of the filter row), inline filter inputs (`max-w-sm` is the standard width for the filter input).

Empty state renders as a single full-width `Table.Cell` with `colspan={columns.length} class="h-24 text-center"` containing "No results."

### Calendar / Date Picker / Popover

The Calendar primitive (built on `bits-ui` + `@internationalized/date`) handles attendance check-in date pickers, timetable date selectors, and event date inputs. Selected days carry `{colors.primary}` fill with white text; hover days use `{colors.accent}`. Range selections fill in-between days with `{colors.muted}`.

### Toaster

`sonner` toasts are mounted globally in `src/routes/+layout.svelte`. Default position is bottom-right. Variants tie to semantic colors: success toasts use `{colors.success}`, errors use `{colors.destructive}`, warnings use `{colors.warning}`.

### Custom Domain Components

Beyond the shadcn primitives, eddi has ~11 first-party components in `src/lib/components/`:

- **`event-card.svelte`** (`{component.event-card}`) — Single-event preview with subject color stripe, time, location icon, RSVP status. Carries `{shadows.lg}` to float over the dashboard surface.
- **`timetable-card.svelte`** (`{component.timetable-card}`) — Compact class preview (subject, time, room) for dashboard "Your Day" rail. Same shadow treatment.
- **`curriculum-learning-area-card.svelte`** — Curriculum domain card; navigates to learning-area detail.
- **`resource-card.svelte`** — Resource preview tile (name, type icon, owner avatar).
- **`rubric.svelte`** — Tabular rubric renderer with rows = criteria and columns = levels (exemplary / accomplished / developing / beginning).
- **`type-badge.svelte`** (`{component.type-badge-*}`) — Wraps shadcn `Badge` and maps user-type enum to variant: teacher → `default` (amber), student → `success` (green), admin → `destructive` (red), other → `secondary`.
- **`autocomplete.svelte`** — Search-and-select dropdown (combobox shell over `Command`).
- **`rich-textarea.svelte`** — Enhanced textarea, presumably with formatting controls.
- **`public-header.svelte`** / **`public-footer.svelte`** — Marketing-site chrome for `(public)` routes.
- **`app-sidebar.svelte`** (`{component.app-sidebar}`) — The composed sidebar described above.
- **`whiteboard/`** (subdirectory) — Drawing canvas with toolbar, zoom controls, floating menu, WebSocket sync. The most visually complex surface in the app; effectively its own design sub-system.

## Page Patterns

### Root Layout (authenticated)

```svelte
<Sidebar.Provider>
	<AppSidebar {user} {school} />
	<Sidebar.Inset class="h-[calc(100vh-1rem)]">
		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider>
<Toaster />
<ModeWatcher />
```

The page title is set via `<svelte:head>` to `"eddi - {school.name}"`. Public routes (`/`, `(public)/*`) bypass this layout entirely.

### Login Page

A `lg:grid-cols-2` split. Left column: the login form, capped at `max-w-xs`, vertically centered. Order from top: school/eddi logo → "Sign in" title → Google + Microsoft SSO buttons (`outline` variant, full-width) → divider → email/password form. Right column: a hero image (`hero-clay-students.jpeg`) at full coverage, hidden below `lg`. Dark mode dims the hero with `dark:brightness-[0.4]`.

### Authenticated Dashboard

A 3-column grid at `xl` breakpoint: `grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr_1fr]`. Each column wraps a `Card.Root` containing a scrollable section: "Your Day" (today's classes), "Recent Forum Announcements" (pinned first), "School News" (with pin icon and status badges). Each card carries an internal `ScrollArea`. Empty states render `<p class="text-muted-foreground text-center">No events or classes scheduled for today.</p>`.

### Admin Page Header

Canonical pattern from `src/routes/admin/users/+page.svelte`:

```svelte
<h1 class="text-3xl font-bold tracking-tight">Users</h1>
<div class="flex items-center py-4">
	<Input placeholder="Filter emails..." class="max-w-sm" />
	<!-- column visibility dropdown right-aligned -->
</div>
<DataTable ... />
```

Universal structure: H1 (always `text-3xl font-bold tracking-tight`) → filter row (flex row with `Input max-w-sm` left + actions right) → content (DataTable or card grid).

### Admin Overview

8-card menu grid at `src/routes/admin/+page.svelte`:

```svelte
<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
	{#each adminSections as section}
		<Card.Root class="h-40">
			<Card.Header class="gap-4">
				<div class="flex items-center gap-3">
					<div class="bg-primary rounded-lg p-2">
						<section.icon class="text-primary-foreground" />
					</div>
					<Card.Title class="text-lg font-semibold">{section.title}</Card.Title>
				</div>
				<Card.Description>{section.description}</Card.Description>
			</Card.Header>
		</Card.Root>
	{/each}
</div>
```

This is one of the few places `{colors.primary}` appears at scale — eight amber icon backplates as a visual signature for the admin section.

### Empty States

Three patterns by location:

- **In a card body:** `<p class="text-muted-foreground text-center">No events or classes scheduled for today.</p>`. Plain, no icon.
- **As a full-width prompt to action:** A `Card.Root` containing a centered icon + title + description + primary CTA. Used when a section is empty and the right move is "create the first one" (e.g., the timetables list with no timetables yet).
- **Inside a DataTable:** A single full-row `Table.Cell colspan={columns.length} class="h-24 text-center">No results.</Table.Cell>`.

### Loading States

The Skeleton primitive (`bg-muted rounded-md animate-pulse`) is available but used sparingly. Page-level loads typically render the page chrome instantly (sidebar always-on) and skeleton-out content cells while data resolves. No global loading bar.

## Responsive Behavior

| Name    | Width            | Key Changes                                                                                                                                                                                                                                                                             |
| ------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile  | < 640px          | Sidebar collapses to icon mode (4px-wide rail) — no off-canvas drawer. Login form is full-width, hero image hidden. Dashboard collapses 3-col → 1-col. Admin card grids drop to single column. Filter rows stack vertically. User profile dropdown anchors `bottom` instead of `right`. |
| Tablet  | 640–1024px       | Sidebar still collapsed by default; expands on hover. Dashboard stays 1-col below `xl`. Admin card grids: 2-col at `md:`, 3-col at `lg:`. Login split keeps form left, image right.                                                                                                     |
| Desktop | 1024–1280px      | Sidebar fully expanded. Dashboard still 1-col (3-col only kicks in at `xl`). Admin card grids: 3-col at `lg:`.                                                                                                                                                                          |
| Wide    | ≥ 1280px (`xl:`) | Dashboard fans out to 3-col `[1fr_1fr_1fr]`. Admin card grids: 4-col at `xl:`. Profile and reading pages cap at `max-w-6xl`; long-form caps at `max-w-4xl`.                                                                                                                             |

### Touch Targets

The default Button height is **`h-9`** (36px), which is below the WCAG AAA recommendation of 44×44px. eddi accepts this trade-off — admin tooling is overwhelmingly used on desktop with mouse + keyboard, and 36px reads as appropriately compact in a dense admin UI. Mobile-first apps would want to bump default sizing. The `lg` size (`h-10`, 40px) is closer but still under AAA; only `icon-lg` (`size-10`) at the larger end gets close.

### Collapsing Strategy

- **Sidebar:** Collapses to icon mode rather than off-canvas. The icons remain tappable. `Sidebar.Rail` (the 4px collapse trigger) handles the toggle on desktop.
- **Card grids:** Always reduce columns at breakpoints, never reflow rows.
- **Dashboard:** Drops from 3-col → 1-col below `xl` — a deliberate single-column reading flow on mobile/tablet rather than awkward 2-col hybrid.
- **Login split:** Hero image hides below `lg`, form takes full width.
- **DataTable:** Horizontal scroll on overflow (no per-breakpoint column hiding configured by default).

## Known Gaps

- **No custom typeface** — the system is honest about running the platform stack. If brand identity ever wants more presence, a lightweight variable webfont (Inter, Geist, or an open-source serif for school/educational warmth) would be the obvious upgrade path. None is loaded today.
- **`{colors.warning}` is sparsely used** — the token exists and is wired into `@theme inline`, but very few markup sites consume it. Most warning-style messaging currently leans on `{colors.destructive}` plus copywriting.
- **Sheet has zero consumers** — the primitive is in `src/lib/components/ui/sheet/` and exports cleanly, but no route imports it. Future side-panel patterns (filter drawers, detail panes) should default to Sheet over Dialog.
- **Hover state colors not catalogued** — Buttons drop opacity on hover (`hover:bg-primary/90`, etc.); cards do not animate; sidebar items shift to `{colors.sidebar-accent}`. Specific transition timings are inherited from shadcn-svelte defaults and not customized.
- **Dark-mode `{colors.sidebar-primary}` is gray, not amber** — `oklch(0.325 0 0)` (a near-black gray) versus light mode's `{colors.primary}` (warm amber). Either an intentional choice (amber on the dark sidebar surface might glare) or an oversight from the initial token setup. Worth a deliberate decision either way.
- **Dark-mode `{colors.sidebar-border}` is identical to light mode** (`oklch(0.9401 0 0)`, near-white) — definitely an oversight; the border barely shows on a dark background. Should darken to match `{colors.border-dark}` proportions.
- **No documented loading skeleton patterns** — the Skeleton primitive exists, but no canonical "this is how a dashboard skeleton renders" pattern is established. Pages currently flash empty before populating.
- **OAuth error states minimally styled** — login page Google/Microsoft buttons render error messaging via `Form.FieldErrors` in plain destructive text; no dedicated SSO-failure UI.
- **Mobile drawer pattern absent** — the sidebar collapses to icons rather than sliding off-canvas. On phones, this leaves a 4px rail that is technically tappable but cramped. A future `Sheet`-based off-canvas drawer for mobile would be a natural fit.
- **Whiteboard sub-system not documented here** — `src/lib/components/whiteboard/*` is effectively its own design language (drawing toolbar, zoom controls, floating menus, color pickers) and deserves a separate document.
- **Chart token usage** — five chart colors are declared, but only a handful of pages render charts. Token-to-usage mapping (which chart slot represents which data dimension) is not yet codified.
