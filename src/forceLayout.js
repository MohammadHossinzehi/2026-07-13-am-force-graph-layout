// Force-directed graph layout (Fruchterman-Reingold spring-electrical model)
// with an optional Barnes-Hut quadtree to approximate the repulsive term.
//
// Physical model:
//   - Every pair of nodes repels like same-sign charges: Fr = -k^2 / d
//   - Every edge acts like a spring pulling its endpoints together: Fa = d^2 / k
//   - k is the "ideal distance" derived from the area and node count, so the
//     layout naturally spreads to fill roughly the requested canvas size.
//   - A cooling "temperature" caps how far a node can move per step and
//     decays each iteration so the system settles instead of oscillating
//     forever, mirroring simulated annealing.

import { QuadTree } from './quadtree.js';

export class ForceLayout {
  constructor(graph, opts = {}) {
    this.graph = graph;
    this.width = opts.width ?? 800;
    this.height = opts.height ?? 600;
    this.theta = opts.theta ?? 0.8; // Barnes-Hut accuracy knob
    this.useBarnesHut = opts.useBarnesHut ?? true;
    this.gravity = opts.gravity ?? 0.02; // weak pull toward center, keeps disconnected components from drifting off

    const area = this.width * this.height;
    const n = Math.max(graph.nodeList.length, 1);
    this.k = opts.k ?? Math.sqrt(area / n);

    this.temperature = opts.temperature ?? Math.max(this.width, this.height) / 10;
    this.coolingFactor = opts.coolingFactor ?? 0.95;
    this.minTemperature = opts.minTemperature ?? 0.05;
    this.iteration = 0;
  }

  _repel(dx, dy, dist, mass) {
    // Force magnitude k^2/d, pointed away from the other node (hence the
    // negative sign relative to the direction *to* it).
    const force = -(this.k * this.k * mass) / dist;
    return [(dx / dist) * force, (dy / dist) * force];
  }

  _computeRepulsion(nodes) {
    const disp = new Map(nodes.map((n) => [n.id, { x: 0, y: 0 }]));

    if (this.useBarnesHut && nodes.length > 2) {
      const tree = QuadTree.fromPoints(nodes);
      for (const node of nodes) {
        const out = { x: 0, y: 0 };
        // repel(dx, dy, dist, mass) is handed (other - target) as dx/dy and
        // a negative force magnitude, so the vector it returns already
        // points away from the other node/cluster. Just accumulate it.
        tree.applyForce(node, this.theta, this._repel.bind(this), out);
        const d = disp.get(node.id);
        d.x += out.x;
        d.y += out.y;
      }
    } else {
      for (const v of nodes) {
        const dv = disp.get(v.id);
        for (const u of nodes) {
          if (u === v) continue;
          const dx = v.x - u.x;
          const dy = v.y - u.y;
          const dist = Math.hypot(dx, dy) || 1e-6;
          const force = (this.k * this.k) / dist;
          dv.x += (dx / dist) * force;
          dv.y += (dy / dist) * force;
        }
      }
    }
    return disp;
  }

  _applyAttraction(disp) {
    for (const edge of this.graph.edges) {
      const v = this.graph.nodes.get(edge.source);
      const u = this.graph.nodes.get(edge.target);
      const dx = v.x - u.x;
      const dy = v.y - u.y;
      const dist = Math.hypot(dx, dy) || 1e-6;
      const force = (dist * dist) / this.k * (edge.weight ?? 1);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      disp.get(v.id).x -= fx;
      disp.get(v.id).y -= fy;
      disp.get(u.id).x += fx;
      disp.get(u.id).y += fy;
    }
  }

  _applyGravity(nodes, disp) {
    if (this.gravity <= 0) return;
    const cx = this.width / 2;
    const cy = this.height / 2;
    for (const n of nodes) {
      const d = disp.get(n.id);
      d.x += (cx - n.x) * this.gravity;
      d.y += (cy - n.y) * this.gravity;
    }
  }

  /** Advance the simulation by one step; returns max displacement (for convergence checks). */
  step() {
    const nodes = this.graph.nodeList;
    if (nodes.length === 0) return 0;

    const disp = this._computeRepulsion(nodes);
    this._applyAttraction(disp);
    this._applyGravity(nodes, disp);

    let maxMove = 0;
    for (const n of nodes) {
      const d = disp.get(n.id);
      const len = Math.hypot(d.x, d.y) || 1e-6;
      const capped = Math.min(len, this.temperature);
      const moveX = (d.x / len) * capped;
      const moveY = (d.y / len) * capped;
      n.x += moveX;
      n.y += moveY;
      // Keep nodes within the canvas bounds.
      n.x = Math.min(this.width, Math.max(0, n.x));
      n.y = Math.min(this.height, Math.max(0, n.y));
      maxMove = Math.max(maxMove, Math.hypot(moveX, moveY));
    }

    this.temperature = Math.max(this.minTemperature, this.temperature * this.coolingFactor);
    this.iteration += 1;
    return maxMove;
  }

  /** Run until convergence (max move below `tolerance`) or `maxIterations` reached. */
  run(maxIterations = 500, tolerance = 0.01) {
    let move = Infinity;
    let iters = 0;
    while (iters < maxIterations && move > tolerance) {
      move = this.step();
      iters += 1;
    }
    return { iterations: iters, finalMove: move };
  }
}
