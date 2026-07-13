// Minimal undirected graph structure: just enough to feed the layout engine
// and to let demos/tests build graphs without pulling in a dependency.

export class Graph {
  constructor() {
    this.nodes = new Map(); // id -> { id, x, y, mass }
    this.edges = []; // { source, target, weight }
    this._adjacency = new Map(); // id -> Set(id)
  }

  addNode(id, opts = {}) {
    if (this.nodes.has(id)) return this.nodes.get(id);
    const node = {
      id,
      x: opts.x ?? (Math.random() - 0.5) * 10,
      y: opts.y ?? (Math.random() - 0.5) * 10,
      mass: opts.mass ?? 1,
    };
    this.nodes.set(id, node);
    this._adjacency.set(id, new Set());
    return node;
  }

  addEdge(sourceId, targetId, weight = 1) {
    if (!this.nodes.has(sourceId)) this.addNode(sourceId);
    if (!this.nodes.has(targetId)) this.addNode(targetId);
    if (sourceId === targetId) return; // ignore self-loops for layout purposes
    this.edges.push({ source: sourceId, target: targetId, weight });
    this._adjacency.get(sourceId).add(targetId);
    this._adjacency.get(targetId).add(sourceId);
  }

  neighbors(id) {
    return [...(this._adjacency.get(id) ?? [])];
  }

  degree(id) {
    return this._adjacency.get(id)?.size ?? 0;
  }

  get nodeList() {
    return [...this.nodes.values()];
  }

  static fromJSON(json) {
    const g = new Graph();
    for (const n of json.nodes) g.addNode(n.id, n);
    for (const e of json.edges) g.addEdge(e.source, e.target, e.weight ?? 1);
    return g;
  }
}
