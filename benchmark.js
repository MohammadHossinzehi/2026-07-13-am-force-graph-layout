// Compares brute-force O(n^2) repulsion against the Barnes-Hut O(n log n)
// approximation across increasing graph sizes. Run with `npm run benchmark`.

import { Graph } from './src/graph.js';
import { ForceLayout } from './src/forceLayout.js';

function buildRandomGraph(n, extraEdgesPerNode = 2) {
  const g = new Graph();
  for (let i = 0; i < n; i++) {
    g.addNode(`n${i}`, { x: Math.random() * 1000, y: Math.random() * 1000 });
  }
  for (let i = 0; i < n; i++) {
    for (let e = 0; e < extraEdgesPerNode; e++) {
      const j = Math.floor(Math.random() * n);
      if (j !== i) g.addEdge(`n${i}`, `n${j}`);
    }
  }
  return g;
}

function timeSteps(layout, steps) {
  const start = performance.now();
  for (let i = 0; i < steps; i++) layout.step();
  return performance.now() - start;
}

const sizes = [50, 100, 250, 500, 1000, 2000];
const stepsPerRun = 20;

console.log('n\tbrute-force (ms)\tbarnes-hut (ms)\tspeedup');
console.log('-'.repeat(60));

for (const n of sizes) {
  const bruteGraph = buildRandomGraph(n);
  const bhGraph = Graph.fromJSON({
    nodes: bruteGraph.nodeList.map((node) => ({ id: node.id, x: node.x, y: node.y })),
    edges: bruteGraph.edges,
  });

  const bruteLayout = new ForceLayout(bruteGraph, { width: 1000, height: 1000, useBarnesHut: false });
  const bhLayout = new ForceLayout(bhGraph, { width: 1000, height: 1000, useBarnesHut: true, theta: 0.8 });

  const bruteMs = timeSteps(bruteLayout, stepsPerRun);
  const bhMs = timeSteps(bhLayout, stepsPerRun);
  const speedup = bruteMs / bhMs;

  console.log(`${n}\t${bruteMs.toFixed(1)}\t\t\t${bhMs.toFixed(1)}\t\t\t${speedup.toFixed(2)}x`);
}

console.log('\nNote: at small n the quadtree construction overhead can outweigh its');
console.log('savings; the crossover where Barnes-Hut wins is usually in the low');
console.log('hundreds of nodes, and the gap widens quickly beyond that.');
