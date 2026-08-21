# Rhythma — Paint-style design prompt

Current dark neon brand palette + classic old Microsoft Paint delivery.
Tone: **restrained / adult / raw** — not teenage, not cute-diary.

## Palette (do not drift)

| Role | Hex | Use |
|------|-----|-----|
| Background | `#0A0A0A` | Full screen / canvas |
| Card / panel | `#1C1C1E` | Rough outlined blocks only |
| Ink (primary text) | `#FFFFFF` | Titles, day numbers |
| Muted text | `#98989D` | Secondary labels, hints |
| Faint / border | `#48484A` | Wobbly outlines, inactive chrome |
| Accent (neon pink) | `#FF10F0` | Brand accent, period, primary CTA, active tab |
| Accent soft | `#3A1530` | Optional fill under pink (flat, not glossy) |
| Teal / cyan | `#5ECAD6` | Secondary accent, ovulation, phase highlight |
| Teal soft | `#16383C` | Optional flat teal fill |

Mood stays **dark neon Rhythma** — only the *drawing method* becomes Paint.

## Master prompt (EN)

```
Mobile UI for cycle tracker app "Rhythma".
Aesthetic: classic old Microsoft Paint (Windows 95/XP) — drawn with a mouse.
Thin uneven 1–2px outlines, slightly imperfect geometry, aliased/jagged edges,
flat fills, geometric icons only (circle, grid, gear).
Typography: plain Paint Text-tool / system-like sans — slightly uneven, NOT cursive,
NOT brush lettering, NOT bubbly handwriting, NOT diary script.
Tone: restrained, adult, calm, raw, dry — NOT teenage, NOT cute, NOT playful doodle.
NO hearts, smileys, stars, flowers, stickers, stick figures, sparkles.
NO glossy UI, NO realistic shadows, NO glassmorphism, NO luxury minimalism,
NO gradients on controls, NO photoreal imagery.

Palette ONLY:
- background #0A0A0A
- panels #1C1C1E with rough #48484A borders
- primary text #FFFFFF
- secondary text #98989D
- main accent neon magenta/pink #FF10F0
- secondary accent cyan/teal #5ECAD6

Brand word "Rhythma" as a clear hero signal (flat paint letters, not cute).
iPhone portrait mockup. Tabs: Today · Year · Settings.
```

## Master prompt (UA)

```
Дизайн мобільного UI для трекера циклу "Rhythma".
Стиль: старий Microsoft Paint (Win 95/XP) — ніби намальовано мишкою.
Тонкі нерівні контури 1–2px, трохи недосконала геометрія, aliased краї,
плоскі заливки, лише геометричні іконки (коло, сітка, шестерня).
Типографіка: простий Paint Text tool / system-like sans — трохи нерівний,
НЕ курсив, НЕ brush lettering, НЕ «милий» handwriting, НЕ щоденниковий скрипт.
Тон: стриманий, дорослий, спокійний, raw — НЕ підлітковий, НЕ cute, НЕ doodle-journal.
Без сердець, смайликів, зірочок, квіточок, стікерів, stick figures, блискіток.
Без glossy UI, тіней, glassmorphism, luxury minimalism, градієнтів на кнопках.

Палітра лише:
- фон #0A0A0A
- панелі #1C1C1E з грубими контурами #48484A
- основний текст #FFFFFF
- другорядний #98989D
- акцент neon pink/magenta #FF10F0
- додатковий акцент cyan/teal #5ECAD6

"Rhythma" — чіткий hero-сигнал (плоскі paint-літери).
iPhone portrait. Таби: Today · Year · Settings.
```

## Screen add-ons

### Today
Big imperfect pink cycle ring “Day N”, phase in cyan, gray “Next period in…”,
pink outline button “Period started today” (text only), 7 plain day squares
(pink fill = period, cyan outline = today), tabs **Today / Year / Settings**.

### Year
Plain year header with pink chevrons, 12 crude month grids,
pink cells = period, cyan dots = ovulation, gray empty = forecast, minimal legend.

### Settings
Wobbly rows + crude rectangular toggles (Theme, Calendar sync, Show ovulation),
language EN/UK, pink outline “Rhythma Plus — Coming soon” (no decoration),
short gray privacy line.

### Splash
Optional Paint window chrome; large flat pink “Rhythma”; one line
“Plan around your rhythm.”; one cyan outline CTA “Open”;
tiny gray “private · on device”. Geometric ring only. No stickers.

### Energy curve (Plus)
Wobbly pink solid + cyan dashed lines, High/Low axis, phase labels along X,
white “Today” marker, text-only legend.

## Negative prompt

```
teenage aesthetic, cute diary, bubbly handwriting, cursive script, brush lettering,
hearts, smileys, stars, flowers, stickers, stick figures, sparkles, doodle journal,
modern iOS glossy UI, soft drop shadows, blur, glassmorphism, luxury minimalism,
perfect geometry, Inter/Roboto, purple-indigo gradient, cream paper, newspaper layout,
photorealistic icons, 3D, neon glow bloom overload, crowded dashboard, floating badges
```

## Mockups in this folder

| File | Screen |
|------|--------|
| `rhythma-paint-splash.png` | Splash / brand first viewport |
| `rhythma-paint-today.png` | Today |
| `rhythma-paint-year.png` | Year calendar |
| `rhythma-paint-settings.png` | Settings |
| `rhythma-paint-energy.png` | Energy curve (Plus) |

Product navigation is **Today · Year · Settings** only.
