# Zip Auto Solver

A local Hamiltonian-path solver for LinkedIn Zip, plus a live-DOM reader so detection does not depend on screenshots.

Zip is a path puzzle: visit every cell exactly once, move only up/down/left/right, never cross a wall, and pass 1, 2, 3, … in order.

Live selectors, inspected 2026-11-08 on Zip #601:

- Grid: `[data-testid="interactive-grid"][data-trail-grid]`
- Cells: `[data-cell-idx]`
- Numbers: `[data-cell-content="true"]`
- Walls: React fiber `walls: [{ cellIdx, direction: WallDirection_RIGHT|DOWN|… }]`
- Input: `pointerdown` + `mousedown` + `pointerup` + `mouseup` + `click` on each cell in path order

That click sequence filled all 64 cells of #601 and LinkedIn showed “You’re crushing it!”

Open-source Zip solvers I read first (algorithms and DOM notes, not copied): [brohitbrose/linkedin-games](https://github.com/brohitbrose/linkedin-games), [Jed556/LinkedIn-Games-Solver](https://github.com/Jed556/LinkedIn-Games-Solver), [5teven1in/Linkedin-Game-Helper](https://github.com/5teven1in/Linkedin-Game-Helper), and Burak Şipşak’s userscript. The actual board parse here comes from the live page.

```bash
npm install
npm test
```
