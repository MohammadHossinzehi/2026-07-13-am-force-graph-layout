import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QuadTree } from '../src/quadtree.js';

test('empty tree has zero mass and no crash on force query', () => {
  const tree = QuadTree.fromPoints([]);
  assert.equal(tree.mass, 0);
  const out = { x: 0, y: 0 };
  tree.applyForce({ x: 0, y: 0, mass: 1 }, 0.5, () => [1, 1], out);
  assert.equal(out.x, 0);
  assert.equal(out.y, 0);
});

test('single point tree reports correct mass and center of mass', () => {
  const p = { x: 3, y: 4, mass: 2, id: 'a' };
  const tree = QuadTree.fromPoints([p]);
  assert.equal(tree.mass, 2);
  assert.equal(tree.comX, 3);
  assert.equal(tree.comY, 4);
  assert.equal(tree.countPoints(), 1);
});

test('aggregate mass equals sum of point masses after many inserts', () => {
  const points = [];
  for (let i = 0; i < 200; i++) {
    points.push({ x: Math.random() * 100, y: Math.random() * 100, mass: 1, id: i });
  }
  const tree = QuadTree.fromPoints(points);
  assert.equal(tree.mass, 200);
  assert.equal(tree.countPoints(), 200);
});

test('center of mass matches manually computed centroid', () => {
  const points = [
    { x: 0, y: 0, mass: 1, id: 'a' },
    { x: 10, y: 0, mass: 1, id: 'b' },
    { x: 0, y: 10, mass: 1, id: 'c' },
    { x: 10, y: 10, mass: 1, id: 'd' },
  ];
  const tree = QuadTree.fromPoints(points);
  assert.ok(Math.abs(tree.comX - 5) < 1e-9);
  assert.ok(Math.abs(tree.comY - 5) < 1e-9);
});

test('theta=0 (exact traversal) matches brute-force pairwise force sum', () => {
  const points = [];
  for (let i = 0; i < 40; i++) {
    points.push({ x: Math.random() * 50, y: Math.random() * 50, mass: 1, id: i });
  }
  const tree = QuadTree.fromPoints(points);
  const repel = (dx, dy, dist, mass) => {
    const f = -(mass) / dist;
    return [(dx / dist) * f, (dy / dist) * f];
  };

  for (const target of points) {
    const bh = { x: 0, y: 0 };
    tree.applyForce(target, 0, repel, bh);

    const brute = { x: 0, y: 0 };
    for (const other of points) {
      if (other === target) continue;
      const dx = other.x - target.x;
      const dy = other.y - target.y;
      const dist = Math.hypot(dx, dy) || 1e-6;
      const [fx, fy] = repel(dx, dy, dist, other.mass);
      brute.x += fx;
      brute.y += fy;
    }

    assert.ok(Math.abs(bh.x - brute.x) < 1e-6, `x mismatch for point ${target.id}`);
    assert.ok(Math.abs(bh.y - brute.y) < 1e-6, `y mismatch for point ${target.id}`);
  }
});

test('larger theta approximates but does not exactly match brute force', () => {
  const points = [];
  for (let i = 0; i < 60; i++) {
    points.push({ x: Math.random() * 200, y: Math.random() * 200, mass: 1, id: i });
  }
  const tree = QuadTree.fromPoints(points);
  const repel = (dx, dy, dist, mass) => {
    const f = -mass / dist;
    return [(dx / dist) * f, (dy / dist) * f];
  };

  const target = points[0];
  const bh = { x: 0, y: 0 };
  tree.applyForce(target, 1.2, repel, bh);

  const brute = { x: 0, y: 0 };
  for (const other of points) {
    if (other === target) continue;
    const dx = other.x - target.x;
    const dy = other.y - target.y;
    const dist = Math.hypot(dx, dy) || 1e-6;
    const [fx, fy] = repel(dx, dy, dist, other.mass);
    brute.x += fx;
    brute.y += fy;
  }

  // Should be in the right ballpark (same general direction/magnitude)
  // even though the approximation introduces error.
  const bhMag = Math.hypot(bh.x, bh.y);
  const bruteMag = Math.hypot(brute.x, brute.y);
  assert.ok(bhMag > 0 && bruteMag > 0);
  const ratio = bhMag / bruteMag;
  assert.ok(ratio > 0.5 && ratio < 2, `approximation too far off: ratio=${ratio}`);
});
