import { Box3, Group, Vector3 } from "../vendor/three.module.js";
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
    const box = new Box3().setFromObject(root);
    const size = new Vector3();
    box.getSize(size);
    const longest = Math.max(size.x, size.y, size.z, 0.001);
    const fit = 1.35 / longest;
    root.scale.multiplyScalar(fit);
    root.position.y -= box.min.y * fit;
    root.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    templates.set(file, root);
  }))).then(() => {
    ready = true;
  });
}

export function animalsReady() {
  return ready;
}

export function takeModel(speciesId) {
  const file = FILES[speciesId];
  const src = file && templates.get(file);
  if (!src) return null;
  const clone = src.clone(true);
  const group = new Group();
  const pivot = new Group();
  group.add(pivot);
  pivot.add(clone);
  const box = new Box3().setFromObject(group);
  const seatY = Math.max(0.45, (box.max.y - box.min.y) * 0.62);
  return {
    group,
    pivot,
    seat: { x: 0, y: seatY, z: 0 },
    phase: Math.random() * 4,
    animate(dt, motion) {
      this.phase += dt * (motion.moving ? 8 : 2);
      pivot.position.y = motion.moving ? Math.abs(Math.sin(this.phase)) * 0.08 : Math.sin(this.phase) * 0.02;
      pivot.rotation.z = motion.moving ? Math.sin(this.phase) * 0.04 : 0;
    },
    dispose() {},
  };
}
