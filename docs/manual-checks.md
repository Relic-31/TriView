# Browser verification checklist

These are manual checks to perform before a release, not a claim that every listed browser has already passed. Automated tests exercise geometry and a simulated DOM.

## Loading and layout

- Download the repository ZIP and extract it; open `index.html` with the adjacent `assets` and `src` folders intact.
- Repeat through a local HTTP server and GitHub Pages if enabled.
- Confirm all interface text, tooltips, keyboard labels and status messages are in English.
- Confirm all three drawings appear without console errors, the model is initially collapsed, and no remote library requests are needed.
- Check desktop Chrome/Edge, Firefox and Safari, plus mobile Safari/Chrome.
- At narrow widths, check that all controls remain usable, there is no horizontal page overflow, and the front/left/top placement stays consistent.

## Drawing and grading

- Draw a line by two clicks and by dragging. Verify endpoints align with the grid after scrolling and browser zoom.
- Choose dashed lines. Draw a circle by center/radius, and semicircles in both directions by center/start/end.
- Try mismatched arc radii and repeated points: no invalid geometry should be committed.
- Cancel a partially drawn curve with Escape. Change tools or move to another view halfway through a stroke.
- Erase a user stroke; check original lines cannot be erased. Undo drawing and erasing.
- Submit an empty answer, a wrong line type and an extra line. Each should fail and offer retry on the same question.
- Retry should clear user strokes and preserve the model and omissions.
- Complete an answer accurately: correct feedback appears, the completed count increments once, then a new question appears after about 1.4 seconds.
- Verify protected outer outlines remain present for all 25 solid families.

## Pointer and keyboard behavior

- Cancel a touch gesture, drag outside the canvas, and release. No stray stroke should remain.
- Focus a view using Tab, move with arrow keys and choose points with Enter/Space. Shift increases the movement step.
- Check line-type shortcuts 1/2, eraser E and Ctrl/Command+Z.
- Check focus visibility and live status feedback. Drawing still requires visual interpretation; this is not a fully nonvisual drawing interface.

## 3D reference

- Expand the model, rotate by drag and arrow keys, zoom with the wheel, and try the preset views.
- Confirm holes stay open and curved walls remain joined while rotating.
- Hide/show the model and solve a question while it is open. The next question must hide and reset it.
- Compare the model's front/left/top presets with the corresponding two-dimensional views.
