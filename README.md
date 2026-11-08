# Zip Auto Solver

A Manifest V3 Chrome extension that fills LinkedIn Zip when you click **Solve**.

It reads the numbered grid and walls from the live page (not a screenshot), solves the path locally, then clicks the real cells in order. Nothing is sent off your machine.

Zip is a path puzzle: visit every cell exactly once, move only up/down/left/right, never cross a wall, and pass 1, 2, 3, … in order.

## Why this one detects the board

Detection reads the numbered grid in the isolated content script. LinkedIn's CSP (`script-src-elem` + Trusted Types) blocks MAIN-world module scripts, so waiting on React fiber made the popup say "No Zip board" while the puzzle was visible. Walls fall back to the thick `::after` overlays on cells when fiber is unavailable.

Live selectors, inspected 2026-11-08:

- Grid: `[data-testid="interactive-grid"][data-trail-grid]`
- Cells: `[data-cell-idx]`
- Numbers: `[data-cell-content="true"]`
- Walls: React fiber `walls: [{ cellIdx, direction: WallDirection_RIGHT|DOWN|… }]`
- Input: `pointerdown` + `mousedown` + `pointerup` + `mouseup` + `click` on each cell in path order

That click sequence filled all 64 cells of #601 and LinkedIn showed “You’re crushing it!”

Open-source Zip solvers I read first (algorithms and DOM notes, not copied): [brohitbrose/linkedin-games](https://github.com/brohitbrose/linkedin-games), [Jed556/LinkedIn-Games-Solver](https://github.com/Jed556/LinkedIn-Games-Solver), [5teven1in/Linkedin-Game-Helper](https://github.com/5teven1in/Linkedin-Game-Helper), and Burak Şipşak’s userscript. The actual board parse here comes from the live page.

## Install (load unpacked)

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select the `extension` folder in this project (`linkedin-zip-solver/extension`).
4. Pin **Zip Auto Solver** if you want it on the toolbar.
5. Reload the Zip tab (Cmd+R / Ctrl+R). Chrome does not inject into tabs that were already open.

## How to use

1. Open [LinkedIn Zip](https://www.linkedin.com/games/zip/) and click **Start game**. Reload the tab once after loading the extension.
2. A small detector appears in the top-right when it finds an N×N board. You can also click the toolbar icon.
3. Click **Solve**. The extension draws the path.

It does not fill anything until you click Solve.

## Tests

```bash
npm install
npm test
```

Covers a 2×2, a 2×2 with a wall, a 3×3, and the live 8×8 #601 path, plus fixture Autofill-on-command (Solve) flow.

## Project layout

```
extension/           # unpacked extension
  solver.js          # pure Hamiltonian-path solver
  board.js           # DOM read / click / verify
  page.js            # MAIN world: identify board and fill on command
  content.js         # isolated world: detector + popup bridge
tests/
```
