# Rhythma — Paint-style design prompt

Current dark neon brand palette + classic old Microsoft Paint delivery.

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
Uneven 1–2px outlines, wobbly circles, naive stick icons, aliased/jagged edges,
chunky imperfect handwriting, cute raw playful doodles.
NO glossy UI, NO realistic shadows, NO glassmorphism, NO luxury minimalism,
NO gradients on controls, NO photoreal imagery.

Palette ONLY:
- background #0A0A0A
- panels #1C1C1E with rough #48484A borders
- primary text #FFFFFF
- secondary text #98989D
- main accent neon magenta/pink #FF10F0
- secondary accent cyan/teal #5ECAD6

Brand word "Rhythma" must read as a hero-level hand-painted signal.
Feel: playful, raw, hand-drawn, imperfect, cute, dark UI with bright pink accents.
iPhone portrait mockup.
```

## Master prompt (UA)

```
Дизайн мобільного UI для трекера циклу "Rhythma".
Стиль: старий Microsoft Paint (Win 95/XP) — ніби намальовано мишкою.
Нерівні контури 1–2px, криві кола, наївні іконки, aliased краї,
нерівний hand-drawn текст, милі сирі doodles.
Без glossy UI, без реалістичних тіней, без glassmorphism, без luxury minimalism,
без градієнтів на кнопках, без фотореалізму.

Палітра лише:
- фон #0A0A0A
- панелі #1C1C1E з грубими контурами #48484A
- основний текст #FFFFFF
- другорядний #98989D
- акцент neon pink/magenta #FF10F0
- додатковий акцент cyan/teal #5ECAD6

Назва "Rhythma" — hero-рівень, hand-painted.
Настрій: playful, raw, hand-drawn, imperfect, cute, dark + bright pink.
iPhone portrait.
```

## Screen add-ons

### Today
Add: big wobbly pink cycle circle “Day N”, phase in cyan, gray “Next period in…”,
pink outline button “Period started today”, 7 uneven day squares (pink = period, cyan outline = today),
bottom tabs **Today / Year / Settings** (match product: 3 tabs).

### Year
Add: hand-drawn year header with pink arrows, 12 crude month grids,
pink blobs = period, cyan dots = ovulation, gray empty = forecast, simple legend.

### Settings
Add: wobbly rows + crude toggles (Theme, Calendar sync, Show ovulation),
language EN/UK, pink outline “Rhythma Plus — Coming soon”, gray privacy scribble.

### Splash
Add: optional Paint window chrome; huge pink “Rhythma”; one line “Your cycle, doodled.”;
one cyan CTA; tiny gray “private · on device”. No stats, no cards, no badges.

### Energy curve (Plus)
Add: wobbly pink solid + cyan dashed hormone lines, High/Low axis, phase labels along X,
white “Today” marker, naive legend.

## Negative prompt

```
modern iOS glossy UI, skeuomorphic luxury, soft drop shadows, blur, glassmorphism,
perfect geometry, Inter/Roboto, purple-indigo gradient theme, cream paper,
newspaper layout, photorealistic icons, 3D, neon glow bloom overload,
crowded dashboard, floating sticker badges, inset hero cards
```

## Mockups in this folder

| File | Screen |
|------|--------|
| `rhythma-paint-splash.png` | Splash / brand first viewport |
| `rhythma-paint-today.png` | Today |
| `rhythma-paint-year.png` | Year calendar |
| `rhythma-paint-settings.png` | Settings |
| `rhythma-paint-energy.png` | Energy curve (Plus) |

Note: some generators invent extra tabs — product navigation is **Today · Year · Settings** only.
