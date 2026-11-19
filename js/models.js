import { Box3, Color, ConeGeometry, Group, Mesh, MeshStandardMaterial, TorusGeometry, Vector3 } from "../vendor/three.module.js";
import { GLTFLoader } from "../vendor/GLTFLoader.js";

const FILES = {
  shiba: "shiba_inu.glb",
  retriever: "shiba_inu.glb",
  wolf: "wolf.glb",
  fox: "fox.glb",
  cat: "cat.glb",
  rabbit: "sheep.glb",
  deer: "giraffe.glb",
  bear: "bear.glb",
  horse: "horse.glb",
  zebra: "zebra.glb",
  lion: "lion.glb",
  tiger: "tiger.glb",
  elephant: "bear.glb",
  camel: "horse.glb",
  gorilla: "gorilla.glb",
  goat: "pig.glb",
  eagle: "eagle.glb",
  owl: "owl.glb",
  aurora: "hawk.glb",
};

const templates = new Map();
let ready = false;

export function preloadAnimals() {
  const loader = new GLTFLoader();
  const files = [...new Set(Object.values(FILES))];
  return Promise.all(files.map((file) => loader.loadAsync(`models/${file}`).then((gltf) => {
    const root = gltf.scene;
    root.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    const stand = new Group();
    stand.rotation.x = -Math.PI / 2;
    const face = new Group();
    face.rotation.y = -Math.PI / 2;
    face.add(stand);
    stand.add(root);
    const box = new Box3().setFromObject(face);
    const size = new Vector3();
    box.getSize(size);
    const longest = Math.max(size.x, size.y, size.z, 0.001);
    const fit = 1.35 / longest;
    face.scale.multiplyScalar(fit);
    face.position.y -= box.min.y * fit;
    templates.set(file, face);
  }))).then(() => {
    ready = true;
  });
}

export function animalsReady() {
  return ready;
}

export function takeModel(speciesId, stage = "adult") {
  const file = FILES[speciesId];
  const src = file && templates.get(file);
  if (!src) return null;
  const clone = src.clone(true);
  const group = new Group();
  const pivot = new Group();
  group.add(pivot);
  pivot.add(clone);
  if (stage === "alpha") dressAlpha(pivot);
  const box = new Box3().setFromObject(group);
  const seatY = Math.max(0.45, (box.max.y - box.min.y) * 0.62);
  return {
    group,
    pivot,
    seat: { x: 0, y: seatY, z: 0 },
    phase: Math.random() * 4,
    animate(dt, motion) {
      this.phase += dt * (motion.moving ? 8 : 2);
      const bob = motion.moving ? Math.abs(Math.sin(this.phase)) * 0.08 : Math.sin(this.phase) * 0.02;
      pivot.position.y = bob;
      pivot.rotation.z = motion.moving ? Math.sin(this.phase) * 0.04 : 0;
      const ring = pivot.getObjectByName("alpha-ring");
      if (ring) ring.rotation.z += dt * 1.4;
    },
    dispose() {
      if (stage !== "alpha") return;
      pivot.traverse((obj) => {
        if (obj.isMesh && obj.userData.alphaMat && obj.material) obj.material.dispose();
      });
    },
  };
}

function dressAlpha(pivot) {
  pivot.scale.multiplyScalar(1.18);
  pivot.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    const next = mats.map((material) => {
      const copy = material.clone();
      if (copy.color) copy.color.offsetHSL(0.02, 0.15, -0.22);
      copy.emissive = new Color("#ff9a2e");
      copy.emissiveIntensity = 0.45;
      copy.roughness = Math.min(copy.roughness ?? 0.6, 0.38);
      copy.metalness = Math.max(copy.metalness ?? 0, 0.28);
      return copy;
    });
    obj.material = Array.isArray(obj.material) ? next : next[0];
    obj.userData.alphaMat = true;
  });
  const box = new Box3().setFromObject(pivot);
  const crownY = box.max.y + 0.02;
  const crown = new Group();
  crown.name = "alpha-crown";
  for (let i = 0; i < 5; i++) {
    const spike = new Mesh(
      new ConeGeometry(0.035, 0.22, 5),
      new MeshStandardMaterial({ color: "#f2c14e", emissive: "#ffb15a", emissiveIntensity: 0.8, metalness: 0.4, roughness: 0.3 }),
    );
    spike.position.set((i - 2) * 0.07, crownY, 0.02);
    spike.rotation.z = (i - 2) * 0.18;
    crown.add(spike);
  }
  const ring = new Mesh(
    new TorusGeometry(0.42, 0.018, 8, 24),
    new MeshStandardMaterial({ color: "#ffe08a", emissive: "#ffcf70", emissiveIntensity: 1, metalness: 0.5, roughness: 0.25 }),
  );
  ring.name = "alpha-ring";
  ring.position.y = (box.min.y + box.max.y) * 0.45;
  ring.rotation.x = Math.PI / 2;
  crown.add(ring);
  pivot.add(crown);
}
