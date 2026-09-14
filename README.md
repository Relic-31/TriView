# TriView

**Interactive orthographic drawing practice · 三视图补线练习**

TriView generates a solid, displays three incomplete orthographic views, and asks you to restore one or two missing features. Reveal and rotate the matching 3D model when you need a hint.

## Features

- First-angle projection: front view at the upper left, left view at the upper right, and top view below the front.
- Five families of solids with chamfers, arched tops, semicircular grooves, steps, round holes, oblong holes, and counterbores.
- Exterior silhouettes are preserved when generating exercises.
- Draw straight or diagonal lines, circular arcs, and circles as solid or dashed lines.
- Undo or erase your additions. Incorrect answers retry the same exercise; correct answers advance automatically.
- Optional 3D preview with rotation and zoom.

The interface is currently in Chinese. See [the French guide](docs/README.fr.md) or the Chinese introduction below.

## Run

Download the repository using **Code → Download ZIP**, extract it, and open \`index.html\` in a modern browser.

No installation, build step, backend, account, or CDN is required. Keep the \`src\` and \`assets\` folders beside \`index.html\`.

Alternatively, serve the repository with a static HTTP server:

\`\`\`sh
python3 -m http.server 8000
\`\`\`

Then open http://localhost:8000.

## Controls

| Tool | Input |
| --- | --- |
| Straight / diagonal line | Start → end; dragging also works |
| Circle | Center → point on circumference; dragging also works |
| Arc | Center → start → end; choose clockwise or counterclockwise |
| Eraser | Click one of your added strokes |
| 3D preview | Drag or use arrow keys to rotate; wheel to zoom |

The grid shows half-unit intervals and snaps to quarter units. These are exercise coordinates, not physical measurements.

Keyboard shortcuts: \`1\` solid, \`2\` dashed, \`E\` eraser, \`Esc\` cancel selection, \`Ctrl/Cmd+Z\` undo. Focus a drawing view and use arrow keys to move the cursor, then Space or Enter to select a point.

## Project structure

| Path | Purpose |
| --- | --- |
| \`index.html\` | Complete page and accessible controls |
| \`assets/styles.css\` | Layout and responsive styling |
| \`src/geometry.js\` | Solids, orthographic projection, visibility, grading, mesh generation |
| \`src/renderer.js\` | Canvas 3D renderer and camera controls |
| \`src/app.js\` | Exercises, SVG drawing, input, feedback, progression |
| \`tests/geometry.test.cjs\` | Geometry and grading regression tests |
| \`docs/manual-checks.md\` | Browser acceptance checklist |
| \`docs/README.fr.md\` | French usage guide |

Scripts use a small \`TriView\` namespace and load in order with \`defer\`, so the app also works directly from a local file.

## Tests

Node.js 20 or newer is sufficient; there are no npm dependencies.

\`\`\`sh
npm test
\`\`\`

These tests check geometry, silhouette preservation, grading, and mesh construction. They do not replace real-browser testing of rendering, mouse/touch input, or accessibility. The browser checklist records what to verify, not a claim that those checks have passed.

## Publish with GitHub Pages

In this repository, open **Settings → Pages**. Select **Deploy from a branch**, choose **main** and **/(root)**, and save.

Once GitHub reports a successful deployment, the expected project address is:
https://relic-31.github.io/TriView/

This address is not a claim that hosting has already been enabled.

## Scope and limitations

TriView is a teaching prototype for the included families of extruded solids, not a general-purpose CAD drawing engine.

- Drawing circles and arcs are analytic; the 3D mesh and parts of visibility calculation approximate curved surfaces using polygons.
- Grading checks sampled geometric coverage with a tolerance, not symbolic equality.
- The generated model defines the expected answer. A set of incomplete views is not guaranteed to determine a unique solid.
- Original problem lines cannot be edited.
- The current exercise and completion count reset on refresh.
- Dimensioning, centerlines, sections, and arbitrary CAD imports are not implemented.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). When reporting a projection or grading problem, include your browser/device and screenshots of the three views, your strokes, and the revealed model before refreshing.

## 中文说明

TriView 是一个工程制图练习网页。程序先生成立体模型，再显示缺少一至两处线条的三视图，并保留外轮廓。你可以补实线、虚线、斜线、圆弧和整圆；答错后重做原题，正确后自动进入下一题。

遇到困难时，可以展开隐藏的立体模型并旋转观察。当前模型包含切角、圆弧面、半圆槽、阶梯、圆孔、长圆孔和沉孔。

下载并解压整个项目，直接打开 \`index.html\` 即可。项目仍处于教学原型阶段，投影细节和浏览器兼容性欢迎反馈与改进。

## License

[MIT](LICENSE) © 2026 Relic-31.
