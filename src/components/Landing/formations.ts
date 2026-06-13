// Particle formations for the brain-story hero.
// All positions live in a normalized space roughly [-1, 1] on x/y with shallow z.
// Each formation returns positions (N*3); colors are derived per formation so the
// same particle can change role between scenes.

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

// Side-profile brain test: cerebrum + cerebellum + stem, with sinusoidal
// fold bands ("gyri") modulating acceptance density.
function brainFold(x: number, y: number): number {
  return (
    Math.sin(x * 14 + Math.sin(y * 10) * 1.6) *
    Math.sin(y * 12 + Math.sin(x * 8) * 1.4)
  );
}

function insideBrain(x: number, y: number): boolean {
  const cerebrum =
    ((x + 0.08) / 0.62) ** 2 + ((y - 0.1) / 0.44) ** 2 < 1 && y > -0.36;
  const cerebellum = ((x - 0.42) / 0.21) ** 2 + ((y + 0.22) / 0.15) ** 2 < 1;
  const stem =
    ((x - 0.22) / 0.075) ** 2 + ((y + 0.34) / 0.13) ** 2 < 1 && y < -0.2;
  return cerebrum || cerebellum || stem;
}

export function brainFormation(count: number, lit: boolean): Formation {
  const rand = mulberry32(7001);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  let i = 0;
  while (i < count) {
    const x = rand() * 2 - 1;
    const y = rand() * 2 - 1;
    if (!insideBrain(x, y)) continue;
    const fold = brainFold(x, y);
    // folds carve density: ridges dense, sulci sparse
    if (rand() > 0.42 + 0.58 * Math.abs(fold)) continue;
    // shallow depth keeps the silhouette crisp
    const z = (rand() - 0.5) * 0.1;
    set3(positions, i, x, y, z);

    const r = rand();
    if (lit) {
      // organized brain: fold ridges glow plum, scattered amber/lichen sparks
      if (fold > 0.55) setColor(colors, i, PLUM, 0.95);
      else if (r < 0.05) setColor(colors, i, AMBER, 0.85);
      else if (r < 0.1) setColor(colors, i, LICHEN, 0.9);
      else setColor(colors, i, BONE, 0.32 + rand() * 0.3);
    } else {
      // first brain: mostly dim bone, faint chromatic dust
      if (r < 0.08) setColor(colors, i, PLUM, 0.8);
      else if (r < 0.12) setColor(colors, i, AMBER, 0.7);
      else if (r < 0.16) setColor(colors, i, LICHEN, 0.75);
      else setColor(colors, i, BONE, 0.22 + rand() * 0.32);
    }
    i++;
  }
  return { positions, colors };
}

export function lineFormation(count: number): Formation {
  const rand = mulberry32(7002);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = rand();
    const x = -0.9 + t * 1.8;
    const y = (rand() - 0.5) * 0.022;
    const z = (rand() - 0.5) * 0.05;
    set3(positions, i, x, y, z);
    // drained: uniform dim bone, slightly darker at the ends
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

export function forkFormation(count: number): Formation {
  const rand = mulberry32(7003);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const stemShare = 0.22;
  const branches: {
    p1: [number, number];
    p2: [number, number];
    color: [number, number, number];
  }[] = [
    { p1: [0.25, 0.5], p2: [0.85, 0.52], color: PLUM },
    { p1: [0.3, 0], p2: [0.88, 0.02], color: AMBER },
    { p1: [0.25, -0.5], p2: [0.85, -0.5], color: LICHEN },
  ];
  for (let i = 0; i < count; i++) {
    const r = rand();
    let x: number, y: number;
    let color: [number, number, number] = BONE;
    let bright = 0.5;
    if (r < stemShare) {
      const t = rand();
      x = -0.9 + t * 0.62;
      y = (rand() - 0.5) * 0.022;
      color = BONE;
      bright = 0.45 + rand() * 0.3;
    } else {
      const b = branches[Math.floor(rand() * 3)];
      const t = rand();
      const [px, py] = quadPoint([-0.28, 0], b.p1, b.p2, t);
      // streams widen and brighten as they travel
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

interface TreeNode {
  x: number;
  y: number;
  parent: number; // index into nodes, -1 for root
  hue: [number, number, number];
}

function buildTree(rand: () => number): TreeNode[] {
  const nodes: TreeNode[] = [{ x: -0.8, y: 0, parent: -1, hue: BONE }];
  const mains: [number, [number, number, number]][] = [
    [0.55, PLUM],
    [0, AMBER],
    [-0.55, LICHEN],
  ];
  mains.forEach(([dy, hue]) => {
    const a = nodes.length;
    nodes.push({ x: -0.35, y: dy * 0.62, parent: 0, hue });
    const b = nodes.length;
    nodes.push({ x: 0.08, y: dy * 0.86, parent: a, hue });
    const kids = 2 + Math.floor(rand() * 2);
    for (let k = 0; k < kids; k++) {
      nodes.push({
        x: 0.5 + rand() * 0.38,
        y: dy * 0.86 + (k - (kids - 1) / 2) * 0.26 + (rand() - 0.5) * 0.06,
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
      // node cluster: tight gaussian blob
      const ang = rand() * Math.PI * 2;
      const rad = Math.abs(rand() + rand() - 1) * 0.06;
      x = node.x + Math.cos(ang) * rad;
      y = node.y + Math.sin(ang) * rad;
      bright = 0.55 + rand() * 0.4;
    } else {
      // edge dust between node and parent
      const p = nodes[node.parent];
      const t = rand();
      x = p.x + (node.x - p.x) * t + (rand() - 0.5) * 0.02;
      y = p.y + (node.y - p.y) * t + (rand() - 0.5) * 0.02;
      bright = 0.25 + rand() * 0.25;
    }
    set3(positions, i, x * 0.95, y * 0.95, (rand() - 0.5) * 0.12);
    const c = rand() < 0.5 ? node.hue : BONE;
    setColor(colors, i, c, bright);
  }
  return { positions, colors };
}

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

export const SCENE_COUNT = 6;

export function buildFormations(count: number): Formation[] {
  return [
    brainFormation(count, false),
    lineFormation(count),
    forkFormation(count),
    mapFormation(count),
    pulseFormation(count),
    brainFormation(count, true),
  ];
}
