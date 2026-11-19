import {
  BoxGeometry,
  BufferAttribute,
  CanvasTexture,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Fog,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
} from "../vendor/three.module.js";
import { buildButterfly, buildTree } from "./meshes.js";

export const CAMP = { x: -9, z: 16 };
export const SHOP = { x: -9, z: 11.5 };
export const ISLAND = { x: 12, z: 118, y: 27 };
export const PEAK = { x: -4, z: -104 };
export const OASIS = { x: 130, z: 10 };
export const MOUNTAIN_GATE = -82;

export function heightAt(x, z) {
  let h = Math.sin(x * 0.05) * Math.cos(z * 0.045) * 0.65;
  h += Math.sin((x + z) * 0.02) * 1.05;
  if (z < -40) {
    const t = Math.min(1, (-z - 40) / 55);
    h += t * t * 14;
  }
  if (x > 60) h += Math.sin(x * 0.12) * Math.cos(z * 0.08) * 0.5;
  if (z > 72) h -= Math.min(5, (z - 72) * 0.16);
  if (Math.abs(x) < 16 && z > 86 && z < 97) {
    const u = (z - 86) / 11;
    h -= Math.sin(Math.min(1, Math.max(0, u)) * Math.PI) * 8;
  }
  const river = Math.exp(-((x - 32) ** 2) / 28);
  if (z > -18 && z < 46) h -= river * 1.45;
  return h;
}

export function islandY(x, z) {
  const d = Math.hypot(x - ISLAND.x, z - ISLAND.z);
  if (d > 8) return null;
  return ISLAND.y + Math.cos((d / 8) * Math.PI * 0.5) * 0.45;
}

export function inChasm(x, z) {
  return Math.abs(x) < 16 && z > 86 && z < 97;
}

export function regionAt(x, z) {
  if (z < -48) return "mountains";
  if (z > 62) return "canyon";
  if (x > 68) return "desert";
  if (x < -48) return "meadow";
  return "forest";
}

export function regionName(x, z) {
  if (regionAt(x, z) === "desert" && x > 104) return "Crystal Desert";
  if (z < MOUNTAIN_GATE) return "High Ledge";
  if (z > 100) return "Sky Reach";
  return {
    forest: "Greenwood Forest",
    meadow: "Sun Meadow",
    desert: "Amber Edge",
    mountains: "Greyhorn Trail",
    canyon: "The Rift",
  }[regionAt(x, z)];
}

export function collideCircle(x, z, radius, colliders) {
  for (let pass = 0; pass < 2; pass++) {
    for (const c of colliders) {
      if (c.disabled) continue;
      const dx = x - c.x;
      const dz = z - c.z;
      const min = radius + c.r;
      const d2 = dx * dx + dz * dz;
      if (d2 < min * min && d2 > 0.00001) {
        const d = Math.sqrt(d2);
        const push = (min - d) / d;
        x += dx * push;
        z += dz * push;
      }
    }
  }
  return { x, z };
}

function hash(n) {
  let x = Math.imul(n, 374761393);
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

function tint(region, y, river) {
  if (river > 0.45) return new Color("#c4b48a");
  if (region === "desert") return new Color("#e4d0a0");
  if (region === "meadow") return new Color("#d5e7a4");
  if (region === "mountains") return new Color("#b7c4a4").lerp(new Color("#9aa196"), Math.min(1, y / 12));
  if (region === "canyon") return new Color("#d2c0a4");
  return new Color("#c5dd8e");
}

export function createWorld(scene) {
  scene.fog = new Fog("#c5d7c8", 28, 120);
  scene.background = new Color("#9ec8e6");

  const size = 250;
  const seg = 110;
  const geo = new PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = heightAt(x, z);
    pos.setY(i, y);
    const river = Math.exp(-((x - 32) ** 2) / 28);
    const color = tint(regionAt(x, z), y, z > -18 && z < 46 ? river : 0);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geo.setAttribute("color", new BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const grass = document.createElement("canvas");
  grass.width = 128;
  grass.height = 128;
  const gg = grass.getContext("2d");
  gg.fillStyle = "#d7e7b0";
  gg.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 1400; i++) {
    const shade = 90 + Math.floor(Math.random() * 80);
    gg.fillStyle = `rgba(${shade - 20},${shade + 30},${shade - 30},0.35)`;
    gg.fillRect(Math.random() * 128, Math.random() * 128, 1, 3 + Math.random() * 4);
  }
  const grassMap = new CanvasTexture(grass);
  grassMap.colorSpace = SRGBColorSpace;
  grassMap.wrapS = RepeatWrapping;
  grassMap.wrapT = RepeatWrapping;
  grassMap.repeat.set(48, 48);
  const terrain = new Mesh(
    geo,
    new MeshStandardMaterial({ map: grassMap, vertexColors: true, roughness: 0.92, metalness: 0 }),
  );
  terrain.receiveShadow = true;
  scene.add(terrain);

  const path = new PlaneGeometry(6.5, 52, 1, 24);
  path.rotateX(-Math.PI / 2);
  const pp = path.attributes.position;
  for (let i = 0; i < pp.count; i++) {
    const x = pp.getX(i);
    const z = pp.getZ(i) + 4;
    pp.setY(i, heightAt(x, z) + 0.06);
  }
  path.computeVertexNormals();
  const pathMesh = new Mesh(path, new MeshStandardMaterial({ color: "#f3ead2", roughness: 1 }));
  pathMesh.position.z = 4;
  pathMesh.receiveShadow = true;
  scene.add(pathMesh);

  const water = new Mesh(
    new PlaneGeometry(7.5, 62),
    new MeshStandardMaterial({ color: "#3e8ea3", roughness: 0.08, metalness: 0.18, transparent: true, opacity: 0.86 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(32, -0.15, 14);
  scene.add(water);

  const oasis = new Mesh(
    new CircleGeometry(4.2, 20),
    new MeshStandardMaterial({ color: "#7eb8c8", roughness: 0.18, metalness: 0.05 }),
  );
  oasis.rotation.x = -Math.PI / 2;
  oasis.position.set(OASIS.x, heightAt(OASIS.x, OASIS.z) + 0.08, OASIS.z);
  scene.add(oasis);

  const island = new Mesh(
    new CylinderGeometry(8, 7.2, 1.4, 8),
    new MeshStandardMaterial({ color: "#dfe8c8", roughness: 0.9 }),
  );
  island.position.set(ISLAND.x, ISLAND.y - 0.4, ISLAND.z);
  island.receiveShadow = true;
  island.castShadow = true;
  scene.add(island);
  const islandTop = new Mesh(
    new CylinderGeometry(6.4, 6.4, 0.2, 8),
    new MeshStandardMaterial({ color: "#b7d48a", roughness: 1 }),
  );
  islandTop.position.set(ISLAND.x, ISLAND.y + 0.2, ISLAND.z);
  scene.add(islandTop);

  const colliders = [];
  const obstacles = [];
  const forage = [];
  const briars = [];

  function addCollider(x, z, r) {
    colliders.push({ x, z, r, disabled: false });
    return colliders[colliders.length - 1];
  }

  const obstacleDefs = [
    { id: "log1", kind: "log", x: 4, z: -26, r: 1.15 },
    { id: "log2", kind: "log", x: -22, z: -28, r: 1.1 },
    { id: "rock1", kind: "boulder", x: -44, z: -38, r: 1.35 },
    { id: "rock2", kind: "boulder", x: -40.7, z: -38, r: 1.35 },
  ];
  for (const def of obstacleDefs) {
    const mesh = new Group();
    const y = heightAt(def.x, def.z);
    if (def.kind === "log") {
      const log = new Mesh(
        new CylinderGeometry(0.22, 0.26, 2.4, 7),
        new MeshStandardMaterial({ color: "#8a5a3a", roughness: 0.9 }),
      );
      log.rotation.z = Math.PI / 2;
      log.castShadow = true;
      mesh.add(log);
    } else {
      const rock = new Mesh(
        new SphereGeometry(def.r * 0.85, 7, 6),
        new MeshStandardMaterial({ color: "#9aa196", roughness: 0.95 }),
      );
      rock.scale.set(1.1, 0.8, 1);
      rock.castShadow = true;
      mesh.add(rock);
    }
    mesh.position.set(def.x, y + 0.35, def.z);
    scene.add(mesh);
    const collider = addCollider(def.x, def.z, def.r);
    obstacles.push({ ...def, mesh, collider, moved: false });
  }

  const briarDefs = [
    { id: "br1", x: -14, z: -18 },
    { id: "br2", x: 8, z: -14 },
    { id: "br3", x: -6, z: -36 },
    { id: "br4", x: 18, z: -8 },
  ];
  for (const def of briarDefs) {
    const mesh = new Group();
    for (let i = 0; i < 4; i++) {
      const cane = new Mesh(
        new ConeGeometry(0.08, 0.7 + (i % 2) * 0.2, 5),
        new MeshStandardMaterial({ color: i % 2 ? "#5c6b3a" : "#6e4a62", roughness: 0.8 }),
      );
      cane.position.set((i - 1.5) * 0.18, 0.35, (i % 2) * 0.12);
      cane.rotation.z = (i - 1.5) * 0.3;
      mesh.add(cane);
    }
    mesh.position.set(def.x, heightAt(def.x, def.z), def.z);
    scene.add(mesh);
    briars.push({ ...def, mesh, hp: 3, cut: false });
    addCollider(def.x, def.z, 0.55);
  }

  const forageDefs = [
    { id: "f1", food: "fruit", x: 6, z: 8 },
    { id: "f2", food: "meat", x: -16, z: 4 },
    { id: "f3", food: "fish", x: 28, z: 6 },
    { id: "f4", food: "greens", x: -40, z: 8 },
    { id: "f5", food: "seeds", x: 18, z: -48 },
    { id: "f6", food: "fruit", x: 70, z: 4 },
    { id: "f7", food: "greens", x: -70, z: -6 },
    { id: "f8", food: "meat", x: -4, z: -20 },
    { id: "f9", food: "fish", x: 36, z: -8 },
    { id: "f10", food: "seeds", x: 20, z: 70 },
    { id: "f11", food: "fruit", x: -42.4, z: -42 },
    { id: "f12", food: "greens", x: -12, z: -60 },
    { id: "f13", food: "fruit", x: 96, z: 14 },
    { id: "f14", food: "meat", x: 40, z: -20 },
  ];
  const foodColor = { meat: "#c46a5a", fish: "#7eb0c8", greens: "#6aaa55", seeds: "#e2c56a", fruit: "#d4543c" };
  for (const def of forageDefs) {
    const mesh = new Mesh(
      new SphereGeometry(0.16, 8, 6),
      new MeshStandardMaterial({ color: foodColor[def.food], roughness: 0.5 }),
    );
    mesh.position.set(def.x, heightAt(def.x, def.z) + 0.28, def.z);
    mesh.castShadow = true;
    scene.add(mesh);
    forage.push({ ...def, mesh });
  }

  let treeCount = 0;
  for (let i = 0; i < 90; i++) {
    const x = (hash(i * 3 + 1) - 0.5) * 220;
    const z = (hash(i * 3 + 2) - 0.5) * 220;
    if (Math.abs(x) < 6 && z > -20 && z < 36) continue;
    if (Math.hypot(x - CAMP.x, z - CAMP.z) < 7) continue;
    if (inChasm(x, z)) continue;
    if (Math.hypot(x - ISLAND.x, z - ISLAND.z) < 12 && z > 90) continue;
    const region = regionAt(x, z);
    let kind = "oak";
    if (region === "desert") kind = hash(i) > 0.55 ? "cactus" : "palm";
    else if (region === "mountains") kind = "pine";
    else if (region === "meadow") kind = hash(i) > 0.5 ? "round" : "oak";
    const scale = 0.85 + hash(i * 7) * 0.7;
    const tree = buildTree(kind, scale);
    tree.position.set(x, heightAt(x, z), z);
    scene.add(tree);
    addCollider(x, z, 0.55 * scale);
    treeCount++;
  }

  for (let i = 0; i < 4; i++) {
    const tree = buildTree("palm", 1.1);
    const a = (i / 4) * Math.PI * 2;
    const x = OASIS.x + Math.cos(a) * 5.5;
    const z = OASIS.z + Math.sin(a) * 5.5;
    tree.position.set(x, heightAt(x, z), z);
    scene.add(tree);
  }

  const nestGroup = new Group();
  for (let i = 0; i < 8; i++) {
    const twig = new Mesh(
      new BoxGeometry(0.5, 0.06, 0.08),
      new MeshStandardMaterial({ color: "#8a6244" }),
    );
    twig.position.set(Math.cos(i) * 0.35, 0.05, Math.sin(i) * 0.35);
    twig.rotation.y = i;
    nestGroup.add(twig);
  }
  nestGroup.position.set(24, heightAt(24, -64) + 0.05, -64);
  scene.add(nestGroup);

  const flowers = new InstancedMesh(
    new ConeGeometry(0.08, 0.22, 5),
    new MeshStandardMaterial({ color: "#f2b7c6", roughness: 0.7 }),
    80,
  );
  const dummy = new Object3D();
  for (let i = 0; i < 80; i++) {
    const x = (hash(i + 400) - 0.5) * 80;
    const z = (hash(i + 800) - 0.5) * 70;
    dummy.position.set(x, heightAt(x, z), z);
    dummy.scale.setScalar(0.8 + hash(i) * 0.8);
    dummy.updateMatrix();
    flowers.setMatrixAt(i, dummy.matrix);
  }
  flowers.instanceMatrix.needsUpdate = true;
  scene.add(flowers);

  const camp = new Group();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const post = new Mesh(
      new BoxGeometry(0.12, 0.45, 0.12),
      new MeshStandardMaterial({ color: "#efe6d4" }),
    );
    post.position.set(Math.cos(a) * 4.3, 0.22, Math.sin(a) * 3.3);
    camp.add(post);
  }
  const bowl = new Mesh(
    new CylinderGeometry(0.28, 0.22, 0.12, 8),
    new MeshStandardMaterial({ color: "#d7b15a" }),
  );
  bowl.position.set(1.2, 0.08, 0.4);
  camp.add(bowl);
  camp.position.set(CAMP.x, heightAt(CAMP.x, CAMP.z), CAMP.z);
  scene.add(camp);

  const sign = new Group();
  const board = new Mesh(new BoxGeometry(1.1, 0.7, 0.08), new MeshStandardMaterial({ color: "#f7f1e4" }));
  const post = new Mesh(new BoxGeometry(0.1, 1.1, 0.1), new MeshStandardMaterial({ color: "#8a5a3a" }));
  board.position.y = 1.15;
  post.position.y = 0.55;
  sign.add(board, post);
  sign.position.set(SHOP.x, heightAt(SHOP.x, SHOP.z), SHOP.z);
  scene.add(sign);

  const butterflies = [];
  const spots = [
    { id: "b1", x: -6, z: 24 },
    { id: "b2", x: 8, z: 14 },
    { id: "b3", x: -20, z: 6 },
    { id: "b4", x: 16, z: -6 },
    { id: "b5", x: -40, z: 16 },
  ];
  for (const spot of spots) {
    const mesh = buildButterfly();
    mesh.position.set(spot.x, heightAt(spot.x, spot.z) + 0.8, spot.z);
    scene.add(mesh);
    butterflies.push({ ...spot, mesh, phase: Math.random() * 6, baseX: spot.x, baseZ: spot.z });
  }

  const clouds = [];
  for (let i = 0; i < 7; i++) {
    const cloud = new Mesh(
      new SphereGeometry(4 + hash(i) * 3, 8, 6),
      new MeshStandardMaterial({ color: "#f7fbff", roughness: 1 }),
    );
    cloud.position.set((hash(i + 20) - 0.5) * 160, 28 + hash(i + 30) * 8, (hash(i + 40) - 0.5) * 160);
    cloud.scale.set(1.8, 0.45, 1);
    scene.add(cloud);
    clouds.push(cloud);
  }

  const markers = [
    { id: "camp", name: "Camp", x: CAMP.x, z: CAMP.z },
    { id: "shop", name: "Camp shop", x: SHOP.x, z: SHOP.z },
    { id: "perch", name: "Sky Perch", x: ISLAND.x, z: ISLAND.z, y: ISLAND.y + 1.5 },
    { id: "peak", name: "High Ledge", x: PEAK.x, z: PEAK.z },
    { id: "oasis", name: "Crystal Oasis", x: OASIS.x, z: OASIS.z },
    { id: "gate", name: "High trail", x: 0, z: -78 },
    { id: "dunes", name: "Deep dunes", x: 104, z: 8 },
    { id: "rift", name: "The Rift", x: 0, z: 80 },
  ];

  return { colliders, obstacles, forage, briars, butterflies, clouds, markers, treeCount };
}

