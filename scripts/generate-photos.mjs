/**
 * Generates the sample photography the development seed refers to.
 *
 * These are *not* photographs. Stock running imagery carries licence terms a
 * club app can't safely inherit, so these are drawn procedurally: three scenes
 * matching what each seeded post describes. They are built to hold up in the
 * design's grayscale treatment, which means the work goes into tonal separation
 * and texture rather than colour.
 *
 * Replace them with the clan's own photographs before anyone sees this outside
 * development — `node scripts/seed-photos.mjs --from ./my-photos` takes real
 * files with no code change.
 *
 * PNG is written by hand against node's own zlib rather than pulling in an
 * image library the app would then carry for something only the seed uses.
 *
 *   node scripts/generate-photos.mjs        → writes into scripts/photos/
 */

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'photos');

// ---------------------------------------------------------------- maths

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;

function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Deterministic 2D hash in 0..1. */
function hash2(x, y) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Value noise with smooth interpolation. */
function vnoise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return lerp(
    lerp(hash2(xi, yi), hash2(xi + 1, yi), u),
    lerp(hash2(xi, yi + 1), hash2(xi + 1, yi + 1), u),
    v,
  );
}

/** Fractal sum — the workhorse for cloud, water and surface texture. */
function fbm(x, y, octaves = 5, lacunarity = 2.03, gain = 0.5) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let fx = x;
  let fy = y;
  for (let i = 0; i < octaves; i += 1) {
    sum += vnoise(fx, fy) * amp;
    norm += amp;
    amp *= gain;
    fx *= lacunarity;
    fy *= lacunarity;
  }
  return sum / norm;
}

/** Ridged variant — sharp crests, good for wave highlights. */
function ridged(x, y, octaves = 4) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let fx = x;
  let fy = y;
  for (let i = 0; i < octaves; i += 1) {
    sum += (1 - Math.abs(vnoise(fx, fy) * 2 - 1)) * amp;
    norm += amp;
    amp *= 0.5;
    fx *= 2.07;
    fy *= 2.07;
  }
  return sum / norm;
}

/** Distance between the two nearest feature points — near 0 on cell edges. */
function voronoiEdge(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  let f1 = 1e9;
  let f2 = 1e9;
  for (let j = -1; j <= 1; j += 1) {
    for (let i = -1; i <= 1; i += 1) {
      const cx = xi + i;
      const cy = yi + j;
      const px = cx + hash2(cx, cy);
      const py = cy + hash2(cy + 91, cx - 17);
      const dx = x - px;
      const dy = y - py;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < f1) {
        f2 = f1;
        f1 = d;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }
  return f2 - f1;
}

// ---------------------------------------------------------------- png encoder

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const byte = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));

/**
 * Renders with 2×2 supersampling — silhouettes and converging lane lines alias
 * badly at one sample per pixel.
 */
function png(width, height, shade) {
  const raw = Buffer.alloc(height * (width * 3 + 1));
  let o = 0;
  const S = 2;
  const inv = 1 / (S * S);

  for (let y = 0; y < height; y += 1) {
    raw[o] = 0;
    o += 1;
    for (let x = 0; x < width; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < S; sy += 1) {
        for (let sx = 0; sx < S; sx += 1) {
          const u = (x + (sx + 0.5) / S) / width;
          const v = (y + (sy + 0.5) / S) / height;
          const c = shade(u, v);
          r += c[0];
          g += c[1];
          b += c[2];
        }
      }
      raw[o] = byte(r * inv);
      raw[o + 1] = byte(g * inv);
      raw[o + 2] = byte(b * inv);
      o += 3;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- finishing

/** Corner falloff, film grain and a gentle S-curve — applied to every scene. */
function finish(rgb, u, v, seed) {
  const dx = (u - 0.5) * 2;
  const dy = (v - 0.5) * 2;
  const vignette = 1 - 0.34 * clamp01(Math.sqrt(dx * dx + dy * dy) / 1.42) ** 2.1;

  const grain = (hash2((u * 4801) | 0, (v * 4801 + seed * 131) | 0) - 0.5) * 7;

  return rgb.map((c) => {
    const lit = c * vignette + grain;
    // Slight contrast lift so the grayscale render keeps its separation.
    const t = clamp01(lit / 255);
    return (t + (t - 0.5) * (1 - Math.abs(t - 0.5) * 2) * 0.16) * 255;
  });
}

/**
 * Image aspect, set per file. Figures are built in units of their own height,
 * so the horizontal axis has to be corrected or every runner comes out squashed.
 */
let ASPECT = 1.5;
let WIDTH = 1080;
let HEIGHT = 720;

/** Distance from a point to a line segment. */
function segDist(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : clamp01((wx * vx + wy * vy) / len2);
  const dx = wx - t * vx;
  const dy = wy - t * vy;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * A running figure, drawn as capsules over a skeleton.
 *
 * Blocks read as blocks at any size; limbs with rounded ends and a stride read
 * as a person even at forty pixels tall, which is the size most of these are.
 * Returns anti-aliased coverage in 0..1.
 */
function runnerCoverage(u, v, cx, groundY, h, phase) {
  // Cheap reject before the per-limb work.
  const halfW = h * 0.75;
  if (v < groundY - h * 1.05 || v > groundY + h * 0.05) return 0;
  if (Math.abs(u - cx) * ASPECT > halfW) return 0;

  // Figure space: 1.0 = height, origin at the feet, +y up.
  const x = ((u - cx) * ASPECT) / h;
  const y = (groundY - v) / h;

  const s = Math.sin(phase);

  const hip = [0, 0.5];
  const shoulder = [0.05, 0.8]; // forward lean
  const head = [0.075, 0.895];

  // Legs: one driving forward, one trailing and folded up behind.
  const thighA = 0.46 * s;
  const kneeA = [hip[0] + 0.25 * Math.sin(thighA), hip[1] - 0.25 * Math.cos(thighA)];
  const shinA = thighA - 0.55 - 0.45 * s;
  const ankleA = [kneeA[0] + 0.26 * Math.sin(shinA), kneeA[1] - 0.26 * Math.cos(shinA)];

  const thighB = -0.46 * s;
  const kneeB = [hip[0] + 0.25 * Math.sin(thighB), hip[1] - 0.25 * Math.cos(thighB)];
  const shinB = thighB + 0.95 + 0.5 * s;
  const ankleB = [kneeB[0] + 0.26 * Math.sin(shinB), kneeB[1] - 0.26 * Math.cos(shinB)];

  // Arms counter-swing against the legs.
  const armA = -0.6 * s;
  const elbowA = [shoulder[0] + 0.17 * Math.sin(armA), shoulder[1] - 0.17 * Math.cos(armA)];
  const handA = [elbowA[0] + 0.16 * Math.sin(armA + 1.25), elbowA[1] - 0.16 * Math.cos(armA + 1.25)];

  const armB = 0.6 * s;
  const elbowB = [shoulder[0] + 0.17 * Math.sin(armB), shoulder[1] - 0.17 * Math.cos(armB)];
  const handB = [elbowB[0] + 0.16 * Math.sin(armB - 1.25), elbowB[1] - 0.16 * Math.cos(armB - 1.25)];

  const mid = [(hip[0] + shoulder[0]) / 2, (hip[1] + shoulder[1]) / 2];

  let sd = 1e9;
  const capsule = (a, b, r) => {
    const d = segDist(x, y, a[0], a[1], b[0], b[1]) - r;
    if (d < sd) sd = d;
  };

  capsule(hip, mid, 0.062); // waist
  capsule(mid, shoulder, 0.072); // chest
  capsule(hip, kneeA, 0.05);
  capsule(kneeA, ankleA, 0.036);
  capsule(hip, kneeB, 0.05);
  capsule(kneeB, ankleB, 0.036);
  capsule(shoulder, elbowA, 0.034);
  capsule(elbowA, handA, 0.03);
  capsule(shoulder, elbowB, 0.034);
  capsule(elbowB, handB, 0.03);
  capsule(head, head, 0.061); // head

  // Feet, so the stride lands rather than tapering to a point.
  capsule(ankleA, [ankleA[0] + 0.07, ankleA[1] - 0.015], 0.026);
  capsule(ankleB, [ankleB[0] + 0.06, ankleB[1] - 0.01], 0.024);

  // Soften over roughly one pixel at the size being drawn.
  return 1 - smoothstep(-0.006, 0.01, sd);
}

// ---------------------------------------------------------------- scene: sea

/** Sunrise along Molos — the Thursday seaside tempo. */
function seaside(u, v) {
  const HZ = 0.545;
  const sunU = 0.7;
  let r;
  let g;
  let b;

  if (v < HZ) {
    // ---- sky
    const t = v / HZ; // 0 top .. 1 horizon

    // Cloud banding, stretched horizontally the way low cloud reads.
    const cloud = fbm(u * 3.1 + 4, v * 9.5, 5) * 0.75 + fbm(u * 8 + 11, v * 26, 3) * 0.25;
    const cloudMass = smoothstep(0.44, 0.72, cloud) * smoothstep(0.02, 0.4, t);

    // Base gradient: deep blue overhead into amber at the horizon.
    r = lerp(58, 236, t ** 1.9);
    g = lerp(72, 186, t ** 1.7);
    b = lerp(104, 138, t ** 1.4);

    // Sun disc and bloom.
    const dx = (u - sunU) * 1.55;
    const dy = v - (HZ - 0.055);
    const d = Math.sqrt(dx * dx + dy * dy);
    const disc = 1 - smoothstep(0.026, 0.032, d);
    const bloom = (1 - smoothstep(0, 0.34, d)) ** 2.1;

    r += bloom * 150 + disc * 90;
    g += bloom * 104 + disc * 78;
    b += bloom * 44 + disc * 56;

    // Cloud is lit warm from beneath, dark above.
    const underlit = smoothstep(0.3, 1, t);
    r = lerp(r, lerp(64, 244, underlit), cloudMass * 0.72);
    g = lerp(g, lerp(72, 176, underlit), cloudMass * 0.72);
    b = lerp(b, lerp(92, 126, underlit), cloudMass * 0.72);
  } else {
    // ---- sea
    const depth = (v - HZ) / (1 - HZ); // 0 at horizon .. 1 near

    // Perspective: wave detail compresses towards the horizon. The horizontal
    // frequency stays constant — scaling it with depth shears the noise field
    // and the swell comes out running diagonally across the frame.
    //
    // The vertical multiplier has to be large: `py` changes slowly in the
    // foreground, so a small one leaves the noise varying faster across the
    // frame than down it, and the swell smears into vertical streaks instead of
    // lying down as horizontal crests.
    const py = 1 / (depth * 0.72 + 0.028);
    const swell = ridged(u * 3.0, py * 2.6, 4);
    const chop = fbm(u * 16, py * 7, 3);

    const base = lerp(74, 26, depth ** 0.8);
    r = base + swell * 26 * (1 - depth * 0.55) + chop * 9;
    g = base * 1.06 + swell * 27 * (1 - depth * 0.55) + chop * 9;
    b = base * 1.28 + swell * 24 * (1 - depth * 0.55) + chop * 8;

    // The sun's glitter path: widens and breaks up as it approaches.
    const width = 0.035 + depth * 0.26;
    const inPath = Math.exp(-(((u - sunU) / width) ** 2));
    const sparkle = smoothstep(0.5, 0.86, ridged(u * 18, py * 20, 3));
    const glitter = inPath * (0.32 + sparkle * 0.85) * (1 - depth * 0.45);

    r += glitter * 210;
    g += glitter * 165;
    b += glitter * 96;

    // Horizon haze, so the join reads as distance rather than a cut.
    const haze = 1 - smoothstep(0, 0.09, depth);
    r = lerp(r, 214, haze * 0.6);
    g = lerp(g, 176, haze * 0.6);
    b = lerp(b, 140, haze * 0.6);
  }

  // ---- promenade in the foreground, with two runners on it
  const deck = 0.88;
  if (v > deck) {
    const t = (v - deck) / (1 - deck);
    const tex = fbm(u * 50, v * 190, 3);
    const tone = lerp(52, 30, t ** 0.7) + tex * 16;
    r = tone * 1.02;
    g = tone;
    b = tone * 1.06;
  }

  for (const [cx, h, phase] of [
    [0.29, 0.13, 1.2],
    [0.395, 0.121, 3.9],
  ]) {
    const cov = runnerCoverage(u, v, cx, deck + 0.015, h, phase);
    if (cov > 0) {
      r = lerp(r, 12, cov);
      g = lerp(g, 12, cov);
      b = lerp(b, 16, cov);
    }
  }

  return finish([r, g, b], u, v, 1);
}

// ---------------------------------------------------------------- scene: track

/** Floodlit lanes — the Tuesday track session. */
function track(u, v) {
  const HZ = 0.335;
  let r;
  let g;
  let b;

  if (v < HZ) {
    // ---- night sky, brighter near the lights
    const t = v / HZ;
    const base = lerp(14, 30, t);
    const haze = fbm(u * 2.4 + 3, v * 6, 4) * 10;
    r = base + haze;
    g = base + haze;
    b = base * 1.22 + haze;
  } else {
    // ---- ground plane in perspective
    const z = 0.42 / (v - HZ); // depth: large near the horizon
    const worldX = (u - 0.5) * z * 1.9;

    // Tartan surface, texture scaled by distance so it doesn't shimmer.
    const grainScale = 1 / (z * 0.14 + 0.05);
    const tex = fbm(worldX * 7, z * 2.4, 3) * 0.6 + fbm(u * grainScale, v * grainScale * 2, 2) * 0.4;

    const near = smoothstep(9, 0.6, z); // 0 far .. 1 near
    const base = lerp(30, 62, near) + tex * 16;
    r = base * 1.16;
    g = base * 0.86;
    b = base * 0.8;

    // Lane lines, a constant width in world units so they thin with distance.
    //
    // They also have to fade out before the lanes pack closer together than the
    // pixel grid. Fading on distance alone isn't enough: towards the far corners
    // the lines run almost horizontally, so it's the vertical rate of change
    // that aliases. This uses the full screen-space gradient of the lane index,
    // in lane-periods per pixel, which covers both.
    const LANE = 0.42;
    const lane = worldX / LANE;
    const edge = Math.abs(lane - Math.round(lane));

    const dLdu = (z * 1.9) / LANE;
    const dLdv = (-(u - 0.5) * 1.9 * z) / (LANE * (v - HZ));
    const perPixel = Math.hypot(dLdu / WIDTH, dLdv / HEIGHT);
    const resolvable = 1 - smoothstep(0.16, 0.42, perPixel);

    const line = (1 - smoothstep(0.028, 0.062, edge)) * resolvable;
    r = lerp(r, 214, line * 0.85);
    g = lerp(g, 210, line * 0.85);
    b = lerp(b, 198, line * 0.85);

    // Pools of light thrown from the two towers.
    let pool = 0;
    for (const lx of [-1.5, 1.5]) {
      const d = Math.hypot((worldX - lx) * 0.5, (z - 2.6) * 0.42);
      pool += (1 - smoothstep(0, 2.4, d)) * 0.6;
    }
    r += pool * 44;
    g += pool * 42;
    b += pool * 36;
  }

  // ---- floodlight towers and their glow
  for (const tx of [0.155, 0.845]) {
    const dx = Math.abs(u - tx);

    // mast
    if (dx < 0.006 && v > 0.055 && v < HZ + 0.02) {
      r = 12;
      g = 12;
      b = 14;
    }
    // lamp bar
    if (dx < 0.055 && v > 0.036 && v < 0.055) {
      r = 30;
      g = 30;
      b = 32;
    }

    // lamps themselves, plus atmospheric bloom
    const d = Math.hypot((u - tx) * 1.25, v - 0.046);
    const lamp = 1 - smoothstep(0.012, 0.02, d);
    const bloom = (1 - smoothstep(0, 0.4, d)) ** 1.7;
    r += bloom * 120 + lamp * 190;
    g += bloom * 118 + lamp * 190;
    b += bloom * 104 + lamp * 180;
  }

  // ---- two runners, set at different depths to give the straight some scale
  for (const [cx, gy, h, phase] of [
    [0.66, 0.9, 0.22, 2.0],
    [0.44, 0.63, 0.115, 4.6],
  ]) {
    const cov = runnerCoverage(u, v, cx, gy, h, phase);
    if (cov > 0) {
      r = lerp(r, 15, cov);
      g = lerp(g, 14, cov);
      b = lerp(b, 16, cov);
    }
  }

  return finish([r, g, b], u, v, 2);
}

// ---------------------------------------------------------------- scene: lake

/** Still water at dawn — the Saturday long run at Akrotiri Salt Lake. */
function saltLake(u, v) {
  const HZ = 0.46;

  /** Sky is a function so the water can mirror it. */
  const sky = (uu, vv) => {
    const t = clamp01(vv / HZ);
    const cloud = fbm(uu * 2.6 + 21, vv * 7.5 + 3, 5);
    const mass = smoothstep(0.4, 0.78, cloud) * smoothstep(0, 0.55, t);
    const rr = lerp(150, 236, t ** 1.5) + mass * 16;
    const gg = lerp(168, 226, t ** 1.4) + mass * 14;
    const bb = lerp(196, 212, t ** 1.2) + mass * 10;
    return [rr, gg, bb];
  };

  let r;
  let g;
  let b;

  if (v < HZ) {
    [r, g, b] = sky(u, v);
  } else {
    // ---- water, mirroring the sky with ripple displacement
    const depth = (v - HZ) / (1 - HZ);
    const ripple = (fbm(u * 9, (1 / (depth * 0.6 + 0.05)) * 0.5, 4) - 0.5) * 0.02 * (0.25 + depth);
    const mirrored = HZ - (v - HZ) * 0.92;
    const [sr, sg, sb] = sky(clamp01(u + ripple), clamp01(mirrored));

    // Reflections lose contrast and warm slightly with distance from the shore.
    const flat = 0.16 + depth * 0.3;
    r = lerp(sr, 196, flat) - depth * 14;
    g = lerp(sg, 200, flat) - depth * 12;
    b = lerp(sb, 200, flat) - depth * 12;

    // Fine surface streaks.
    const streak = ridged(u * 14, (1 / (depth * 0.5 + 0.04)) * 0.9, 3);
    r += streak * 10 * (1 - depth * 0.4);
    g += streak * 10 * (1 - depth * 0.4);
    b += streak * 9 * (1 - depth * 0.4);

    // ---- salt crust taking over the foreground
    const crustAmount = smoothstep(0.66, 0.92, depth);
    if (crustAmount > 0) {
      const scale = 16 + depth * 44;
      const cell = voronoiEdge(u * scale, (depth ** 1.5) * scale * 0.85);
      const ridge = 1 - smoothstep(0.0, 0.09, cell); // bright raised edges
      const plate = fbm(u * 22, depth * 30, 3);

      const crustR = 214 + ridge * 34 + plate * 22;
      const crustG = 214 + ridge * 34 + plate * 22;
      const crustB = 210 + ridge * 32 + plate * 20;

      r = lerp(r, crustR, crustAmount);
      g = lerp(g, crustG, crustAmount);
      b = lerp(b, crustB, crustAmount);
    }
  }

  // ---- far shore: a low, hazy treeline sitting on the waterline
  const ridgeY = HZ - 0.028 - fbm(u * 4.5 + 7, 0.5, 3) * 0.02;
  if (v > ridgeY && v < HZ) {
    const d = smoothstep(ridgeY, HZ, v);
    const dark = fbm(u * 30, v * 40, 3) * 18;
    r = lerp(lerp(126, 176, d) + dark, r, 0.28);
    g = lerp(lerp(134, 182, d) + dark, g, 0.28);
    b = lerp(lerp(130, 186, d) + dark, b, 0.28);
  }

  // ---- three runners strung out along the shoreline
  for (const [cx, h, phase] of [
    [0.235, 0.072, 0.8],
    [0.293, 0.066, 2.4],
    [0.345, 0.061, 4.3],
  ]) {
    const cov = runnerCoverage(u, v, cx, HZ + 0.006, h, phase);
    if (cov > 0) {
      r = lerp(r, 52, cov);
      g = lerp(g, 55, cov);
      b = lerp(b, 58, cov);
    }
  }

  return finish([r, g, b], u, v, 3);
}

// ---------------------------------------------------------------- output

const SCENES = { seaside, track, saltLake };

const FILES = [
  { name: 'feed-molos.png', scene: 'seaside', w: 1080, h: 720 },
  { name: 'feed-track.png', scene: 'track', w: 1080, h: 720 },
  { name: 'feed-salt-lake.png', scene: 'saltLake', w: 1080, h: 720 },
  { name: 'hero-tue.png', scene: 'track', w: 1080, h: 800 },
  { name: 'hero-thu.png', scene: 'seaside', w: 1080, h: 800 },
  { name: 'hero-sat.png', scene: 'saltLake', w: 1080, h: 800 },
];

mkdirSync(OUT, { recursive: true });

for (const file of FILES) {
  const started = Date.now();
  ASPECT = file.w / file.h;
  WIDTH = file.w;
  HEIGHT = file.h;
  const buf = png(file.w, file.h, SCENES[file.scene]);
  writeFileSync(join(OUT, file.name), buf);
  console.log(
    `${file.name.padEnd(22)} ${file.w}×${file.h}  ${(buf.length / 1024)
      .toFixed(0)
      .padStart(4)} KB  ${((Date.now() - started) / 1000).toFixed(1)}s`,
  );
}

console.log(`\nWrote ${FILES.length} images to ${OUT}`);
