# TriView

Practice completing missing lines in orthographic drawings.

## Run

**[Open TriView in your browser →](https://relic-31.github.io/TriView/)**

No download or installation needed.

## How it works

1. Compare the front, left and top views.
2. Add the missing solid or dashed lines. Use the arc and circle tools when needed.
3. Check your answer: retry mistakes or advance to the next exercise.
4. Reveal and rotate the matching 3D model for a hint.

Includes 13 solid families: irregular ramps, oblique faces, corner cuts, stepped ribs, recessed channels, curved profiles and counterbored holes. Outer silhouettes stay intact.

## Development

Plain HTML, CSS and JavaScript, with no runtime dependencies. Open `index.html` locally. Run `npm test` with Node.js 20+.

- `src/geometry.js`: curved solids, grading and exercises
- `src/polyhedra.js`: planar solids and their projections
- `src/renderer.js`: rotatable 3D reference
- `src/app.js`: drawing controls and feedback

This is a teaching prototype, not a general CAD engine. Curved visibility is approximated; grading uses a geometric tolerance. See [contributing](CONTRIBUTING.md) and [browser checks](docs/manual-checks.md).

[MIT License](LICENSE) · Relic-31
