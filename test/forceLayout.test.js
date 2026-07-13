import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Graph } from '../src/graph.js';
import { ForceLayout } from '../src/forceLayout.js';

test('single node does not crash and stays finite', () => {
  const g = new Graph();
  g.addNode('a', { x: 50, y: 50 });
  const layout = new ForceLayout(g, { width: 100, height: 100 });
  layout.run(20);
  const a = g.nodes.get('a');
  assert.ok(Number.isFinite(a.x) && Number.isFinite(a.y));
});

test('two unconnected nodes repel apart from a shared starting point', () => {
  const g = new Graph();
  g.addNode('a', { x: 50, y: 50 });
  g.addNode('b', { x: 50.001, y: 50 }); // nearly coincident on purpose
  const layout = new ForceLayout(g, { width: 400, height: 400, gravity: 0 });
  const before = Math.hypot(
    g.nodes.get('a').x - g.nodes.get('b').x,
    g.nodes.get('a').y - g.nodes.get('b').y,
  );
  layout.run(50);
  const after = Math.hypot(
    g.nodes.get('a').x - g.nodes.get('b').x,
    g.nodes.get('a').y - g.nodes.get('b').y,
  );
  assert.ok(after > before, `expected nodes to separate: before=${before} after=${after}`);
});

test('connected nodes settle near the ideal spring distance k', () => {
  const g = new Graph();
  g.addNode('a', { x: 0, y: 50 });
  g.addNode('b', { x: 400, y: 50 }); // start far apart
  g.addEdge('a', 'b');
  const layout = new ForceLayout(g, { width: 400, height: 100, gravity: 0.01 });
  layout.run(300, 0.001);
  const dist = Math.hypot(
    g.nodes.get('a').x - g.nodes.get('b').x,
    g.nodes.get('a').y - g.nodes.get('b').y,
  );
  // Should converge to roughly k, the ideal edge length, within a generous band.
  assert.ok(dist > layout.k * 0.4 && dist < layout.k * 2.5, `dist=${dist} k=${layout.k}`);
});

test('run() converges (stops before maxIterations) for a small random graph', () => {
  const g = new Graph();
  for (let i = 0; i < 25; i++) g.addNode(`n${i}`);
  for (let i = 0; i < 25; i++) {
    g.addEdge(`n${i}`, `n${(i + 1) % 25}`);
  }
  const layout = new ForceLayout(g, { width: 600, height: 600 });
  const { iterations, finalMove } = layout.run(500, 0.05);
  assert.ok(iterations < 500, 'expected convergence before hitting the iteration cap');
  assert.ok(finalMove <= 0.05 + 1e-6);
});

test('all node positions stay within canvas bounds and finite', () => {
  const g = new Graph();
  for (let i = 0; i < 80; i++) g.addNode(`n${i}`);
  for (let i = 0; i < 120; i++) {
    const a = `n${Math.floor(Math.random() * 80)}`;
    const b = `n${Math.floor(Math.random() * 80)}`;
    if (a !== b) g.addEdge(a, b);
  }
  const layout = new ForceLayout(g, { width: 500, height: 300 });
  layout.run(150);
  for (const n of g.nodeList) {
    assert.ok(Number.isFinite(n.x) && Number.isFinite(n.y));
    assert.ok(n.x >= -1e-6 && n.x <= 500 + 1e-6);
    assert.ok(n.y >= -1e-6 && n.y <= 300 + 1e-6);
  }
});

test('brute force and Barnes-Hut modes both keep an 80-node graph stable', () => {
  const build = () => {
    const g = new Graph();
    for (let i = 0; i < 80; i++) g.addNode(`n${i}`, { x: Math.random() * 500, y: Math.random() * 500 });
    for (let i = 0; i < 80; i++) g.addEdge(`n${i}`, `n${(i + 7) % 80}`);
    return g;
  };

  const brute = new ForceLayout(build(), { width: 500, height: 500, useBarnesHut: false });
  const bh = new ForceLayout(build(), { width: 500, height: 500, useBarnesHut: true, theta: 0.8 });

  brute.run(100);
  bh.run(100);

  for (const n of brute.graph.nodeList) assert.ok(Number.isFinite(n.x) && Number.isFinite(n.y));
  for (const n of bh.graph.nodeList) assert.ok(Number.isFinite(n.x) && Number.isFinite(n.y));
});
