// Barnes-Hut quadtree for approximate O(n log n) pairwise repulsion.
//
// The tree recursively partitions a 2D region into four quadrants. Each
// internal node stores the aggregate mass and center of mass of every point
// beneath it, so a distant cluster of points can be treated as a single
// pseudo-point when computing forces on some other point far away.

export class QuadTree {
  constructor(bounds) {
    this.bounds = bounds; // { xmin, ymin, xmax, ymax }
    this.point = null; // occupied leaf point: { x, y, mass, id }
    this.children = null; // [NW, NE, SW, SE] once subdivided
    this.mass = 0;
    this.comX = 0; // center of mass
    this.comY = 0;
  }

  static fromPoints(points) {
    if (points.length === 0) {
      return new QuadTree({ xmin: -1, ymin: -1, xmax: 1, ymax: 1 });
    }
    let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity;
    for (const p of points) {
      if (p.x < xmin) xmin = p.x;
      if (p.x > xmax) xmax = p.x;
      if (p.y < ymin) ymin = p.y;
      if (p.y > ymax) ymax = p.y;
    }
    // Pad and square the bounding box so quadrants are well defined even
    // when all points are collinear or coincident.
    const pad = Math.max(xmax - xmin, ymax - ymin, 1) * 0.55 + 1e-6;
    const cx = (xmin + xmax) / 2;
    const cy = (ymin + ymax) / 2;
    const tree = new QuadTree({
      xmin: cx - pad,
      ymin: cy - pad,
      xmax: cx + pad,
      ymax: cy + pad,
    });
    for (const p of points) tree.insert(p);
    return tree;
  }

  _quadrantFor(p) {
    const { xmin, ymin, xmax, ymax } = this.bounds;
    const mx = (xmin + xmax) / 2;
    const my = (ymin + ymax) / 2;
    const west = p.x < mx;
    const north = p.y < my;
    if (west && north) return { index: 0, bounds: { xmin, ymin, xmax: mx, ymax: my } };
    if (!west && north) return { index: 1, bounds: { xmin: mx, ymin, xmax, ymax: my } };
    if (west && !north) return { index: 2, bounds: { xmin, ymin: my, xmax: mx, ymax } };
    return { index: 3, bounds: { xmin: mx, ymin: my, xmax, ymax } };
  }

  // Coincident or near-coincident points would otherwise force the tree to
  // subdivide forever (each split still lands both points in the same
  // quadrant). Past this depth we stop subdividing and just merge extra
  // points into the resident leaf's mass, which is a fine approximation
  // since anything sharing a cell this small is effectively at the same
  // location anyway.
  static MAX_DEPTH = 32;

  insert(p, depth = 0) {
    // Empty leaf: occupy it.
    if (this.mass === 0 && !this.children) {
      this.point = p;
      this.mass = p.mass ?? 1;
      this.comX = p.x;
      this.comY = p.y;
      return;
    }

    // Internal node: update aggregate and push down into a child.
    if (this.children) {
      const totalMass = this.mass + (p.mass ?? 1);
      this.comX = (this.comX * this.mass + p.x * (p.mass ?? 1)) / totalMass;
      this.comY = (this.comY * this.mass + p.y * (p.mass ?? 1)) / totalMass;
      this.mass = totalMass;
      const { index, bounds } = this._quadrantFor(p);
      if (!this.children[index]) this.children[index] = new QuadTree(bounds);
      this.children[index].insert(p, depth + 1);
      return;
    }

    // Occupied leaf at max depth: merge instead of subdividing further.
    if (depth >= QuadTree.MAX_DEPTH) {
      const totalMass = this.mass + (p.mass ?? 1);
      this.comX = (this.comX * this.mass + p.x * (p.mass ?? 1)) / totalMass;
      this.comY = (this.comY * this.mass + p.y * (p.mass ?? 1)) / totalMass;
      this.mass = totalMass;
      // Keep the original resident as the representative point; p is close
      // enough (within an ULP-scale cell) that this introduces negligible error.
      return;
    }

    // Occupied leaf: subdivide, re-insert the resident point, then insert p.
    const resident = this.point;
    this.point = null;
    this.children = [null, null, null, null];
    const totalMass = this.mass + (p.mass ?? 1);
    this.comX = (this.comX * this.mass + p.x * (p.mass ?? 1)) / totalMass;
    this.comY = (this.comY * this.mass + p.y * (p.mass ?? 1)) / totalMass;
    this.mass = totalMass;

    const rq = this._quadrantFor(resident);
    if (!this.children[rq.index]) this.children[rq.index] = new QuadTree(rq.bounds);
    this.children[rq.index].insert(resident, depth + 1);

    const pq = this._quadrantFor(p);
    if (!this.children[pq.index]) this.children[pq.index] = new QuadTree(pq.bounds);
    this.children[pq.index].insert(p, depth + 1);
  }

  /**
   * Accumulate the repulsive force on `target` from every point in this
   * tree using the Barnes-Hut approximation. `theta` controls the accuracy
   * vs speed tradeoff (0 = exact brute force, larger = faster/coarser).
   * `repel(dx, dy, dist, mass)` returns [fx, fy] and is supplied by the
   * caller so this module stays agnostic of the physical force law used.
   */
  applyForce(target, theta, repel, out) {
    if (this.mass === 0) return;

    // Leaf with the actual target point itself contributes nothing.
    if (this.point && this.point === target) return;

    const dx = this.point ? this.point.x - target.x : this.comX - target.x;
    const dy = this.point ? this.point.y - target.y : this.comY - target.y;
    const dist = Math.hypot(dx, dy) || 1e-6;

    if (this.point || !this.children) {
      const [fx, fy] = repel(dx, dy, dist, this.mass);
      out.x += fx;
      out.y += fy;
      return;
    }

    const size = this.bounds.xmax - this.bounds.xmin;
    if (size / dist < theta) {
      // Far enough away: treat this whole subtree as one mass.
      const [fx, fy] = repel(dx, dy, dist, this.mass);
      out.x += fx;
      out.y += fy;
      return;
    }

    for (const child of this.children) {
      if (child) child.applyForce(target, theta, repel, out);
    }
  }

  /** Count nodes in the tree; used by tests to sanity-check construction. */
  countPoints() {
    if (this.point) return 1;
    if (!this.children) return 0;
    let n = 0;
    for (const c of this.children) if (c) n += c.countPoints();
    return n;
  }
}
