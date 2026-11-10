---
name: xiaoke-lab
description: Generate an interactive 3D virtual lab lesson (中小学理化生实验课件) as a single offline HTML file. Use when the user asks for a 实验课 / 实验课件 / 虚拟实验 / 3D 实验 / interactive lab simulation for a school chemistry, physics or biology experiment (e.g. "帮我做一个七年级物理『探究平面镜成像特点』的实验课"). Produces realistic apparatus on a lab bench, step-by-step guided operation, predict-observe-explain cards, "what if I do it wrong" consequence demos with rewind, a second view (particles / ray diagram / microscope field), and a lesson summary.
---

# 小课实验室 · 实验课件生成

This skill turns a lab experiment request into **one self-contained HTML file** that runs offline in any modern browser (phone landscape, tablet, PC, classroom screen). You write an **experiment config** in plain JavaScript; the bundled runtime renders the 3D lab and runs the lesson.

Requirements: Node ≥ 18. No npm install, no network, no browser needed. All paths below are relative to this skill's directory (`<skill>`).

## Workflow

### 1. Pin down the experiment (ask only if truly ambiguous)
- Subject, grade, textbook edition if given (人教版 / 北师大版 / 沪教版 …), and the exact experiment.
- If the user names only a topic, choose the standard textbook experiment for that grade and say which one you chose.
- Read `reference/realism.md` first: real proportions and connections, true reagent colours, phenomena in the right order. A course that is correct but looks fake fails the teacher just as much as one that looks good but is wrong.
- Write down the **scientific content** before any code: apparatus list, procedure, expected phenomena, equations/laws, safety notes, the classic mistakes students make. Check it against your knowledge of the curriculum; when a value matters (焦距、温度、浓度、倍数), state it explicitly. Accuracy beats spectacle — a teacher will use this in class.

### 2. Design the lesson — read `reference/pedagogy.md`
Every course must have:
- 6–10 **steps**, each one concrete operation with an observable result.
- ≥ 3 **predictions** (预测—观察—解释): asked *before* the step reveals the answer, with plausible distractors drawn from real misconceptions.
- ≥ 3 **"假如这样做" mistakes**: a wrong operation students really make, a visible consequence demo with the camera pushed in, a one-line lesson, then rewind.
- A **second view** that shows what the eye can't: particles (chemistry), ray diagram or force diagram (physics), microscope field (biology). Keep the key phenomenon visible at all times.
- Observation text per step and a summary.

### 3. Write the config
1. Start from a skeleton: `node <skill>/scripts/new-course.mjs --id plane-mirror --subject physics --title "探究平面镜成像的特点" -o plane-mirror.js`
2. Read the closest example in `examples/` first (chemistry heating → `copper.js`/`oxygen.js`; gas generation → `co2.js`; optics bench → `lens.js`; mirror / glass plate / custom 2D view → `plane-mirror.js`; microscope/biology → `microscope.js`).
3. API: `reference/config-schema.md` (config + ctx), `reference/apparatus.md`, `reference/effects.md`, `reference/interactions.md`, `reference/views.md`.
4. Apparatus not in the library → build it procedurally per `reference/custom-apparatus.md`. Never fake a missing part with an unrelated object.
5. Second view: chemistry should **prioritize built-in particles**, using `views.molecules` for formula-based molecular geometry and conserving reactions; use `rayDiagram` for lenses and `eyepieceView` for microscopes. Reserve `views.custom2d` for charts and diagrams such as temperature–time, light paths or leaf comparisons (see `reference/views.md`) — never draw your own overlay outside the runtime, it would not get layout space. Extra source files go in with `--include extra.js`; never hand-edit the built HTML.

### 4. Validate — loop until clean
`node <skill>/scripts/validate-course.mjs plane-mirror.js`
It walks every step, every prediction, and every mistake + rewind without a browser, and checks geometry (floating or interpenetrating parts, clipping and step focus points off-screen or under a panel). Fewer than 6 steps / 3 predictions / 3 mistakes is an error (`minimums:false` only for a deliberately short demo); every prediction still needs at least three options and a nonempty explanation. Fix every **error**; fix warnings unless you have a reason.

### 5. Build
`node <skill>/scripts/build-course.mjs plane-mirror.js -o plane-mirror.html [--include extra.js]`
The build re-runs validation and refuses to package a failing course.
Give the user the HTML file. Tell them: double-click to open; on a phone, rotate to landscape; use the fullscreen button for class projection.

### 6. Visual self-check — before handing over
`node <skill>/scripts/preview-course.mjs plane-mirror.js --all --out preview.png`
Renders, without any browser, one schematic image per step: main camera with the second-view and panel areas marked, plus top and side views. If you can view images, look at every one against `reference/visual-checklist.md` and the list at the end of `reference/realism.md` — floating parts, misaligned assemblies, things under a panel, the key phenomenon out of frame — fix and re-run. If you can open the HTML in a browser, check it there too. If you can do neither, say so and list what the teacher should glance at.

## Hard rules (learned the hard way)
- Make it look like the real bench: apparatus at real relative sizes, joints that actually connect, the outer flame touching what it heats, reagents in their true colours, changes that build up gradually from where the reaction happens. Use the flame that matches the fuel (`flame()` for an alcohol lamp, `flame({gas:true})` for CO / H₂ / CH₄ at a nozzle). Never tint a colourless liquid to make it "show up" — the runtime already renders liquid surfaces and volumes.
- The page opens in high quality (refractive glass, soft shadows, flame light) and falls back by itself on slow devices; do not set `quality: 'standard'` unless the user asks for a low-end build.
- Frame the complete visible assembly with a little breathing room; aim for 60–85% of the free area's longest dimension. Over 90% or clipping raises a warning. Use close-ups for step focus and consequences, not the default shot. Panels must never cover apparatus.
- Consequence demos push the camera **in** to where the phenomenon happens, never out.
- Nothing floats: tools rest on the bench or in a holder between actions; tubes actually reach into liquids; stoppers seat in mouths.
- No `InstancedMesh` (breaks on iOS). Generated textures must be redrawn at the needed resolution, not upscaled.
- Every mistake must rewind to exactly the prior state (validator checks this).
- Positions are scene units with the bench top at y = 0 (not real centimetres); align parts through anchors and world positions, never by guessing numbers (see `reference/apparatus.md`).
- `setup(ctx)` is re-run on every rewind: it must be repeatable, and step code must not keep object references across steps.

## Output to the user
- The `.html` file, plus a 3–5 line summary: experiment, steps, predictions, mistakes, anything simplified or assumed.
- Do not claim you tested it visually unless you did.
