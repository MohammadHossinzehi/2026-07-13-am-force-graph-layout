# Force-Directed Graph Layout Engine (Barnes-Hut, from scratch)

A dependency-free JavaScript implementation of force-directed graph layout
(the Fruchterman-Reingold spring-electrical model), sped up with a
from-scratch Barnes-Hut quadtree so it stays usable on graphs with hundreds
or thousands of nodes instead of grinding to a halt.

Point it at any node/edge list and it arranges the graph so that connected
things end up close together, unconnected things push apart, and clusters
emerge visually without any manual layout. There's an interactive canvas
demo included, and it comes with a full test suite plus a benchmark that
quantifies the speedup Barnes-Hut actually buys you.

## Why this exists

Every serious graph visualization tool (D3, Gephi, Cytoscape, Obsidian's
graph view) uses some variant of force-directed layout under the hood.
The naive version is simple to write but is O(n²) per frame because every
node repels every other node — fine for 50 nodes, unusable for 2,000. The
standard fix, used in real physics engines and n-body simulators, is the
Barnes-Hut approximation: group distant nodes into a quadtree and treat a
whole faraway cluster as a single point-mass instead of visiting it
node-by-node. This project builds both the naive and the accelerated
version from scratch, side by side, so the payoff is directly measurable.

## What's in the box

- `src/quadtree.js` — a Barnes-Hut quadtree: recursive spatial
  subdivision, incremental center-of-mass aggregation, and a
  `theta`-controlled traversal that decides when a subtree is "far enough"
  to summarize as one mass instead of recursing further.
- `src/forceLayout.js` — the physics: repulsive Coulomb-like forces
  between all node pairs (via the quadtree or brute force), attractive
  spring forces along edges, a weak centering gravity so disconnected
  components don't drift off-screen, and a cooling schedule (simulated
  annealing style) so the system settles instead of oscillating forever.
- `src/graph.js` — a minimal undirected graph structure (just enough to
  drive the layout — no external graph library).
- `demo/index.html` + `demo/data.js` — an interactive canvas visualizer:
  drag nodes, pan, zoom, switch between the sample tech-ecosystem graph
  and a randomly generated 300-node stress test, and toggle Barnes-Hut
  on/off live to feel the difference.
- `benchmark.js` — times brute-force vs. Barnes-Hut across graph sizes
  from 50 to 2,000 nodes and prints the speedup.
- `test/` — unit tests for the quadtree's spatial correctness, the
  physics simulation's stability, and the graph structure.

## How to run it

Requires Node.js 18+.

```bash
# run the test suite
npm test

# see the Barnes-Hut speedup for yourself
npm run benchmark

# launch the interactive demo (ES modules need a real origin, not file://,
# so serve the folder rather than double-clicking the HTML file)
npx serve .
# then open the printed URL and navigate to /demo/
```

In the demo: drag any node to reposition it (the rest of the graph reacts
live), drag the background to pan, scroll to zoom, and use the checkbox to
toggle Barnes-Hut vs. brute-force repulsion — the "step time" readout in
the panel makes the cost difference obvious once you load the 300-node
random graph.

## Design decisions

**Why Fruchterman-Reingold over force-atlas or a spring-embedder variant.**
It's the clearest formulation to implement and verify correctness against
(force magnitude has a closed form: repulsion falls off as 1/d, attraction
grows as d², both parameterized by a single ideal-distance constant `k`
derived from canvas area and node count). That made it straightforward to
unit-test in isolation from the quadtree.

**Quadtree API is force-law-agnostic.** `QuadTree.applyForce` takes a
`repel(dx, dy, dist, mass)` callback rather than hardcoding the 1/d force
law, so the quadtree itself is just a spatial aggregation structure — it
doesn't know or care that it's being used for graph layout instead of,
say, gravity. That separation made both pieces independently testable.

**Coincident-point guard.** A naive Barnes-Hut quadtree recurses forever
if two points end up at (numerically) the exact same coordinates, since no
amount of subdivision separates them into different quadrants. This
actually happened during testing once positions got clamped to a shared
canvas corner. Fixed with a max-depth cutoff (`QuadTree.MAX_DEPTH = 32`)
past which colliding points are merged into the existing leaf's mass
rather than triggering another split — a standard practical fix, since at
that depth the points are indistinguishable at any rendering scale anyway.

**theta=0 must equal brute force.** At `theta = 0` the "is this subtree
far enough away to summarize" check never passes, so the algorithm is
forced to visit every leaf individually — mathematically identical to
brute force. This gives a strong correctness test: run both algorithms
head-to-head at theta=0 and assert the forces match to within floating
point tolerance (see `test/quadtree.test.js`). Larger theta values are then
checked only for staying in the right ballpark, since they're intentional
approximations.

## Testing

`npm test` runs `node --test` over `test/*.test.js`:

- **Quadtree correctness** — mass aggregation and center-of-mass match a
  manually computed centroid; `theta=0` traversal matches brute-force
  pairwise summation exactly; larger `theta` stays within a sane error
  band; empty and single-point trees don't crash.
- **Layout stability** — single-node and coincident-start graphs don't
  produce NaN/Infinity; connected nodes converge to roughly the ideal
  spring distance `k`; `run()` terminates before the iteration cap on a
  well-connected graph; all positions stay within canvas bounds after
  simulation; brute-force and Barnes-Hut modes both remain numerically
  stable on an 80-node graph.
- **Graph structure** — idempotent node insertion, self-loop rejection,
  undirected neighbor/degree bookkeeping, JSON round-tripping.

## Benchmark results (sample run, 20 steps per graph size)

| n     | brute-force | Barnes-Hut | speedup |
|-------|-------------|------------|---------|
| 50    | 11.2 ms     | 9.4 ms     | 1.19x   |
| 100   | 13.8 ms     | 18.6 ms    | 0.75x   |
| 250   | 50.2 ms     | 20.8 ms    | 2.42x   |
| 500   | 186.7 ms    | 53.8 ms    | 3.47x   |
| 1000  | 737.6 ms    | 133.7 ms   | 5.52x   |
| 2000  | 2915.0 ms   | 334.2 ms   | 8.72x   |

Numbers will vary by machine, but the shape is the point: below a couple
hundred nodes the quadtree's own construction cost isn't worth it, and
past that the O(n log n) approximation pulls steadily ahead as n grows.

## License

MIT
