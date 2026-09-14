# Contributing to TriView

Please describe the user-visible problem before changing code. For a drawing or grading bug, include the browser, a screenshot of all three views, the lines you drew and the expected result. Questions are generated randomly, so a screenshot is useful before refreshing.

## Development

Open `index.html` directly, or serve the repository with a static HTTP server. There is no build process and no runtime dependency. Keep local script references relative and ordered: geometry, renderer, app. Avoid remote CDN imports so offline use remains possible.

Run `npm test` with Node.js 20 or newer; no install step is needed. Before submitting a UI change, complete the relevant [manual checks](docs/manual-checks.md) in a real browser. Automated geometry tests and the simulated DOM tests do not verify browser layout, SVG coordinate transforms or actual pointer capture.

## Geometry conventions

Coordinates use x for width, y for depth toward the back and z for height. View indices are front (0), left (1) and top (2). These are arranged using first-angle projection. Curves are line segments or analytic circular arcs, with angles in radians. Arc sweeps may be negative; a full circle has an absolute sweep of 2π.

Each generated model is an extruded outer profile with nested holes in two depth layers. Preserve silhouette edges when choosing omissions. Use the same model for the views, the expected answer and the 3D mesh.

For new solid families, add independent projection or area regression cases, verify both front and rear counterbores, and check whether the quarter-unit input grid can reproduce every missing curve.

## Pull requests

Explain the problem, resulting behavior, tests performed and remaining limitations. Avoid committing dependencies, generated logs or credentials. Contributions use the project's MIT license.
