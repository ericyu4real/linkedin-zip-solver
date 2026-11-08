# Zip Auto Solver

A local Hamiltonian-path solver for LinkedIn Zip.

Zip is a path puzzle: visit every cell exactly once, move only up/down/left/right, never cross a wall, and pass 1, 2, 3, … in order.

I read existing open-source Zip solvers first (algorithms and DOM notes, not copied): [brohitbrose/linkedin-games](https://github.com/brohitbrose/linkedin-games), [Jed556/LinkedIn-Games-Solver](https://github.com/Jed556/LinkedIn-Games-Solver), [5teven1in/Linkedin-Game-Helper](https://github.com/5teven1in/Linkedin-Game-Helper), and Burak Şipşak’s userscript. The solver here is original and is tested against a 2×2, a walled 2×2, a 3×3, and the live 8×8 #601 path.

```bash
npm test
```
