// Particle formations for the brain-story hero.
// All positions live in a normalized space roughly [-1, 1] on x/y with shallow z.
// Each formation returns positions (N*3); colors are derived per formation so the
// same particle can change role between scenes.
//
// Orientation note: the line / fork / tree scenes flow TOP -> BOTTOM, mirroring
// the app's vertical (TB) conversation tree.

export interface Formation {
  positions: Float32Array;
  colors: Float32Array;
}

// Palette (kept in sync with src/styles/tokens.css)
const BONE: [number, number, number] = [1, 1, 1];
const SMOKE: [number, number, number] = [0.604, 0.604, 0.604];
const PLUM: [number, number, number] = [0.502, 0.322, 1];
const AMBER: [number, number, number] = [1, 0.722, 0.161];
const LICHEN: [number, number, number] = [0.082, 0.518, 0.431];

// Deterministic RNG so formations are identical across renders/fallbacks
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function set3(arr: Float32Array, i: number, x: number, y: number, z: number) {
  arr[i * 3] = x;
  arr[i * 3 + 1] = y;
  arr[i * 3 + 2] = z;
}

function setColor(
  arr: Float32Array,
  i: number,
  c: [number, number, number],
  brightness: number
) {
  arr[i * 3] = c[0] * brightness;
  arr[i * 3 + 1] = c[1] * brightness;
  arr[i * 3 + 2] = c[2] * brightness;
}

// ---------- Brain silhouette (top-profile, like a walnut/two hemispheres) ----------
// A rounder, more obviously-a-brain outline: two hemispheres split by a central
// fissure, with fold bands carving the surface.
function brainFold(x: number, y: number): number {
  return (
    Math.sin(x * 13 + Math.sin(y * 9) * 1.7) *
    Math.sin(y * 11 + Math.sin(x * 7) * 1.5)
  );
}

function insideBrain(x: number, y: number): boolean {
  // overall rounded mass, slightly wider than tall
  const body = (x / 0.66) ** 2 + (y / 0.56) ** 2 < 1;
  if (!body) return false;
  // central fissure: thin gap down the middle near the top
  const fissure = Math.abs(x) < 0.035 && y > -0.15;
  if (fissure) return false;
  // flatten the very bottom a touch (brain stem notch)
  if (y < -0.46 && Math.abs(x) > 0.12) return false;
  return true;
}

// Lit brain = a NETWORK OF CONVERSATIONS inside the brain silhouette.
// Conversation nodes are bright clusters; edges are dim dust connecting them;
// the remaining particles are faint surface fill that keeps the silhouette.
interface ConvNode {
  x: number;
  y: number;
  hue: [number, number, number];
}

function brainConvNodes(rand: () => number): { nodes: ConvNode[]; edges: [number, number][] } {
  const nodes: ConvNode[] = [];
  const hues = [PLUM, AMBER, LICHEN];
  // scatter nodes that fall inside the brain
  let guard = 0;
  while (nodes.length < 16 && guard < 4000) {
    guard++;
    const x = (rand() * 2 - 1) * 0.62;
    const y = (rand() * 2 - 1) * 0.5;
    if (!insideBrain(x, y)) continue;
    // keep nodes apart
    if (nodes.some((n) => (n.x - x) ** 2 + (n.y - y) ** 2 < 0.045)) continue;
    nodes.push({ x, y, hue: hues[nodes.length % 3] });
  }
  // connect each node to its 2 nearest neighbours -> a synaptic network
  const edges: [number, number][] = [];
  const seen = new Set<string>();
  nodes.forEach((n, i) => {
    const order = nodes
      .map((m, j) => ({ j, d: (m.x - n.x) ** 2 + (m.y - n.y) ** 2 }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    order.forEach((o) => {
      const key = i < o.j ? `${i}-${o.j}` : `${o.j}-${i}`;
      if (seen.has(key)) return;
      seen.add(key);
      edges.push([i, o.j]);
    });
  });
  return { nodes, edges };
}

export function brainFormation(count: number, lit: boolean): Formation {
  const rand = mulberry32(7001);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  if (!lit) {
    // First brain: soft surface dust, dim, mostly bone with faint chromatic specks.
    let i = 0;
    while (i < count) {
      const x = rand() * 2 - 1;
      const y = rand() * 2 - 1;
      if (!insideBrain(x, y)) continue;
      const fold = brainFold(x, y);
      if (rand() > 0.4 + 0.6 * Math.abs(fold)) continue;
      set3(positions, i, x, y, (rand() - 0.5) * 0.1);
      const r = rand();
      if (r < 0.06) setColor(colors, i, PLUM, 0.7);
      else if (r < 0.1) setColor(colors, i, AMBER, 0.6);
      else if (r < 0.14) setColor(colors, i, LICHEN, 0.65);
      else setColor(colors, i, BONE, 0.18 + rand() * 0.28);
      i++;
    }
    return { positions, colors };
  }

  // Lit brain: conversation network inside the silhouette.
  const { nodes, edges } = brainConvNodes(rand);
  const nodeShare = 0.4; // dense bright node clusters
  const edgeShare = 0.32; // dust along edges
  // remaining = faint surface fill
  for (let i = 0; i < count; i++) {
    const roll = rand();
    if (roll < nodeShare) {
      // bright node cluster
      const node = nodes[Math.floor(rand() * nodes.length)];
      const ang = rand() * Math.PI * 2;
      const rad = Math.abs(rand() + rand() - 1) * 0.045;
      set3(positions, i, node.x + Math.cos(ang) * rad, node.y + Math.sin(ang) * rad, (rand() - 0.5) * 0.08);
      setColor(colors, i, node.hue, 0.7 + rand() * 0.3);
    } else if (roll < nodeShare + edgeShare && edges.length) {
      // edge dust between two nodes
      const [a, b] = edges[Math.floor(rand() * edges.length)];
      const na = nodes[a];
      const nb = nodes[b];
      const t = rand();
      set3(
        positions,
        i,
        na.x + (nb.x - na.x) * t + (rand() - 0.5) * 0.015,
        na.y + (nb.y - na.y) * t + (rand() - 0.5) * 0.015,
        (rand() - 0.5) * 0.06
      );
      setColor(colors, i, BONE, 0.3 + rand() * 0.25);
    } else {
      // faint surface fill keeps the brain readable
      let x = 0,
        y = 0,
        ok = false,
        guard = 0;
      while (!ok && guard < 24) {
        guard++;
        x = rand() * 2 - 1;
        y = rand() * 2 - 1;
        if (!insideBrain(x, y)) continue;
        const fold = brainFold(x, y);
        if (rand() > 0.35 + 0.65 * Math.abs(fold)) continue;
        ok = true;
      }
      set3(positions, i, x, y, (rand() - 0.5) * 0.1);
      setColor(colors, i, BONE, 0.12 + rand() * 0.16);
    }
  }
  return { positions, colors };
}

// ---------- Vertical line (top -> bottom) ----------
export function lineFormation(count: number): Formation {
  const rand = mulberry32(7002);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = rand();
    const y = 0.92 - t * 1.84;
    const x = (rand() - 0.5) * 0.022;
    set3(positions, i, x, y, (rand() - 0.5) * 0.05);
    const edge = 1 - Math.abs(t - 0.5) * 1.2;
    setColor(colors, i, SMOKE, 0.35 + 0.45 * edge);
  }
  return { positions, colors };
}

function quadPoint(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  t: number
): [number, number] {
  const a = (1 - t) * (1 - t);
  const b = 2 * (1 - t) * t;
  const c = t * t;
  return [
    a * p0[0] + b * p1[0] + c * p2[0],
    a * p0[1] + b * p1[1] + c * p2[1],
  ];
}

// ---------- Vertical fork (stem at top splits into three downward streams) ----------
export function forkFormation(count: number): Formation {
  const rand = mulberry32(7003);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const stemShare = 0.22;
  const fork: [number, number] = [0, 0.28];
  const branches: {
    p1: [number, number];
    p2: [number, number];
    color: [number, number, number];
  }[] = [
    { p1: [-0.5, 0.0], p2: [-0.58, -0.78], color: PLUM },
    { p1: [0.0, -0.05], p2: [0.02, -0.82], color: AMBER },
    { p1: [0.5, 0.0], p2: [0.58, -0.78], color: LICHEN },
  ];
  for (let i = 0; i < count; i++) {
    const r = rand();
    let x: number, y: number;
    let color: [number, number, number] = BONE;
    let bright = 0.5;
    if (r < stemShare) {
      const t = rand();
      y = 0.92 - t * 0.64; // top stem down to the fork
      x = (rand() - 0.5) * 0.022;
      bright = 0.45 + rand() * 0.3;
    } else {
      const b = branches[Math.floor(rand() * 3)];
      const t = rand();
      const [px, py] = quadPoint(fork, b.p1, b.p2, t);
      x = px + (rand() - 0.5) * (0.015 + t * 0.05);
      y = py + (rand() - 0.5) * (0.015 + t * 0.05);
      color = rand() < 0.55 ? b.color : BONE;
      bright = 0.35 + t * 0.55;
    }
    set3(positions, i, x, y, (rand() - 0.5) * 0.08);
    setColor(colors, i, color, bright);
  }
  return { positions, colors };
}

// ---------- Vertical tree (root at top, branches fan downward — like app TB) ----------
interface TreeNode {
  x: number;
  y: number;
  parent: number; // index into nodes, -1 for root
  hue: [number, number, number];
}

function buildTree(rand: () => number): TreeNode[] {
  const nodes: TreeNode[] = [{ x: 0, y: 0.82, parent: -1, hue: BONE }];
  const mains: [number, [number, number, number]][] = [
    [-0.5, PLUM],
    [0, AMBER],
    [0.5, LICHEN],
  ];
  mains.forEach(([dx, hue]) => {
    const a = nodes.length;
    nodes.push({ x: dx * 0.6, y: 0.34, parent: 0, hue });
    const b = nodes.length;
    nodes.push({ x: dx * 0.86, y: -0.12, parent: a, hue });
    const kids = 2 + Math.floor(rand() * 2);
    for (let k = 0; k < kids; k++) {
      nodes.push({
        x: dx * 0.86 + (k - (kids - 1) / 2) * 0.26 + (rand() - 0.5) * 0.06,
        y: -0.6 + (rand() - 0.5) * 0.12,
        parent: b,
        hue,
      });
    }
  });
  return nodes;
}

export function mapFormation(count: number): Formation {
  const rand = mulberry32(7004);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const nodes = buildTree(rand);
  const clusterShare = 0.45;
  for (let i = 0; i < count; i++) {
    const node = nodes[Math.floor(rand() * nodes.length)];
    let x: number, y: number;
    let bright: number;
    if (rand() < clusterShare || node.parent === -1) {
      const ang = rand() * Math.PI * 2;
      const rad = Math.abs(rand() + rand() - 1) * 0.055;
      x = node.x + Math.cos(ang) * rad;
      y = node.y + Math.sin(ang) * rad;
      bright = 0.55 + rand() * 0.4;
    } else {
      const p = nodes[node.parent];
      const t = rand();
      x = p.x + (node.x - p.x) * t + (rand() - 0.5) * 0.02;
      y = p.y + (node.y - p.y) * t + (rand() - 0.5) * 0.02;
      bright = 0.25 + rand() * 0.25;
    }
    set3(positions, i, x * 0.95, y * 1.05, (rand() - 0.5) * 0.12);
    const c = rand() < 0.5 ? node.hue : BONE;
    setColor(colors, i, c, bright);
  }
  return { positions, colors };
}

// ---------- Merge pulse (everything converges to a bright plum core) ----------
export function pulseFormation(count: number): Formation {
  const rand = mulberry32(7005);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const halo = rand() < 0.18;
    const ang = rand() * Math.PI * 2;
    const rad = halo
      ? 0.3 + rand() * 0.25
      : Math.abs(rand() + rand() - 1) * 0.13;
    const x = Math.cos(ang) * rad;
    const y = Math.sin(ang) * rad * 0.92;
    set3(positions, i, x, y, (rand() - 0.5) * 0.1);
    if (halo) setColor(colors, i, BONE, 0.2 + rand() * 0.2);
    else setColor(colors, i, PLUM, 0.6 + rand() * 0.4);
  }
  return { positions, colors };
}

// ---------- Explosion (brain bursts outward into a sparse expanding cloud) ----------
export function explodeFormation(count: number): Formation {
  const rand = mulberry32(7006);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // radial scatter biased outward, brighter chromatic specks
    const ang = rand() * Math.PI * 2;
    const rad = 0.4 + Math.pow(rand(), 0.6) * 1.5;
    const x = Math.cos(ang) * rad * (1.3 + rand() * 0.4);
    const y = Math.sin(ang) * rad;
    set3(positions, i, x, y, (rand() - 0.5) * 0.6);
    const r = rand();
    if (r < 0.18) setColor(colors, i, PLUM, 0.5 + rand() * 0.4);
    else if (r < 0.26) setColor(colors, i, AMBER, 0.4 + rand() * 0.4);
    else if (r < 0.34) setColor(colors, i, LICHEN, 0.4 + rand() * 0.4);
    else setColor(colors, i, BONE, 0.15 + rand() * 0.3);
  }
  return { positions, colors };
}

export const SCENE_COUNT = 7;

export function buildFormations(count: number): Formation[] {
  return [
    brainFormation(count, false),
    lineFormation(count),
    forkFormation(count),
    mapFormation(count),
    pulseFormation(count),
    brainFormation(count, true),
    explodeFormation(count),
  ];
}
