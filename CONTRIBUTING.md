# Contributing to TriView

Please describe the user-visible problem before changing code. For a drawing or grading bug, include the browser, a screenshot of all three views, the lines you drew and the expected result. Questions are generated randomly, so a screenshot is useful before refreshing.

## Development

Open `index.html` directly, or serve the repository with a static HTTP server. There is no build process and no runtime dependency. Keep local script references relative and ordered: geometry, polyhedra, worksheets, renderer, app. Avoid remote CDN imports so offline use remains possible.

Run `npm test` with Node.js 20 or newer; no install step is needed. Before submitting a UI change, complete the relevant [manual checks](docs/manual-checks.md) in a real browser. Automated geometry tests and the simulated DOM tests do not verify browser layout, SVG coordinate transforms or actual pointer capture.

## Geometry conventions

Coordinates use x for width, y for depth toward the back and z for height. View indices are front (0), left (1) and top (2). These are arranged using first-angle projection. Curves are line segments or analytic circular arcs, with angles in radians. Arc sweeps may be negative; a full circle has an absolute sweep of 2π.

Curved models are extruded outer profiles with nested holes in two depth layers. Planar models use triangular cells with piecewise linear upper and lower surfaces. Vertices are [x, y, top, bottom?], with the lower surface defaulting to zero. Raised lower surfaces form real tunnels and cantilevers. Adjacent vertical intervals are subtracted, with footprint edges split at T-junctions. Their exposed mesh edges drive orthographic visibility, and coplanar cell seams are removed. Preserve silhouette edges when choosing omissions. Use the same model for the views, the expected answer and the 3D mesh.

Keep numbered worksheet IDs stable; descriptions and reconstruction assumptions are in docs/model-catalog.md. For new solid families, add independent projection, material volume or area regression cases and check whether the quarter-unit input grid can reproduce every missing curve. Planar candidates whose endpoints cannot be drawn on this grid are excluded. Check front and rear counterbores when changing curved solids.

## Pull requests

Explain the problem, resulting behavior, tests performed and remaining limitations. Avoid committing dependencies, generated logs or credentials. Contributions use the project's MIT license.
