import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Graph } from '../src/graph.js';

test('addNode is idempotent and addEdge auto-creates missing nodes', () => {
  const g = new Graph();
  g.addNode('a');
  g.addNode('a');
  assert.equal(g.nodes.size, 1);
  g.addEdge('a', 'b');
  assert.equal(g.nodes.size, 2);
  assert.equal(g.edges.length, 1);
});

test('self-loops are ignored', () => {
  const g = new Graph();
  g.addEdge('a', 'a');
  assert.equal(g.edges.length, 0);
});

test('neighbors and degree reflect undirected edges', () => {
  const g = new Graph();
  g.addEdge('a', 'b');
  g.addEdge('a', 'c');
  assert.deepEqual(new Set(g.neighbors('a')), new Set(['b', 'c']));
  assert.equal(g.degree('a'), 2);
  assert.equal(g.degree('b'), 1);
});

test('fromJSON round-trips a plain object graph', () => {
  const json = {
    nodes: [{ id: 'x' }, { id: 'y' }, { id: 'z' }],
    edges: [{ source: 'x', target: 'y' }, { source: 'y', target: 'z', weight: 2 }],
  };
  const g = Graph.fromJSON(json);
  assert.equal(g.nodes.size, 3);
  assert.equal(g.edges.length, 2);
  assert.equal(g.edges[1].weight, 2);
});
