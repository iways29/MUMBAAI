// Particle formations for the brain-story hero.
// All positions live in a normalized space roughly [-1, 1] on x/y with shallow z.
// Each formation returns positions (N*3); colors are derived per formation so the
// same particle can change role between scenes.
//
// The anatomy IS the metaphor and flows top -> bottom:
//   side-brain -> spinal cord (one straight thread) -> branching spinal nerves
//   with ganglia nodules -> conversation tree -> merge -> networked brain -> burst.
// The brain is a LATERAL (side) profile: frontal lobe left, occiput/cerebellum
// right, brain stem / medulla descending from the lower right.

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

// ---------- Lateral brain silhouette ----------
// Frontal lobe left, occipital/cerebellum right, stem descending lower-right.
// Fine sinuous gyri — higher frequency so the folds read as brain folds, not
// big bands. Two octaves keep them organic.
function brainFold(x: number, y: number): number {
  const warp = Math.sin(x * 6.0 - y * 3.2) * 0.35;
  return (
    Math.sin(y * 16.0 + x * 6.0 + warp * 3.0) * 0.6 +
    Math.sin(x * 18.0 + y * 5.0) * 0.4
  );
}

// Surface sampling: the silhouette stays SOLID (sulci keep ~half density so the
// shape reads), but ridges are bright and grooves are dark — deep, distinct folds.
function brainSurface(
  x: number,
  y: number,
  rand: () => number
): { accept: boolean; bright: number } {
  const ridge = Math.min(1, Math.max(0, (brainFold(x, y) + 1) * 0.5));
  const accept = rand() < 0.5 + 0.5 * ridge; // continuous silhouette
  const bright = 0.1 + 0.62 * Math.pow(ridge, 1.4); // dark grooves, bright ridges
  return { accept, bright };
}

function inStem(x: number, y: number): boolean {
  if (y > -0.04 || y < -0.64) return false;
  const t = (-0.04 - y) / 0.6; // 0 at top of stem, 1 at the medulla tip
  const cx = 0.24 + t * 0.05; // leans slightly right going down
  const halfW = 0.075 * (1 - t * 0.4); // tapers toward the medulla
  return Math.abs(x - cx) < halfW;
}

function insideBrain(x: number, y: number): boolean {
  // main cerebrum mass — egg-shaped, bulk toward center, frontal bulge left
  const cerebrum = ((x + 0.04) / 0.62) ** 2 + ((y - 0.14) / 0.4) ** 2 < 1;
  // temporal lobe — lower bulge
  const temporal =
    ((x + 0.02) / 0.5) ** 2 + ((y + 0.12) / 0.26) ** 2 < 1 && y > -0.3;
  // cerebellum — lower right, behind the stem
  const cerebellum = ((x - 0.44) / 0.22) ** 2 + ((y + 0.18) / 0.17) ** 2 < 1;
  return cerebrum || temporal || cerebellum || inStem(x, y);
}

// Lit brain = network of conversation nodes + edges inside the silhouette.
interface ConvNode {
  x: number;
  y: number;
  hue: [number, number, number];
}

function brainConvNodes(rand: () => number): { nodes: ConvNode[]; edges: [number, number][] } {
  const nodes: ConvNode[] = [];
  const hues = [PLUM, AMBER, LICHEN];
  let guard = 0;
  while (nodes.length < 15 && guard < 4000) {
    guard++;
    const x = (rand() * 2 - 1) * 0.62;
    const y = 0.12 + (rand() * 2 - 1) * 0.42;
    if (!insideBrain(x, y) || inStem(x, y)) continue; // keep nodes in the cerebrum
    if (nodes.some((n) => (n.x - x) ** 2 + (n.y - y) ** 2 < 0.05)) continue;
    nodes.push({ x, y, hue: hues[nodes.length % 3] });
  }
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
    let i = 0;
    while (i < count) {
      const x = rand() * 2 - 1;
      const y = rand() * 2 - 1;
      if (!insideBrain(x, y)) continue;
      const { accept, bright } = brainSurface(x, y, rand);
      if (!accept) continue;
      set3(positions, i, x, y, (rand() - 0.5) * 0.08);
      const r = rand();
      // chromatic specks only on the bright ridges
      if (bright > 0.45 && r < 0.05) setColor(colors, i, PLUM, 0.7);
      else if (bright > 0.45 && r < 0.08) setColor(colors, i, AMBER, 0.6);
      else if (bright > 0.45 && r < 0.11) setColor(colors, i, LICHEN, 0.65);
      else setColor(colors, i, BONE, bright);
      i++;
    }
    return { positions, colors };
  }

  const { nodes, edges } = brainConvNodes(rand);
  const nodeShare = 0.38;
  const edgeShare = 0.3;
  for (let i = 0; i < count; i++) {
    const roll = rand();
    if (roll < nodeShare && nodes.length) {
      const node = nodes[Math.floor(rand() * nodes.length)];
      const ang = rand() * Math.PI * 2;
      const rad = Math.abs(rand() + rand() - 1) * 0.045;
      set3(positions, i, node.x + Math.cos(ang) * rad, node.y + Math.sin(ang) * rad, (rand() - 0.5) * 0.08);
      setColor(colors, i, node.hue, 0.7 + rand() * 0.3);
    } else if (roll < nodeShare + edgeShare && edges.length) {
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
      let x = 0,
        y = 0,
        bright = 0.1,
        ok = false,
        guard = 0;
      while (!ok && guard < 24) {
        guard++;
        x = rand() * 2 - 1;
        y = rand() * 2 - 1;
        if (!insideBrain(x, y)) continue;
        const s = brainSurface(x, y, rand);
        if (!s.accept) continue;
        bright = s.bright * 0.55; // surface fill stays quiet behind the network
        ok = true;
      }
      set3(positions, i, x, y, (rand() - 0.5) * 0.08);
      setColor(colors, i, BONE, bright);
    }
  }
  return { positions, colors };
}

// ---------- Spinal cord (one straight vertical thread, segmented) ----------
export function spineFormation(count: number): Formation {
  const rand = mulberry32(7002);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const x0 = 0.1; // continues from where the medulla sat
  for (let i = 0; i < count; i++) {
    const t = rand();
    const y = 0.92 - t * 1.84;
    const seg = Math.sin(y * 9.0); // vertebral segmentation
    const halfW = 0.04 + 0.02 * Math.max(0, seg); // slight bulge at each segment
    const x = x0 + (rand() - 0.5) * 2 * halfW;
    set3(positions, i, x, y, (rand() - 0.5) * 0.06);
    const bright = 0.4 + 0.4 * Math.max(0, seg) + rand() * 0.15;
    setColor(colors, i, rand() < 0.92 ? SMOKE : PLUM, bright);
  }
  return { positions, colors };
}

function quad(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  t: number
): [number, number] {
  const a = (1 - t) * (1 - t);
  const b = 2 * (1 - t) * t;
  const c = t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]];
}

// ---------- Branching spinal nerves with ganglia nodules ----------
export function nerveFormation(count: number): Formation {
  const rand = mulberry32(7003);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const x0 = 0.06;
  const levels = [0.6, 0.32, 0.04, -0.24, -0.52];
  const hues = [PLUM, AMBER, LICHEN];
  interface Branch {
    ctrl: [number, number];
    end: [number, number];
    hue: [number, number, number];
  }
  const branches: Branch[] = [];
  levels.forEach((L, li) => {
    [-1, 1].forEach((s) => {
      branches.push({
        ctrl: [x0 + s * 0.3, L + 0.03],
        end: [x0 + s * 0.62, L - 0.16],
        hue: hues[(li + (s > 0 ? 0 : 1)) % 3],
      });
    });
  });

  const cordShare = 0.24;
  const noduleShare = 0.32;
  for (let i = 0; i < count; i++) {
    const roll = rand();
    if (roll < cordShare) {
      // central cord
      const y = 0.86 - rand() * 1.7;
      set3(positions, i, x0 + (rand() - 0.5) * 0.07, y, (rand() - 0.5) * 0.05);
      setColor(colors, i, SMOKE, 0.4 + rand() * 0.25);
    } else if (roll < cordShare + noduleShare) {
      // ganglion nodule at a branch end
      const br = branches[Math.floor(rand() * branches.length)];
      const ang = rand() * Math.PI * 2;
      const rad = Math.abs(rand() + rand() - 1) * 0.05;
      set3(positions, i, br.end[0] + Math.cos(ang) * rad, br.end[1] + Math.sin(ang) * rad, (rand() - 0.5) * 0.07);
      setColor(colors, i, br.hue, 0.7 + rand() * 0.3);
    } else {
      // nerve fibre along a branch path
      const br = branches[Math.floor(rand() * branches.length)];
      const t = rand();
      const [px, py] = quad([x0, br.ctrl[1] - 0.03], br.ctrl, br.end, t);
      set3(
        positions,
        i,
        px + (rand() - 0.5) * 0.018,
        py + (rand() - 0.5) * 0.018,
        (rand() - 0.5) * 0.06
      );
      setColor(colors, i, rand() < 0.4 ? br.hue : BONE, 0.3 + t * 0.4);
    }
  }
  return { positions, colors };
}

// ---------- Conversation tree (root at top, branches fan downward — app TB) ----------
interface TreeNode {
  x: number;
  y: number;
  parent: number;
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
    spineFormation(count),
    nerveFormation(count),
    mapFormation(count),
    pulseFormation(count),
    brainFormation(count, true),
    explodeFormation(count),
  ];
}
