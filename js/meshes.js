import {
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  ConeGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
} from "../vendor/three.module.js";
import { SPECIES, nextStage } from "./data.js";
import { takeModel } from "./models.js";

const AGE = {
  baby: {
    leg: 0.36, head: 1.7, body: 0.74, round: 1, snout: 0.32, ear: 1.45,
    fluff: 1, eye: 1.6, neck: 0.42, trunk: 0.26, mane: 0, antler: 0,
    wing: 0.2, tusk: 0, hump: 0.18, swing: 1.05, freq: 1.55, hop: 1,
    waddle: 1, pudgy: 1.28,
  },
  juvenile: {
    leg: 0.58, head: 1.3, body: 0.84, round: 0.45, snout: 0.58, ear: 1.18,
    fluff: 0.5, eye: 1.28, neck: 0.68, trunk: 0.48, mane: 0.08, antler: 0.22,
    wing: 0.46, tusk: 0.12, hump: 0.48, swing: 0.82, freq: 1.24, hop: 0.42,
    waddle: 0.5, pudgy: 1.1,
  },
  adolescent: {
    leg: 0.8, head: 1.08, body: 0.94, round: 0.12, snout: 0.82, ear: 1.04,
    fluff: 0.16, eye: 1.08, neck: 0.88, trunk: 0.76, mane: 0.5, antler: 0.6,
    wing: 0.74, tusk: 0.55, hump: 0.78, swing: 0.62, freq: 1.05, hop: 0.1,
    waddle: 0.16, pudgy: 1.02,
  },
  adult: {
    leg: 1, head: 0.94, body: 1, round: 0, snout: 1, ear: 1, fluff: 0,
    eye: 1, neck: 1, trunk: 1, mane: 1, antler: 1, wing: 1, tusk: 1, hump: 1,
    swing: 0.5, freq: 0.9, hop: 0, waddle: 0, pudgy: 1,
  },
  prime: {
    leg: 1.1, head: 1.02, body: 1.16, round: 0, snout: 1.06, ear: 1.14,
    fluff: 0, eye: 0.95, neck: 1.1, trunk: 1.18, mane: 1.12, antler: 1.22,
    wing: 1.22, tusk: 1.28, hump: 1.12, swing: 0.46, freq: 0.84, hop: 0,
    waddle: 0, pudgy: 1.04,
  },
  alpha: {
    leg: 1.28, head: 1.18, body: 1.34, round: 0, snout: 1.2, ear: 1.25,
    fluff: 0.2, eye: 1.45, neck: 1.2, trunk: 1.3, mane: 1.55, antler: 1.7,
    wing: 1.48, tusk: 1.55, hump: 1.35, swing: 0.62, freq: 0.78, hop: 0,
    waddle: 0, pudgy: 1.12,
  },
};

let buildStage = "adult";
let eyeColor = "#6a4a28";

const texCache = new Map();

function canvasTex(key, draw, repeat = 2, colorSpace = SRGBColorSpace) {
  if (texCache.has(key)) return texCache.get(key);
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  draw(canvas.getContext("2d"), canvas.width);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = colorSpace;
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  texCache.set(key, tex);
  return tex;
}

function furTex() {
  return canvasTex("fur", (g, n) => {
    g.fillStyle = "#f4f1ea";
    g.fillRect(0, 0, n, n);
    for (let i = 0; i < 1600; i++) {
      const x = Math.random() * n;
      const y = Math.random() * n;
      const shade = 120 + Math.floor(Math.random() * 110);
      g.strokeStyle = `rgba(${shade},${Math.max(0, shade - 12)},${Math.max(0, shade - 24)},0.55)`;
      g.lineWidth = Math.random() < 0.2 ? 2 : 1;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (Math.random() - 0.5) * 1.2, y + 3 + Math.random() * 8);
      g.stroke();
    }
  }, 4);
}

function furNormal() {
  return canvasTex("fur-n", (g, n) => {
    const img = g.createImageData(n, n);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const i = (y * n + x) * 4;
        const strand = Math.sin((x * 0.7) + (y * 1.8)) * 22;
        img.data[i] = 128 + strand;
        img.data[i + 1] = 148;
        img.data[i + 2] = 230;
        img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
  }, 4, NoColorSpace);
}

function geo(g) {
  return g;
}

function mat(color, opts = {}) {
  const c = new Color(color);
  let emissive = new Color(0x000000);
  let emissiveIntensity = 0;
  if (buildStage === "alpha") {
    c.offsetHSL(0.02, 0.22, -0.14);
    emissive = new Color("#ffb15a");
    emissiveIntensity = 0.42;
  } else if (buildStage === "baby") {
    c.offsetHSL(0, -0.08, 0.08);
  } else if (buildStage === "juvenile") {
    c.offsetHSL(0.03, -0.04, 0.04);
  } else if (buildStage === "adolescent") {
    c.offsetHSL(-0.02, 0.06, -0.02);
  } else if (buildStage === "prime") {
    c.offsetHSL(0.04, 0.1, 0.02);
  }
  const fur = opts.map !== false;
  const sheen = new Color(c).offsetHSL(0, -0.05, 0.12);
  const material = new MeshPhysicalMaterial({
    color: c,
    map: fur ? furTex() : null,
    normalMap: fur ? furNormal() : null,
    emissive,
    emissiveIntensity: buildStage === "alpha" ? 0.08 : emissiveIntensity,
    roughness: opts.roughness ?? 0.86,
    metalness: 0,
    sheen: fur ? 0.72 : 0,
    sheenRoughness: 0.42,
    sheenColor: sheen,
    transparent: !!opts.transparent,
    opacity: opts.opacity ?? 1,
    depthWrite: opts.depthWrite ?? true,
  });
  if (fur) material.normalScale = new Vector2(0.45, 0.85);
  return material;
}

function part(parent, geometry, color, x, y, z, opts = {}) {
  const mesh = new Mesh(geometry, mat(color, opts));
  mesh.position.set(x, y, z);
  mesh.castShadow = opts.shadow !== false;
  mesh.receiveShadow = true;
  if (opts.rot) mesh.rotation.set(opts.rot[0], opts.rot[1], opts.rot[2]);
  if (opts.scale) mesh.scale.set(opts.scale[0], opts.scale[1], opts.scale[2]);
  parent.add(mesh);
  return mesh;
}

function blendAge(species, stage, growth01) {
  const age = { ...AGE[stage] };
  const nxt = nextStage(species, stage);
  if (!nxt) return age;
  const toward = AGE[nxt];
  const t = growth01 * 0.22;
  for (const key of Object.keys(age)) {
    age[key] = age[key] + (toward[key] - age[key]) * t;
  }
  return age;
}

function leg(parent, x, y, z, height, radius, color) {
  const hip = new Group();
  hip.position.set(x, y, z);
  const shoulder = part(hip, geo(new SphereGeometry(radius * 2.4, 10, 8)), color, 0, radius * 0.2, 0, { shadow: false });
  shoulder.scale.set(1.15, 0.75, 1.35);
  const limb = part(
    hip,
    geo(new CapsuleGeometry(radius, Math.max(0.04, height - radius * 2), 4, 8)),
    color,
    0,
    -height / 2,
    0,
  );
  const paw = part(
    hip,
    geo(new SphereGeometry(radius * 1.35, 8, 6)),
    color,
    0,
    -height,
    radius * 0.3,
  );
  paw.scale.set(1.15, 0.55, 1.35);
  for (let i = 0; i < 4; i++) {
    const toe = part(
      hip,
      geo(new SphereGeometry(radius * 0.48, 8, 6)),
      color,
      (i - 1.5) * radius * 0.72,
      -height - radius * 0.05,
      radius * 1.15,
      { shadow: false },
    );
    toe.scale.set(0.8, 0.55, 1.1);
  }
  parent.add(hip);
  return hip;
}

function eyePair(parent, spread, y, z, size, dark) {
  for (const side of [-1, 1]) {
    part(parent, geo(new SphereGeometry(size, 10, 8)), dark || "#2a211c", side * spread, y, z, { shadow: false, map: false, roughness: 0.4 });
    const iris = part(parent, geo(new SphereGeometry(size * 0.7, 10, 8)), eyeColor, side * spread, y, z + size * 0.18, { shadow: false, map: false, roughness: 0.2 });
    iris.scale.set(1, 0.88, 0.45);
    part(parent, geo(new SphereGeometry(size * 0.3, 8, 6)), "#120e0c", side * spread, y, z + size * 0.38, { shadow: false, map: false, roughness: 0.15 });
    part(parent, geo(new SphereGeometry(size * 0.1, 6, 4)), "#ffffff", side * spread + size * 0.16, y + size * 0.16, z + size * 0.9, { shadow: false, map: false, roughness: 0.05 });
  }
}

function ears(parent, species, age, S, headR) {
  const nodes = [];
  if (species.ears === "none") return nodes;
  const h = headR * age.ear;
  for (const side of [-1, 1]) {
    const g = new Group();
    g.position.set(side * headR * 0.72, headR * 0.75, 0);
    if (species.ears === "point" || species.ears === "tuft") {
      part(g, geo(new ConeGeometry(headR * 0.28, h, 8)), species.colors.body, 0, h * 0.35, 0);
      part(g, geo(new ConeGeometry(headR * 0.14, h * 0.7, 6)), species.colors.belly, 0, h * 0.28, headR * 0.08, { shadow: false });
    } else if (species.ears === "floppy") {
      const flap = part(g, geo(new SphereGeometry(headR * 0.38, 8, 6)), species.colors.body, 0, -h * 0.15, 0);
      flap.scale.set(0.55, 1.3, 0.35);
    } else if (species.ears === "long") {
      const ear = part(g, geo(new SphereGeometry(headR * 0.28, 8, 6)), species.colors.body, 0, h * 0.8, 0);
      ear.scale.set(0.45, 2.4, 0.35);
    } else if (species.ears === "fan") {
      const fan = part(g, geo(new CircleGeometry(headR * 0.95 * age.ear, 10)), species.colors.accent, side * headR * 0.2, 0, 0);
      fan.rotation.y = side * 0.6;
    } else if (species.ears === "round" || species.ears === "small" || species.ears === "side") {
      part(g, geo(new SphereGeometry(headR * (species.ears === "small" ? 0.22 : 0.34), 8, 6)), species.colors.body, 0, h * 0.2, 0);
    }
    parent.add(g);
    nodes.push(g);
  }
  return nodes;
}

function addFluff(parent, color, r, y, amount) {
  if (amount < 0.2) return;
  const shell = part(parent, geo(new SphereGeometry(r, 10, 8)), color, 0, y, 0, {
    transparent: true,
    opacity: 0.28 + amount * 0.12,
    depthWrite: false,
    roughness: 1,
    shadow: false,
  });
  shell.scale.set(1.15, 0.9, 1.25);
}

function addAccessories(pivot, accessories, y, z) {
  if (!accessories?.length) return;
  const has = (id) => accessories.includes(id);
  if (has("tiny-bell") || has("cliff-bell")) {
    part(pivot, geo(new SphereGeometry(0.055, 8, 6)), "#e6c15a", 0, y, z, { shadow: false });
  }
  if (has("flight-ribbon")) {
    part(pivot, geo(new BoxGeometry(0.28, 0.04, 0.12)), "#e07a9a", 0, y, -0.05, { shadow: false });
  }
  if (has("hunter-band")) {
    const band = part(pivot, geo(new TorusGeometry(0.1, 0.02, 6, 10)), "#2a241c", 0, y, z, { shadow: false });
    band.rotation.x = Math.PI / 2;
  }
  if (has("forest-leaf")) {
    part(pivot, geo(new ConeGeometry(0.06, 0.16, 5)), "#3f8f4a", 0, y + 0.18, 0, { shadow: false });
  }
  if (has("gale-crest")) {
    part(pivot, geo(new ConeGeometry(0.05, 0.2, 5)), "#e6c15a", 0, y + 0.2, 0, { shadow: false });
  }
  if (has("desert-sash")) {
    part(pivot, geo(new BoxGeometry(0.36, 0.06, 0.2)), "#c9842a", 0, y * 0.55, 0, { shadow: false });
  }
  if (has("guardian-fang")) {
    part(pivot, geo(new ConeGeometry(0.035, 0.14, 5)), "#f4f1ea", 0.08, y * 0.7, 0.12, {
      rot: [0.4, 0, 0.4],
      shadow: false,
    });
  }
}

function stripes(parent, count, length, height, dark, softness) {
  const color = new Color(dark).lerp(new Color("#ffffff"), softness * 0.55);
  for (let i = 0; i < count; i++) {
    const along = (i / Math.max(1, count - 1) - 0.5) * length * 0.8;
    part(parent, geo(new BoxGeometry(height * 0.9, height * 0.18, 0.035)), color, 0, height * 0.25, along, {
      shadow: false,
    });
  }
}

function addSpeciesDetail(pivot, species, S) {
  const id = species.id;
  const c = species.colors;
  const y = S * 0.72;
  const mark = (geometry, color, x, yy, z, opts) => part(pivot, geo(geometry), color, x, yy, z, { shadow: false, ...opts });
  if (id === "shiba") {
    mark(new SphereGeometry(0.06 * S, 8, 6), "#fff7ea", 0.08 * S, y, 0.42 * S);
    mark(new SphereGeometry(0.06 * S, 8, 6), "#fff7ea", -0.08 * S, y, 0.42 * S);
    mark(new TorusGeometry(0.07 * S, 0.018 * S, 6, 10), c.accent, 0, y * 0.55, -0.42 * S, { rot: [0.4, 0, 0.8] });
  } else if (id === "retriever") {
    mark(new BoxGeometry(0.05 * S, 0.04 * S, 0.22 * S), "#f4efe4", 0, y * 0.35, 0.15 * S);
    mark(new SphereGeometry(0.09 * S, 8, 6), c.accent, 0, y * 0.4, -0.55 * S);
  } else if (id === "fox") {
    mark(new ConeGeometry(0.04 * S, 0.16 * S, 5), "#f6f1e6", 0, y * 0.2, 0.48 * S);
    mark(new BoxGeometry(0.03 * S, 0.22 * S, 0.08 * S), "#fffaf2", 0, y * 0.5, -0.55 * S);
  } else if (id === "cat") {
    for (const side of [-1, 1]) mark(new BoxGeometry(0.012 * S, 0.05 * S, 0.012 * S), "#2a241c", side * 0.05 * S, y * 0.95, 0.28 * S);
    mark(new TorusGeometry(0.05 * S, 0.012 * S, 5, 8), c.dark, 0, y * 0.35, -0.4 * S, { rot: [0.2, 0, 1] });
  } else if (id === "rabbit") {
    mark(new SphereGeometry(0.05 * S, 8, 6), "#fff", 0, y * 0.25, 0.38 * S);
    mark(new SphereGeometry(0.07 * S, 8, 6), "#fff", 0, y * 0.3, -0.28 * S);
  } else if (id === "wolf") {
    mark(new BoxGeometry(0.16 * S, 0.03 * S, 0.28 * S), "#1c2430", 0, y * 1.05, 0.05 * S);
    mark(new ConeGeometry(0.03 * S, 0.1 * S, 5), "#e8e4dc", 0.06 * S, y * 0.85, 0.32 * S);
  } else if (id === "deer") {
    for (const side of [-1, 1]) {
      mark(new CylinderGeometry(0.01 * S, 0.012 * S, 0.16 * S, 5), "#6b4a2a", side * 0.08 * S, y * 1.35, 0.12 * S, { rot: [0, 0, side * 0.6] });
    }
    mark(new SphereGeometry(0.04 * S, 6, 5), "#f2e2c4", 0, y * 0.4, 0.4 * S);
  } else if (id === "bear") {
    mark(new SphereGeometry(0.11 * S, 8, 6), c.belly, 0, y * 0.55, 0.22 * S);
    mark(new BoxGeometry(0.18 * S, 0.04 * S, 0.06 * S), "#2a2118", 0, y * 0.2, 0.48 * S);
  } else if (id === "horse") {
    mark(new BoxGeometry(0.04 * S, 0.28 * S, 0.12 * S), "#1a120c", 0, y * 1.15, 0.18 * S);
    mark(new BoxGeometry(0.12 * S, 0.03 * S, 0.04 * S), "#f4f0e6", 0, y * 0.35, 0.5 * S);
  } else if (id === "zebra") {
    for (let i = 0; i < 4; i++) mark(new BoxGeometry(0.22 * S, 0.025 * S, 0.04 * S), "#111", 0, y * (0.4 + i * 0.12), (i - 1.5) * 0.08 * S);
  } else if (id === "lion") {
    mark(new SphereGeometry(0.2 * S, 10, 8), "#c47a2a", 0, y * 0.95, 0.02 * S);
    mark(new ConeGeometry(0.025 * S, 0.08 * S, 4), "#f4e2b0", 0, y * 0.7, 0.42 * S);
  } else if (id === "tiger") {
    for (let i = 0; i < 5; i++) mark(new BoxGeometry(0.2 * S, 0.02 * S, 0.035 * S), "#1a120c", 0, y * 0.55, (i - 2) * 0.08 * S);
    mark(new BoxGeometry(0.03 * S, 0.08 * S, 0.12 * S), "#f6f1e6", 0, y * 0.15, -0.48 * S);
  } else if (id === "elephant") {
    mark(new SphereGeometry(0.05 * S, 6, 5), "#f7f4ee", 0.12 * S, y * 0.55, 0.55 * S);
    mark(new SphereGeometry(0.05 * S, 6, 5), "#f7f4ee", -0.12 * S, y * 0.55, 0.55 * S);
  } else if (id === "camel") {
    mark(new SphereGeometry(0.12 * S, 8, 6), c.dark, 0, y * 1.15, -0.05 * S);
    mark(new BoxGeometry(0.08 * S, 0.02 * S, 0.16 * S), "#6a4028", 0, y * 0.9, 0.2 * S);
  } else if (id === "gorilla") {
    mark(new BoxGeometry(0.22 * S, 0.06 * S, 0.08 * S), "#1a120e", 0, y * 0.85, 0.12 * S);
    mark(new SphereGeometry(0.06 * S, 6, 5), "#c4a090", 0, y * 0.4, 0.28 * S);
  } else if (id === "goat") {
    mark(new ConeGeometry(0.03 * S, 0.18 * S, 5), "#d9d3c4", 0.06 * S, y * 1.2, 0.12 * S, { rot: [0.2, 0, -0.5] });
    mark(new ConeGeometry(0.03 * S, 0.18 * S, 5), "#d9d3c4", -0.06 * S, y * 1.2, 0.12 * S, { rot: [0.2, 0, 0.5] });
    mark(new BoxGeometry(0.1 * S, 0.02 * S, 0.04 * S), "#f4f0e6", 0, y * 0.55, 0.32 * S);
  } else if (id === "eagle") {
    mark(new ConeGeometry(0.04 * S, 0.22 * S, 5), "#f2c14e", 0, y * 1.15, 0.35 * S);
    mark(new BoxGeometry(0.28 * S, 0.015 * S, 0.08 * S), "#f6f1e6", 0, y * 0.7, 0);
  } else if (id === "owl") {
    mark(new TorusGeometry(0.07 * S, 0.012 * S, 6, 12), "#f4e7a8", 0.07 * S, y * 0.95, 0.22 * S);
    mark(new TorusGeometry(0.07 * S, 0.012 * S, 6, 12), "#f4e7a8", -0.07 * S, y * 0.95, 0.22 * S);
    mark(new ConeGeometry(0.025 * S, 0.1 * S, 4), "#e0a040", 0, y * 0.72, 0.32 * S);
  } else if (id === "aurora") {
    mark(new TorusGeometry(0.18 * S, 0.012 * S, 6, 16), "#7ee0ff", 0, y * 0.8, 0, { rot: [Math.PI / 2, 0, 0] });
    mark(new SphereGeometry(0.05 * S, 8, 6), "#d7fff4", 0, y * 1.2, 0.1 * S);
  }
}

function addAlphaMarks(pivot, species, S) {
  const crown = new Group();
  crown.position.set(0, S * 1.05, S * 0.15);
  for (let i = 0; i < 5; i++) {
    const spike = part(crown, geo(new ConeGeometry(0.045 * S, 0.28 * S, 5)), "#f2c14e", (i - 2) * 0.09 * S, 0.12 * S, 0, { shadow: false });
    spike.rotation.z = (i - 2) * 0.18;
  }
  pivot.add(crown);
  const aura = part(pivot, geo(new TorusGeometry(S * 0.55, 0.025 * S, 6, 18)), "#ffd27a", 0, 0.08, 0, {
    rot: [Math.PI / 2, 0, 0],
    shadow: false,
    transparent: true,
    opacity: 0.85,
  });
  aura.userData.aura = true;
  if (species.plan === "bird") {
    part(pivot, geo(new ConeGeometry(0.08 * S, 0.34 * S, 5)), "#f2c14e", 0, S * 0.7, S * 0.2, { shadow: false });
  }
}

export function buildCreature(speciesId, stage, growth01 = 0, accessories = []) {
  const modeled = takeModel(speciesId, stage);
  if (modeled) return modeled;
  const species = SPECIES[speciesId];
  buildStage = stage;
  eyeColor = species.colors.eye || species.colors.dark || "#5a3a22";
  const age = blendAge(species, stage, growth01);
  const S = species.scale;
  const group = new Group();
  const pivot = new Group();
  group.add(pivot);
  const rig = { legs: [], ears: [], wings: [], trunk: [], tail: null, head: null, toy: null };

  if (species.plan === "bird") buildBird(pivot, rig, species, age, S);
  else if (species.plan === "ape") buildApe(pivot, rig, species, age, S);
  else if (species.plan === "elephant") buildElephant(pivot, rig, species, age, S);
  else buildQuad(pivot, rig, species, age, S);

  addSpeciesDetail(pivot, species, S);
  if (stage === "alpha") addAlphaMarks(pivot, species, S);
  addAccessories(pivot, accessories, rig.neckY || S * 0.5, S * 0.25);
  if (species.personality === "playful") {
    rig.toy = part(pivot, geo(new SphereGeometry(S * 0.08, 8, 6)), "#d4543c", 0, 0.05, S * 0.4, { shadow: false });
    rig.toy.visible = false;
  }

  const seatY = rig.seatY ?? S * 0.7;
  const seatZ = rig.seatZ ?? 0;
  const anim = {
    group,
    pivot,
    seat: { x: 0, y: seatY, z: seatZ },
    age,
    phase: Math.random() * 4,
    species,
    animate(dt, motion) {
      const moving = !!motion.moving;
      const freq = (moving ? 8.5 : 2.2) * age.freq * (motion.flapStrong ? 1.35 : 1);
      this.phase += dt * freq;
      const swing = (moving ? 0.7 : 0.06) * age.swing;
      rig.legs.forEach((legNode, i) => {
        const diag = i === 0 || i === 3 ? 0 : Math.PI;
        legNode.rotation.x = Math.sin(this.phase + diag) * swing;
      });
      const hop = (moving ? age.hop : 0) + (motion.hop && moving ? 0.8 : 0);
      if (motion.sit) {
        pivot.position.y = -(S * 0.18);
        if (rig.legs[0]) rig.legs[0].rotation.x = 0.8;
        if (rig.legs[1]) rig.legs[1].rotation.x = 0.8;
        if (rig.legs[2]) rig.legs[2].rotation.x = -1.25;
        if (rig.legs[3]) rig.legs[3].rotation.x = -1.25;
      } else if (hop > 0.05) {
        pivot.position.y = Math.abs(Math.sin(this.phase)) * 0.16 * Math.max(hop, 0.3);
      } else {
        pivot.position.y = Math.sin(this.phase * 0.5) * (moving ? 0.03 : 0.012);
      }
      pivot.rotation.z = Math.sin(this.phase * 0.45) * 0.16 * age.waddle;
      if (rig.head) {
        rig.head.rotation.x = (rig.headBaseX || 0) + Math.sin(this.phase * 0.4) * 0.06 + (motion.play ? 0.35 : 0);
        rig.head.rotation.y = Math.sin(this.phase * 0.22) * (moving ? 0.04 : 0.12);
      }
      rig.ears.forEach((ear, i) => {
        const sign = i % 2 === 0 ? 1 : -1;
        ear.rotation.z = sign * (0.12 + Math.sin(this.phase * 1.6 + i) * 0.08 * (0.3 + age.fluff));
      });
      if (rig.tail) {
        rig.tail.rotation.y = Math.sin(this.phase * (age.fluff > 0.4 ? 2.2 : 1.1)) * (0.2 + age.fluff * 0.25);
        rig.tail.rotation.x = (rig.tailBaseX || 0) + Math.sin(this.phase) * 0.05;
      }
      const flap = (motion.flapStrong ? 0.95 : motion.flap ? 0.35 : 0) * (0.35 + age.wing);
      rig.wings.forEach((wing, i) => {
        const sign = i === 0 ? 1 : -1;
        wing.rotation.z = sign * (0.35 + Math.sin(this.phase) * flap);
      });
      rig.trunk.forEach((seg, i) => {
        seg.rotation.x = Math.sin(this.phase * 0.45 + i) * 0.12 * (i + 1) * 0.25;
      });
      if (rig.toy) {
        rig.toy.visible = !!motion.play;
        if (motion.play) {
          rig.toy.position.set(Math.cos(this.phase) * S * 0.28, S * 0.06, S * 0.42);
        }
      }
    },
    dispose() {
      group.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    },
  };
  return anim;
}

const SHAPE = {
  shiba: { leg: 0.78, len: 0.88, chest: 1.28, head: 1.08, snout: 0.78, neck: 0.75, ear: 0.9, tailUp: 1.15, bib: 1 },
  retriever: { leg: 0.98, len: 1.08, chest: 1.02, snout: 1.05, neck: 0.8, ear: 1.15 },
  fox: { leg: 0.78, len: 0.95, chest: 1.15, head: 0.95, snout: 1.15, neck: 0.8, ear: 1.45, tail: 1.2, socks: 1 },
  cat: { leg: 0.68, len: 1.02, chest: 0.78, head: 1.08, snout: 0.42, neck: 0.5, ear: 0.9, tail: 1.25 },
  rabbit: { leg: 0.52, len: 0.78, chest: 1.2, head: 1.05, snout: 0.35, neck: 0.35, ear: 1.7 },
  wolf: { leg: 1.02, len: 1.0, chest: 1.22, head: 0.88, snout: 1.35, neck: 0.95, ear: 0.95, ruff: 1 },
  deer: { leg: 1.48, len: 1.02, chest: 0.72, head: 0.68, snout: 1.1, neck: 1.65, ear: 1.15 },
  bear: { leg: 0.58, len: 1.18, chest: 1.4, head: 0.82, snout: 0.65, neck: 0.38, ear: 0.6 },
  horse: { leg: 1.15, len: 1.0, chest: 1.35, head: 0.72, snout: 1.35, neck: 1.15, ear: 0.75, mane: 1, tail: 1.1 },
  zebra: { leg: 1.36, len: 1.12, chest: 0.98, head: 0.62, snout: 1.4, neck: 1.6, ear: 0.75, mane: 1, tail: 1.15 },
  lion: { leg: 1.05, len: 1.22, chest: 1.12, snout: 0.8, neck: 0.85, ear: 0.7 },
  tiger: { leg: 1.02, len: 1.3, chest: 1.02, snout: 0.85, neck: 0.8, ear: 0.65, tail: 1.15 },
  camel: { leg: 1.28, len: 1.18, chest: 0.82, head: 0.66, snout: 1.05, neck: 1.85, ear: 0.5 },
  goat: { leg: 0.82, len: 0.88, chest: 0.88, head: 0.78, snout: 0.65, neck: 0.85 },
};

function buildQuad(pivot, rig, species, age, S) {
  const c = species.colors;
  const sh = SHAPE[species.id] || {};
  let legH = 0.52 * S * age.leg * (sh.leg || 1);
  let bodyLen = 0.85 * S * species.length * age.body * (sh.len || 1);
  let bodyH = 0.34 * S * species.bulk * age.pudgy * (sh.chest || 1);
  const bodyW = bodyH * (0.85 + (1 - age.round) * 0.25);
  const bodyY = legH + bodyH * 0.48;
  const body = new Group();
  body.position.set(0, bodyY, 0);
  pivot.add(body);
  if (age.round > 0.65) {
    const ball = part(body, geo(new SphereGeometry(bodyH * 0.72, 20, 16)), c.body, 0, 0, 0);
    ball.scale.set(1, 0.86, 1.2);
  } else {
    const torso = part(body, geo(new CapsuleGeometry(bodyH * 0.46, Math.max(0.08, bodyLen * 0.62), 8, 16)), c.body, 0, 0, 0);
    torso.rotation.x = Math.PI / 2;
    const chest = part(body, geo(new SphereGeometry(bodyH * 0.5, 16, 12)), c.body, 0, bodyH * 0.02, bodyLen * 0.28);
    chest.scale.set(0.92, 0.82, 0.85);
    const belly = part(body, geo(new SphereGeometry(bodyH * 0.38, 14, 10)), c.belly, 0, -bodyH * 0.22, bodyLen * 0.05, { shadow: false });
    belly.scale.set(0.9, 0.55, 1.3);
    const haunch = part(body, geo(new SphereGeometry(bodyH * 0.46, 14, 12)), c.body, 0, bodyH * 0.02, -bodyLen * 0.32);
    haunch.scale.set(1.05, 0.95, 0.9);
    const withers = part(body, geo(new SphereGeometry(bodyH * 0.4, 12, 10)), c.body, 0, bodyH * 0.22, bodyLen * 0.22);
    withers.scale.set(0.9, 0.7, 1);
  }
  addFluff(body, c.accent, bodyH * 0.85, 0, age.fluff * species.fluff);
  if (species.stripes) stripes(body, species.stripes, bodyLen, bodyH, c.dark, age.fluff);
  if (species.spots && age.fluff > 0.15) {
    for (let i = 0; i < 5; i++) {
      part(body, geo(new SphereGeometry(bodyH * 0.08, 6, 5)), c.accent, (i - 2) * bodyW * 0.18, bodyH * 0.2, (i % 2 ? 0.1 : -0.08) * bodyLen, { shadow: false });
    }
  }
  const neckLen = Math.max(0.12, 0.28 * S * species.neck * age.neck * (sh.neck || 1));
  const neck = new Group();
  neck.position.set(0, bodyH * 0.22, bodyLen * 0.34);
  neck.rotation.x = species.neck > 1.2 ? 0.7 : 0.48;
  body.add(neck);
  const neckMesh = part(neck, geo(new CapsuleGeometry(Math.max(0.04, bodyW * 0.28), neckLen * 0.55, 5, 10)), c.body, 0, neckLen * 0.42, 0);
  neckMesh.scale.set(1, 1, 0.85);
  if (species.crest && age.neck > 0.6) {
    part(neck, geo(new BoxGeometry(0.035 * S, neckLen * 0.45, 0.05 * S)), c.dark, 0, neckLen * 0.55, -bodyW * 0.05, { shadow: false });
  }
  if (species.hump > 0) {
    const hump = part(body, geo(new SphereGeometry(bodyH * 0.55 * (0.25 + age.hump), 10, 8)), c.body, 0, bodyH * 0.45, -bodyLen * 0.05);
    hump.scale.set(0.8, 0.7 + age.hump * 0.4, 1);
  }
  if (sh.mane) {
    for (let i = 0; i < 6; i++) {
      const lock = part(neck, geo(new BoxGeometry(0.02 * S, neckLen * 0.22, 0.012 * S)), "#1a120c", 0, neckLen * (0.2 + i * 0.12), -bodyW * 0.22, { shadow: false, map: false });
      lock.rotation.x = -0.4;
    }
  }
  if (sh.ruff) {
    const ruff = part(neck, geo(new SphereGeometry(bodyW * 0.55, 12, 10)), c.accent, 0, neckLen * 0.15, 0, { shadow: false });
    ruff.scale.set(1.3, 0.7, 1.1);
  }
  const headR = 0.2 * S * species.bulk * age.head * (sh.head || 1);
  const head = new Group();
  head.position.set(0, neckLen * 0.92, 0);
  head.rotation.x = species.neck > 1.2 ? 0.15 : -0.35;
  rig.headBaseX = head.rotation.x;
  neck.add(head);
  rig.head = head;
  part(head, geo(new SphereGeometry(headR, 20, 16)), c.body, 0, 0, 0);
  const snout = part(head, geo(new SphereGeometry(headR * (0.32 + age.snout * 0.22), 14, 10)), age.snout > 0.7 ? c.body : c.belly, 0, -headR * 0.18, headR * 0.78, {
    scale: [0.85, 0.62, (0.7 + age.snout * 0.9) * (sh.snout || 1)],
  });
  const snoutReach = headR * (0.85 + (sh.snout || 1) * 0.55);
  part(head, geo(new SphereGeometry(headR * 0.1, 8, 6)), "#2a211c", 0, -headR * 0.16, snoutReach, { shadow: false, map: false, roughness: 0.35 });
  part(head, geo(new BoxGeometry(headR * 0.22, headR * 0.025, headR * 0.06)), "#3a2a24", 0, -headR * 0.28, snoutReach * 0.85, { shadow: false, map: false });
  eyePair(head, headR * 0.38, headR * 0.15, headR * 0.72, headR * 0.16 * age.eye, c.dark);
  rig.ears = ears(head, species, age, S, headR);
  if (sh.ear) rig.ears.forEach((ear) => ear.scale.multiplyScalar(sh.ear));
  if (species.mane && age.mane > 0.35) {
    const mane = part(head, geo(new SphereGeometry(headR * (0.7 + age.mane * 0.55), 10, 8)), c.accent, 0, headR * 0.1, -headR * 0.35);
    mane.scale.set(1.15, 1.2, 0.7);
  }
  if (species.antler && age.antler > 0.35) {
    for (const side of [-1, 1]) {
      part(head, geo(new CylinderGeometry(0.015 * S, 0.02 * S, headR * 1.4 * age.antler, 5)), c.dark, side * headR * 0.3, headR * 0.9, 0, { shadow: false });
    }
  }
  if (species.horns > 0 && age.antler > 0.2) {
    for (const side of [-1, 1]) {
      const horn = part(head, geo(new ConeGeometry(0.035 * S, headR * 0.9 * Math.max(0.35, age.antler), 6)), c.dark, side * headR * 0.45, headR * 0.7, 0);
      horn.rotation.z = side * -0.4;
    }
  }
  const hipX = bodyW * 0.46;
  const socketY = legH;
  const frontZ = bodyLen * 0.3;
  const rearZ = -bodyLen * 0.3;
  rig.legs = [
    leg(pivot, -hipX, socketY, frontZ, legH, 0.045 * S * (0.8 + age.pudgy * 0.3), c.body),
    leg(pivot, hipX, socketY, frontZ, legH, 0.045 * S * (0.8 + age.pudgy * 0.3), c.body),
    leg(pivot, -hipX * 1.05, socketY, rearZ, legH * 1.02, 0.055 * S, c.body),
    leg(pivot, hipX * 1.05, socketY, rearZ, legH * 1.02, 0.055 * S, c.body),
  ];
  if (sh.socks) {
    for (const limb of rig.legs) {
      part(limb, geo(new CapsuleGeometry(0.03 * S, legH * 0.28, 3, 6)), "#1a120c", 0, -legH * 0.72, 0, { shadow: false, map: false });
    }
  }
  const tailLen = (species.tail === "stub" ? 0.12 : 0.42) * S * (0.45 + (1 - age.fluff) * 0.7) * (sh.tail || 1);
  const tail = new Group();
  tail.position.set(0, bodyY + bodyH * 0.1, -bodyLen * 0.5);
  if (species.tail === "curl") {
    part(tail, geo(new TorusGeometry(bodyH * 0.28, bodyH * 0.12, 8, 14, Math.PI * 1.4)), c.body, 0, bodyH * 0.15, 0, { rot: [0, Math.PI / 2, 0], shadow: false });
    rig.tailBaseX = 0.2;
  } else if (species.tail === "brush") {
    const brush = part(tail, geo(new SphereGeometry(bodyH * 0.32, 12, 10)), c.body, 0, -bodyH * 0.1, -bodyLen * 0.35, { shadow: false });
    brush.scale.set(0.7, 0.7, 2.2);
    part(tail, geo(new SphereGeometry(bodyH * 0.16, 8, 6)), "#f4efe6", 0, -bodyH * 0.15, -bodyLen * 0.72, { shadow: false });
    rig.tailBaseX = 0.45;
  } else if (species.tail === "long") {
    const hair = part(tail, geo(new SphereGeometry(bodyH * 0.16, 10, 8)), c.dark, 0, -legH * 0.35, -0.04 * S, { shadow: false, map: false });
    hair.scale.set(0.55, 2.8, 0.45);
    rig.tailBaseX = 0.9;
  } else if (species.tail !== "none") {
    part(tail, geo(new CylinderGeometry(0.02 * S, 0.035 * S, tailLen, 5)), c.body, 0, tailLen * 0.2, -tailLen * 0.3, { rot: [0.8, 0, 0] });
    if (species.tail === "bush" || species.tail === "brush" || species.tail === "feather" || species.tail === "puff" || species.tail === "curl") {
      part(tail, geo(new SphereGeometry(0.08 * S * (1 + age.fluff), 8, 6)), species.tail === "brush" ? c.accent : c.body, 0, tailLen * 0.15, -tailLen * 0.55, { shadow: false });
    }
  }
  pivot.add(tail);
  rig.tailBaseX = rig.tailBaseX || (sh.tailUp ? 0.15 : 0.35);
  if (sh.bib) {
    const bib = part(body, geo(new SphereGeometry(bodyH * 0.28, 10, 8)), "#f7f4ee", 0, -bodyH * 0.05, bodyLen * 0.22, { shadow: false });
    bib.scale.set(0.7, 0.9, 0.45);
  }
  rig.tail = tail;
  rig.seatY = bodyY + bodyH * 0.62;
  rig.seatZ = -bodyLen * 0.02;
  rig.neckY = bodyY + bodyH * 0.4;
}

function buildBird(pivot, rig, species, age, S) {
  const c = species.colors;
  const owl = species.id === "owl";
  const bodyR = 0.28 * S * (age.round > 0.4 ? 1.15 : 0.85) * (owl ? 1.18 : 1);
  const bodyLen = 0.55 * S * (0.7 + age.wing * 0.5) * (owl ? 0.55 : 1);
  const body = new Group();
  const stand = 0.22 * S * (0.45 + age.leg) * (owl ? 0.72 : 1);
  body.position.set(0, stand + bodyR, 0);
  pivot.add(body);
  if (age.wing < 0.4) {
    part(body, geo(new SphereGeometry(bodyR, 12, 10)), c.accent, 0, 0, 0);
    addFluff(body, c.belly, bodyR * 1.05, 0, 1);
  } else {
    const torso = part(body, geo(new SphereGeometry(bodyR * 0.85, 20, 16)), c.body, 0, 0, 0);
    torso.scale.set(owl ? 0.75 : 0.78, owl ? 1.4 : 0.7, owl ? 0.72 : 1.45);
    const breast = part(body, geo(new SphereGeometry(bodyR * (owl ? 0.55 : 0.42), 12, 10)), c.belly, 0, -bodyR * 0.08, bodyR * (owl ? 0.15 : 0.35), { shadow: false });
    breast.scale.set(owl ? 1.05 : 0.8, owl ? 0.9 : 0.7, owl ? 0.7 : 1.1);
  }
  const headR = bodyR * (owl ? 0.72 : age.wing < 0.4 ? 0.62 : 0.42) * age.head;
  const neck = new Group();
  neck.position.set(0, bodyR * (owl ? 0.45 : 0.35), bodyLen * (owl ? 0.12 : 0.42));
  neck.rotation.x = owl ? -0.25 : -0.7;
  body.add(neck);
  if (!owl) part(neck, geo(new CapsuleGeometry(headR * 0.45, bodyR * 0.35, 4, 8)), age.wing < 0.4 ? c.accent : c.body, 0, bodyR * 0.28, 0);
  const head = new Group();
  head.position.set(0, owl ? bodyR * 0.28 : bodyR * 0.55, 0);
  head.rotation.x = owl ? 0.1 : 0.45;
  neck.add(head);
  rig.head = head;
  part(head, geo(new SphereGeometry(headR, 16, 12)), age.wing < 0.4 ? c.accent : c.body, 0, 0, 0);
  if (owl) {
    const disc = part(head, geo(new SphereGeometry(headR * 0.92, 14, 10)), "#c4a574", 0, -headR * 0.02, headR * 0.35, { shadow: false, map: false });
    disc.scale.set(1.15, 1.2, 0.35);
  }
  const beakLen = headR * (owl ? 0.28 : age.wing < 0.45 ? 0.35 : 0.9);
  const beak = part(head, geo(new ConeGeometry(headR * (owl ? 0.1 : 0.22), beakLen, 6)), owl ? "#2c2926" : "#e0a040", 0, -headR * (owl ? 0.2 : 0.05), headR * (owl ? 0.7 : 0.85));
  beak.rotation.x = Math.PI / 2;
  eyePair(head, headR * (owl ? 0.38 : 0.4), headR * (owl ? 0.08 : 0.1), headR * (owl ? 0.55 : 0.7), headR * (owl ? 0.28 : 0.22) * age.eye, owl ? "#1a120c" : c.dark);
  if (species.ears === "tuft") rig.ears = ears(head, species, age, S, headR);
  const wingLen = bodyLen * (0.35 + age.wing * 1.5) * (owl ? 0.85 : species.id === "eagle" ? 1.45 : 1);
  const wingW = bodyR * (0.35 + age.wing * 0.8);
  for (const side of [-1, 1]) {
    const wing = new Group();
    wing.position.set(side * bodyR * 0.7, 0, 0);
    const vane = part(wing, geo(new SphereGeometry(wingLen * 0.42, 12, 8)), c.dark, side * wingW * 0.35, 0, -wingLen * 0.2, { shadow: false });
    vane.scale.set(0.22, 0.06, 1);
    if (age.wing > 0.5) {
      const tip = part(wing, geo(new SphereGeometry(wingLen * 0.28, 10, 8)), c.accent, side * wingW * 0.7, 0.02, -wingLen * 0.35, { shadow: false });
      tip.scale.set(0.16, 0.05, 1);
    }
    pivot.add(wing);
    wing.position.y = body.position.y;
    rig.wings.push(wing);
  }
  const tail = new Group();
  tail.position.set(0, body.position.y, -bodyLen * 0.7);
  const feathers = (age.wing < 0.4 ? 0.12 * S : 0.28 * S * age.wing) * (owl ? 0.45 : 1);
  part(tail, geo(new SphereGeometry(feathers * 0.55, 10, 8)), c.accent, 0, 0, -feathers * 0.45, { shadow: false, scale: [1.6, 0.12, 1] });
  pivot.add(tail);
  rig.tail = tail;
  rig.legs = [
    leg(pivot, -0.08 * S, stand, 0.05 * S, stand, 0.02 * S, c.dark),
    leg(pivot, 0.08 * S, stand, 0.05 * S, stand, 0.02 * S, c.dark),
  ];
  rig.seatY = stand + bodyR * 1.05;
  rig.seatZ = -bodyLen * 0.05;
  rig.neckY = stand + bodyR;
}

function buildApe(pivot, rig, species, age, S) {
  const c = species.colors;
  const legH = 0.38 * S * (0.55 + age.leg * 0.45);
  const torsoH = 0.55 * S * age.body * (age.round > 0.5 ? 0.8 : 1);
  const torsoW = 0.42 * S * species.bulk * age.pudgy;
  const hipY = legH;
  const torso = part(pivot, geo(new SphereGeometry(torsoW * 0.48, 18, 14)), c.body, 0, hipY + torsoH * 0.5, 0);
  torso.scale.set(1.15, 1.35, 0.78);
  const pelvis = part(pivot, geo(new SphereGeometry(torsoW * 0.38, 12, 10)), c.dark, 0, hipY + torsoH * 0.18, -0.02 * S);
  pelvis.scale.set(1.2, 0.7, 0.85);
  for (const side of [-1, 1]) {
    const deltoid = part(pivot, geo(new SphereGeometry(torsoW * 0.22, 10, 8)), c.body, side * torsoW * 0.62, hipY + torsoH * 0.78, 0.02 * S);
    deltoid.scale.set(1, 0.75, 0.8);
  }
  const headR = 0.22 * S * age.head;
  const head = new Group();
  head.position.set(0, hipY + torsoH * 0.95, 0.04 * S);
  pivot.add(head);
  rig.head = head;
  part(head, geo(new SphereGeometry(headR, 18, 14)), c.body, 0, 0, 0);
  const brow = part(head, geo(new SphereGeometry(headR * 0.72, 12, 10)), c.dark, 0, headR * 0.15, headR * 0.15, { shadow: false });
  brow.scale.set(1.1, 0.35, 0.45);
  const muzzle = part(head, geo(new SphereGeometry(headR * 0.42, 12, 10)), c.belly, 0, -headR * 0.2, headR * 0.72, { shadow: false });
  muzzle.scale.set(1.1, 0.7, 0.8);
  part(head, geo(new SphereGeometry(headR * 0.08, 8, 6)), "#2a211c", 0, -headR * 0.18, headR * 1.05, { shadow: false, map: false, roughness: 0.3 });
  eyePair(head, headR * 0.32, headR * 0.05, headR * 0.75, headR * 0.14 * age.eye, c.dark);
  rig.ears = ears(head, species, age, S, headR * 0.7);
  const armLen = torsoH * (age.round > 0.5 ? 0.7 : 1.15);
  for (const side of [-1, 1]) {
    const arm = new Group();
    arm.position.set(side * torsoW * 0.7, hipY + torsoH * 0.75, 0.05 * S);
    part(arm, geo(new CapsuleGeometry(0.055 * S, Math.max(0.05, armLen * 0.72), 4, 8)), c.dark, 0, -armLen * 0.45, 0);
    part(arm, geo(new SphereGeometry(0.07 * S, 8, 6)), c.belly, 0, -armLen * 0.95, 0.02 * S, { shadow: false });
    pivot.add(arm);
    rig.legs.push(arm);
  }
  rig.legs.push(
    leg(pivot, -torsoW * 0.28, hipY, 0, legH, 0.07 * S, c.dark),
    leg(pivot, torsoW * 0.28, hipY, 0, legH, 0.07 * S, c.dark),
  );
  rig.seatY = hipY + torsoH * 0.72;
  rig.seatZ = -0.02 * S;
  rig.neckY = hipY + torsoH * 0.8;
}

function buildElephant(pivot, rig, species, age, S) {
  const c = species.colors;
  const legH = 0.55 * S * age.leg;
  const bodyLen = 1.05 * S * age.body;
  const bodyH = 0.62 * S * age.pudgy;
  const bodyW = 0.58 * S * age.pudgy;
  const bodyY = legH + bodyH * 0.42;
  const barrel = part(pivot, geo(new SphereGeometry(bodyH * 0.5, 20, 16)), c.body, 0, bodyY, 0);
  barrel.scale.set((bodyW / bodyH) * 1.05, 0.88, bodyLen / bodyH);
  const shoulder = part(pivot, geo(new SphereGeometry(bodyH * 0.32, 12, 10)), c.body, 0, bodyY - bodyH * 0.05, bodyLen * 0.28);
  shoulder.scale.set(bodyW / bodyH, 0.7, 0.7);
  const rump = part(pivot, geo(new SphereGeometry(bodyH * 0.34, 12, 10)), c.body, 0, bodyY, -bodyLen * 0.32);
  rump.scale.set(bodyW / bodyH * 0.9, 0.75, 0.7);
  addFluff(pivot, c.accent, bodyH * 0.5, bodyY, age.fluff);
  const headR = 0.32 * S * age.head;
  const head = new Group();
  head.position.set(0, bodyY + bodyH * 0.02, bodyLen * 0.32);
  pivot.add(head);
  rig.head = head;
  part(head, geo(new SphereGeometry(headR, 18, 14)), c.body, 0, 0, 0);
  eyePair(head, headR * 0.4, headR * 0.05, headR * 0.75, headR * 0.1 * age.eye, c.dark);
  rig.ears = ears(head, species, age, S, headR);
  const segments = age.trunk < 0.4 ? 2 : age.trunk < 0.8 ? 4 : 5;
  let parent = head;
  for (let i = 0; i < segments; i++) {
    const seg = new Group();
    const len = headR * (0.45 - i * 0.04) * (0.55 + age.trunk);
    seg.position.set(0, -headR * 0.15 - i * 0.02, headR * 0.7);
    if (i > 0) seg.position.set(0, -len * 0.85, 0);
    part(seg, geo(new CylinderGeometry(0.05 * S * (1 - i * 0.12), 0.045 * S, len, 6)), c.body, 0, -len * 0.4, 0);
    parent.add(seg);
    rig.trunk.push(seg);
    parent = seg;
  }
  if (age.tusk > 0.4) {
    for (const side of [-1, 1]) {
      const tusk = part(head, geo(new ConeGeometry(0.035 * S, headR * 0.9 * age.tusk, 6)), "#f4f0e6", side * headR * 0.28, -headR * 0.25, headR * 0.7);
      tusk.rotation.x = 0.8;
    }
  }
  const hipX = bodyW * 0.38;
  const hipZ = bodyLen * 0.28;
  rig.legs = [
    leg(pivot, -hipX, legH, hipZ, legH, 0.09 * S, c.body),
    leg(pivot, hipX, legH, hipZ, legH, 0.09 * S, c.body),
    leg(pivot, -hipX, legH, -hipZ, legH, 0.09 * S, c.body),
    leg(pivot, hipX, legH, -hipZ, legH, 0.09 * S, c.body),
  ];
  const tail = new Group();
  tail.position.set(0, bodyY, -bodyLen * 0.45);
  part(tail, geo(new CylinderGeometry(0.015 * S, 0.02 * S, 0.25 * S, 4)), c.dark, 0, -0.05, -0.12);
  pivot.add(tail);
  rig.tail = tail;
  rig.seatY = bodyY + bodyH * 0.42;
  rig.seatZ = -bodyLen * 0.05;
  rig.neckY = bodyY + bodyH * 0.2;
}

export function buildPerson() {
  const group = new Group();
  const skin = "#f0c7a0";
  const shirt = "#3d7ea6";
  const pants = "#2c3b48";
  const hair = "#6b4632";
  const pack = "#d7b15a";
  const torso = part(group, geo(new BoxGeometry(0.38, 0.42, 0.22)), shirt, 0, 0.18, 0);
  const packMesh = part(group, geo(new BoxGeometry(0.28, 0.32, 0.12)), pack, 0, 0.18, -0.16);
  const head = new Group();
  head.position.set(0, 0.52, 0);
  part(head, geo(new SphereGeometry(0.16, 12, 10)), skin, 0, 0, 0);
  part(head, geo(new SphereGeometry(0.155, 10, 8)), hair, 0, 0.05, -0.02, { shadow: false });
  eyePair(head, 0.05, 0.02, 0.12, 0.028, "#2a241c");
  group.add(head);
  const armL = new Group();
  const armR = new Group();
  armL.position.set(-0.26, 0.28, 0);
  armR.position.set(0.26, 0.28, 0);
  part(armL, geo(new CylinderGeometry(0.05, 0.05, 0.34, 6)), shirt, 0, -0.16, 0);
  part(armR, geo(new CylinderGeometry(0.05, 0.05, 0.34, 6)), shirt, 0, -0.16, 0);
  group.add(armL, armR);
  const legL = new Group();
  const legR = new Group();
  legL.position.set(-0.1, -0.08, 0);
  legR.position.set(0.1, -0.08, 0);
  part(legL, geo(new CylinderGeometry(0.07, 0.07, 0.4, 6)), pants, 0, -0.2, 0);
  part(legR, geo(new CylinderGeometry(0.07, 0.07, 0.4, 6)), pants, 0, -0.2, 0);
  part(legL, geo(new BoxGeometry(0.1, 0.05, 0.16)), "#4a3428", 0, -0.42, 0.03, { shadow: false });
  part(legR, geo(new BoxGeometry(0.1, 0.05, 0.16)), "#4a3428", 0, -0.42, 0.03, { shadow: false });
  group.add(legL, legR);
  const rig = { head, armL, armR, legL, legR, torso, pack: packMesh, sitting: false, phase: 0 };
  return {
    group,
    rig,
    setSitting(sitting) {
      rig.sitting = sitting;
      if (sitting) {
        legL.rotation.x = -1.15;
        legR.rotation.x = -1.15;
        legL.position.z = 0.08;
        legR.position.z = 0.08;
        armL.rotation.x = -0.4;
        armR.rotation.x = -0.4;
        torso.rotation.x = 0.12;
      } else {
        legL.rotation.x = 0;
        legR.rotation.x = 0;
        legL.position.z = 0;
        legR.position.z = 0;
        armL.rotation.x = 0;
        armR.rotation.x = 0;
        torso.rotation.x = 0;
      }
    },
    animate(dt, moving) {
      if (rig.sitting) return;
      rig.phase += dt * (moving ? 9 : 2);
      const s = moving ? 0.55 : 0.04;
      legL.rotation.x = Math.sin(rig.phase) * s;
      legR.rotation.x = Math.sin(rig.phase + Math.PI) * s;
      armL.rotation.x = Math.sin(rig.phase + Math.PI) * s * 0.7;
      armR.rotation.x = Math.sin(rig.phase) * s * 0.7;
    },
  };
}

export function buildTree(kind, scale) {
  const g = new Group();
  const trunkH = (kind === "cactus" ? 1.1 : 1.3) * scale;
  const trunkC = kind === "pine" ? "#6b4a32" : kind === "palm" ? "#9a7048" : "#8a5a3a";
  part(g, geo(new CylinderGeometry(0.12 * scale, 0.16 * scale, trunkH, 6)), trunkC, 0, trunkH / 2, 0);
  if (kind === "pine") {
    part(g, geo(new ConeGeometry(0.9 * scale, 1.6 * scale, 7)), "#3f7d45", 0, trunkH + 0.45 * scale, 0);
    part(g, geo(new ConeGeometry(0.7 * scale, 1.2 * scale, 7)), "#5c9a52", 0, trunkH + 1.05 * scale, 0);
  } else if (kind === "cactus") {
    part(g, geo(new CylinderGeometry(0.22 * scale, 0.24 * scale, 1.4 * scale, 7)), "#7ea15a", 0, 0.8 * scale, 0);
    part(g, geo(new CylinderGeometry(0.1 * scale, 0.1 * scale, 0.5 * scale, 5)), "#7ea15a", 0.28 * scale, 0.95 * scale, 0, { rot: [0, 0, Math.PI / 2] });
  } else if (kind === "palm") {
    for (let i = 0; i < 5; i++) {
      const frond = part(g, geo(new BoxGeometry(0.12 * scale, 0.04 * scale, 0.9 * scale)), "#3f8f4e", 0, trunkH, 0.3 * scale);
      frond.rotation.y = (i / 5) * Math.PI * 2;
      frond.rotation.x = 0.6;
    }
  } else {
    const leaf = part(g, geo(new SphereGeometry(0.85 * scale, 8, 7)), kind === "oak" ? "#6ea85a" : "#7fb56a", 0, trunkH + 0.45 * scale, 0);
    leaf.scale.set(1, 0.8, 1);
    part(g, geo(new SphereGeometry(0.45 * scale, 7, 6)), "#8fc56e", 0.3 * scale, trunkH + 0.7 * scale, 0.1 * scale, { shadow: false });
  }
  return g;
}

export function buildButterfly() {
  const g = new Group();
  part(g, geo(new BoxGeometry(0.16, 0.01, 0.1)), "#f2d36b", -0.08, 0.2, 0, { shadow: false });
  part(g, geo(new BoxGeometry(0.16, 0.01, 0.1)), "#f2d36b", 0.08, 0.2, 0, { shadow: false });
  part(g, geo(new SphereGeometry(0.03, 6, 5)), "#3a342c", 0, 0.2, 0, { shadow: false });
  return g;
}
