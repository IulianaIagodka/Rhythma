# App Store screenshots

## iPhone 6.5" Display — `1284 × 2778`

Use these if App Store Connect shows **iPhone 6.5" Display** (1242×2688 or 1284×2778).

Files: `iphone-6.5/`

## iPhone 6.9" Display — `1320 × 2868`

Use these if App Store Connect shows **iPhone 6.9" Display**.

Files: `iphone-6.9/`

| File | Screen |
| --- | --- |
| `01-today-dark.png` | Today, dark theme |
| `02-year.png` | Year calendar |
| `03-today-light.png` | Today, light theme |

`held/03-settings-testflight.png` is saved but **not for App Store Connect** — it shows the TestFlight plan pill.

Source captures from the phone (1206 × 2622) are in `source/`.

## Current set (Sep 2026)

Replaced from TestFlight **1.0.8** captures:

| Slot | Content |
| --- | --- |
| `01-today-dark` | Today + week + schedule insight (dark) |
| `02-year` | Cycle calendar (dark) |
| `03-today-light` | Today + cycle insight (light) |

Download: [rhythma-iphone-6.5.zip](rhythma-iphone-6.5.zip) · helper page [download.html](download.html)

## HTML mocks (current UI)

Editable HTML mocks for the current Today / Year layout live in `mocks/`:

- `01-today-dark.html` / `.png`
- `02-year.html` / `.png`
- `03-today-light.html` / `.png`

Render (needs Chrome):

```bash
node scripts/render-screenshot-mocks.cjs
```

These are design previews for App Store refresh — replace `iphone-6.5/` / `iphone-6.9/` after you approve the set (or capture from TestFlight for final ASC uploads).
