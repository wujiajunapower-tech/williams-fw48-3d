# Replacing the procedural car

## v2 hierarchical subparts

The Chinese v2 interface preserves the eleven system IDs below. For finer interaction, author mesh `extras.subpart` to match the relevant IDs in `src/data/technical.js`. Examples: `sidepods` / `radiators`, `rear-wing` / `rear-flap`, `wheels` / `brake-discs`. Unknown or omitted subpart tags fall back to the system's first subpart; the adapter does not infer missing internals. Retune local explosion offsets for the imported asset. Calipers and ducts must remain outside the four rotating wheel pivots.

The v2 director and path fields live in `StoryDirector.js` and `FlowField.js`. Public geometry remains an approximation even when the interface exposes more hierarchy levels.

Place a licensed, self-contained `fw48.glb` in `public/models/`, then open:

`http://localhost:5173/?model=/models/fw48.glb`

Export metres, Y up, nose toward -X; ground Y=0. Front axle X=-1.55, rear axle X=1.85, wheel centre Y=0.355, lateral Z=±0.795. Approximate width 1.91m; wheelbase 3.40m. These values describe this approximation, not measured FW48 CAD. Align the replacement in Blender or another DCC so authored cameras and airflow remain meaningful.

Create exactly one group for each component ID (node.name or glTF extras.componentId):

`front-wing`, `nose`, `front-suspension`, `sidepods`, `airbox`, `floor`, `halo`, `engine-cover`, `rear-suspension`, `rear-wing`, `wheels`.

These eleven groups must not be nested inside each other. Other wrapper nodes are allowed. Under `wheels`, include four pivot groups named `wheel_FL`, `wheel_FR`, `wheel_RL`, `wheel_RR`. Position each pivot at its wheel centre. Their local Z axes must align with the axles, with no pre-rotation on the pivot group. Put wheel orientation rotations on child meshes. Do not put suspension, brake ducts or stationary callipers inside the rotating pivot. The stock procedural demonstration simplifies this distinction.

Optional wing pivot nodes may have `extras.activeAero: true`; rotate about local Z. This uses a fixed illustrative angle, not FW48 actuator kinematics.

Use one material per mesh; split multi-material geometry before export. The adapter uses the first material if an array is supplied. Standard uncompressed glTF 2.0/GLB is supported. Draco, Meshopt and KTX2 decoders are not configured. For glTF keep `.bin` and texture URLs relative and same-origin. Convert FBX through Blender to GLB first. Keep triangle count near 150k–400k and textures at 1k–2k for normal desktop use.

If required nodes are absent or loading fails, the procedural model is retained and an on-screen notice explains the problem. Loading is opt-in; the default experience needs no external model download. Successful replacement changes visible exterior geometry only; authored airflow and camera targets remain approximate and should be reauthored for the new asset.
