# TriView

Practice completing missing lines in orthographic drawings.

## Run

**[Open TriView in your browser →](https://relic-31.github.io/TriView/)**

No download or installation needed.

## How it works

1. Choose a model or mixed practice, then compare the front, left and top views.
2. Add the missing solid or dashed lines. Use the arc and circle tools when needed.
3. Check your answer: retry mistakes or advance to the next exercise.
4. Reveal and rotate the matching 3D model for a hint.

Includes 49 solid families, with changing proportions and orientations: ramps, stairs, towers, channels, pyramidal roofs, portals, cantilevers and curved profiles. The model picker includes all 16 numbered reconstructions from the two reference worksheets, plus eight related designs. See the [model catalog](docs/model-catalog.md). Outer silhouettes stay intact.

## Development

Plain HTML, CSS and JavaScript, with no runtime dependencies. Open `index.html` locally. Run `npm test` with Node.js 20+.

- `src/geometry.js`: curved solids, grading and exercises
- `src/polyhedra.js`: planar solids, lower surfaces and projections
- `src/worksheets.js`: numbered worksheet reconstructions and related designs
- `src/renderer.js`: rotatable 3D reference
- `src/app.js`: drawing controls and feedback

This is a teaching prototype, not a general CAD engine. Curved visibility is approximated; grading uses a geometric tolerance. See [contributing](CONTRIBUTING.md) and [browser checks](docs/manual-checks.md).

[Changelog](CHANGELOG.md) · [Release and rollback](docs/releases.md) · [MIT License](LICENSE) · Relic-31
