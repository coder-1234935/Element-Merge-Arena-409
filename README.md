# Element Merge Arena: 409

A modern browser game where you merge **adjacent grid cells** (candy-style) to discover and unlock **409 total elements**.

## What changed

- Grid-based merge gameplay (8x8 board).
- Merge only works for **nearby (adjacent)** tiles.
- Dynamic gravity + refill after successful merge.
- Procedural element set with **409 discoverable elements**.
- High score tracking with retry loop.
- If possible merges in the grid reach **0**, run ends and player retries.
- Era-themed terrain map backgrounds that change with progression (forest / kingdom / modern / space):
  - Nature
  - Civilization
  - Technology
  - Space

## Run

```bash
python -m http.server 4173
```

Open `http://localhost:4173`.
