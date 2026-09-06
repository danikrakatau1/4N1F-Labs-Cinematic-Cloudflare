# 4N1F Labs — Blueprint Checkpoint V1.2.4

Status: **Blueprint saved / historical baseline revived into 4NIF-Labs-Cinematic**

## Product direction
4N1F Labs is a visual-first development studio: users edit by eye while the engine generates and preserves code, patches, responsive transforms, assets, and history behind the scenes.

Core principle: **visual-first, code-behind, full ownership**.

## Working architecture
- Cloud preview workflow: HTML + CSS + JS snapshot -> immutable package KEY -> random Preview ID -> sandboxed live renderer.
- Safe editor bridge: iframe-side bridge + postMessage parent/child communication.
- Preview source is sandboxed; parent does not directly inspect iframe DOM.
- GitHub Direct Publish -> Supabase package publish -> published/latest.json checkpoint.
- Editor source is modular under editor/ plus additive feature files under editor/addons/.

## Stable editor capability stack so far
1. Load target preview by Preview ID.
2. Select/inspect visual elements.
3. Real-time text and visual style editing.
4. Color picker + alpha + presets.
5. Desktop / Tablet / Mobile preview.
6. Undo / Redo for existing edit flow.
7. Visual -> Code.
8. Patch JSON.
9. Cumulative Multi-Patch Session Engine.
10. Asset upload/replace as local draft.
11. Source Bundle JSON export.
12. Direct visual manipulation: drag, resize, rotate, keyboard nudge.
13. Deep selection: Alt+click cycle and right-click stacked layers.
14. Smart guides and measurement labels.
15. Independent editor/inspector scroll behavior.
16. Layer navigation: Parent / First Child / Prev / Next.
17. Lock / Unlock layer.
18. Physical Delete + Restore Last.
19. Context stack dismissal on scroll/wheel/outside-click/Escape/resize/blur.
20. Align Left / Center / Right.
21. Align Top / Middle / Bottom.
22. Equal horizontal / vertical gap tools.
23. Reset position.
24. Responsive transform scope: All / Desktop >=1024 / Tablet 600-1023 / Mobile <=599.
25. Responsive transform code emits matching @media wrappers.

## Historical build checkpoint
- Version: 4N1F-Live-Editor-V1.2.4
- KEY: 4N1F_32262810172A
- Package hash: 5027bdadb372ef4ecdf99a33ac07df0481215d0a58995d0674075b2c895888ba

Previous critical hotfix:
- V1.2.3.1 context stack dismissal
- KEY: 4N1F_7D0A361E4BFF

Historical OLED target commonly edited in Labs:
- Target Preview ID: p_bcd241e3be015ff83906a68cc29d3092

Remember: Studio Preview ID and Target Preview ID are different concepts.

## Next Labs roadmap
- Multi-selection (Shift+click and eventually marquee selection).
- Distribute selected elements horizontally/vertically.
- Group / Ungroup visual selection.
- Align multiple selected elements to each other / selection bounds.
- Better equal-spacing detector.
- Responsive edits per breakpoint with persistent scoped state.
- Undo/Redo for direct manipulation + delete/restore/group actions.
- Semantic data-4n1f-id migration away from brittle nth-of-type selectors.
- Preview Interaction Mode vs Edit/Transform Mode.
- Safe Layout vs Free Transform.
- Effects/Animation controls.
- Save/Publish Version + revision history/rollback/compare.
- Diagnostics/performance.
- Local Project Mode: Open Folder -> File Tree -> Visual <-> Code Sync -> Save to Disk using browser-granted File System Access.
- Cloud/Local hybrid workspace model.

## Local Project Mode concept
Two project modes:
- Cloud Project: immutable snapshot/Preview ID workflow.
- Local Project: user grants a local folder through browser File System Access API; Labs reads HTML/CSS/JS/assets, renders them, edits visually, synchronizes code, and writes back only with explicit granted permission.

Browser constraint: no arbitrary filesystem access. User gesture + permission are mandatory. Chromium desktop is the primary target; Safari/iOS support is more limited.

## Product philosophy
The user should be able to think visually:
- "geser kiri sedikit"
- "samakan jarak"
- "center-kan"
- "perkecil"
- "buat khusus mobile"

4N1F Labs translates those visual decisions into selectors, transforms, spacing, responsive media rules, patches, and generated source behind the scenes.

## Revival note
The historical baseline has now been separated from the old host repository and revived under `danikrakatau1/4NIF-Labs-Cinematic`. The new repository is the standalone continuation point for the cinematic/Figma-style visual editor direction.
