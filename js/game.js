import {
  ACESFilmicToneMapping,
  AmbientLight,
  Color,
  DirectionalLight,
  DoubleSide,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  RingGeometry,
  Scene,
  SphereGeometry,
  MeshStandardMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "../vendor/three.module.js";
import {
  ACCESSORIES,
  SPECIES,
  SPAWNS,
  BOSSES,
  MISSIONS,
  canClimb,
  currentAbility,
  defaultSave,
  foodName,
  mountProfile,
  passivePerSecond,
  petStats,
  stageAtLeast,
  stageLabel,
  xpNeed,
} from "./data.js";
import { blip, chime, creatureCall, eatSound, setMuted, tone } from "./audio.js";
import { buildCreature, buildPerson } from "./meshes.js";
import {
  CAMP,
  ISLAND,
  MOUNTAIN_GATE,
  OASIS,
  PEAK,
  SHOP,
  collideCircle,
  createWorld,
  heightAt,
  inChasm,
  islandY,
  regionAt,
} from "./world.js";

const SAVE_KEY = "pawclaw-greenwood-v1";
const HIP = 0.52;

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persist(data) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export class Game {
  constructor(canvas) {
    const base = defaultSave();
    const stored = loadSave();
    const data = stored ? { ...base, ...stored, stats: { ...base.stats, ...(stored.stats || {}) }, foods: { ...base.foods, ...(stored.foods || {}) } } : base;
    this.coins = data.coins;
    this.day = data.day;
    this.minutes = data.minutes;
    this.foods = data.foods;
    this.ownedAccessories = data.ownedAccessories || [];
    this.removedWild = data.removedWild || [];
    this.cutBriars = data.cutBriars || [];
    this.movedObstacles = data.movedObstacles || [];
    this.forageGone = data.forageGone || {};
    this.activeUid = data.activeUid || "maple";
    this.pets = data.pets || base.pets;
    this.stats = data.stats;
    this.missionsDone = data.missionsDone || {};
    this.welcomed = !!data.welcomed;
    this.muted = !!data.muted;
    setMuted(this.muted);
    this.pendingAway = 0;
    if (stored && data.lastSeen) {
      const gap = (Date.now() - data.lastSeen) / 1000;
      if (gap > 20) this.pendingAway = Math.min(gap, 2400);
    }

    this.canvas = canvas;
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(48, 1, 0.1, 320);
    this.renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.16;

    this.world = createWorld(this.scene);
    this.hemi = new HemisphereLight("#fff4dc", "#8fb56a", 0.95);
    this.scene.add(this.hemi);
    this.sun = new DirectionalLight("#fff1d2", 1.35);
    this.sun.position.set(30, 48, 16);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.near = 2;
    this.sun.shadow.camera.far = 90;
    this.sun.shadow.camera.left = -26;
    this.sun.shadow.camera.right = 26;
    this.sun.shadow.camera.top = 26;
    this.sun.shadow.camera.bottom = -26;
    this.sun.shadow.bias = -0.00035;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
    this.scene.add(new AmbientLight("#fff6ea", 0.28));
    const rim = new DirectionalLight("#9fd0ff", 0.7);
    rim.position.set(-24, 18, -16);
    this.scene.add(rim);
    this.scene.background = new Color("#b9e2f6");
    if (this.scene.fog) this.scene.fog.color.set("#d7efe4");

    this.person = buildPerson();
    this.scene.add(this.person.group);
    this.player = { x: 0, y: heightAt(0, 20), z: 20, yaw: Math.PI, moving: false, vy: 0, hp: 120, maxHp: 120, hit: 0 };
    this.prevX = this.player.x;
    this.prevZ = this.player.z;
    this.camYaw = 0;
    this.camPitch = 0.58;
    this.camDist = 12;
    this.camera.position.set(0, 8, 32);

    this.views = new Map();
    this.wildViews = new Map();
    this.stats.bosses = this.stats.bosses || [];
    this.wilds = SPAWNS.filter((s) => !this.removedWild.includes(s.id)).map((s) => {
      const sp = SPECIES[s.species];
      const maxHp = Math.round(28 + sp.base.hp * 0.55);
      return {
        ...s,
        yaw: 0,
        tx: s.x,
        tz: s.z,
        homeX: s.x,
        homeZ: s.z,
        moving: false,
        temperament: sp.temperament,
        hp: maxHp,
        maxHp,
        attackCd: 0,
        submitted: false,
      };
    });
    for (const boss of BOSSES) {
      if (this.stats.bosses.includes(boss.id)) continue;
      this.wilds.push({
        ...boss,
        boss: true,
        yaw: 0,
        tx: boss.x,
        tz: boss.z,
        homeX: boss.x,
        homeZ: boss.z,
        moving: false,
        temperament: "fight",
        maxHp: boss.hp,
        attackCd: 0,
        submitted: false,
        down: false,
      });
    }

    this.mounted = false;
    this.mountUid = null;
    this.mountBlend = 1;
    this.mountFrom = { x: 0, y: 0, z: 0 };
    this.mountSpeed = 0;
    this.mountVy = 0;
    this.flying = false;
    this.landing = false;
    this.grounded = true;
    this.stamina = 100;
    this.leapT = 0;
    this.glideT = 0;
    this.glideCap = 1;
    this.buffT = 0;
    this.abilityCd = 0;
    this.exploreCarry = 0;
    this.panelOpen = false;
    this.keys = {};
    this.time = 0;
    this.lastSave = 0;
    this.bits = [];
    this.bitGeo = new SphereGeometry(0.08, 6, 5);
    this.ui = null;

    this.ring = new Mesh(
      new RingGeometry(0.42, 0.58, 24),
      new MeshBasicMaterial({ color: "#1e6b43", side: DoubleSide, transparent: true, opacity: 0.75 }),
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.scene.add(this.ring);

    this.applyWorldState();
    this.bindInput();
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("beforeunload", () => this.writeSave());
  }

  attachUI(ui) {
    this.ui = ui;
  }

  start() {
    if (this.pendingAway) this.applyAway(this.pendingAway);
    if (!this.welcomed) {
      this.welcomed = true;
      this.ui?.banner("Maple is still a pup. Time, meals, and the trail will grow them.");
      this.writeSave();
    }
    this.ui?.refresh();
    this.lastFrame = performance.now();
    requestAnimationFrame((t) => this.frame(t));
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  frame(now) {
    const raw = Math.min(30, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    const dt = Math.min(0.05, raw);
    if (raw > 3) this.applyAway(Math.min(raw, 900));
    this.update(dt);
    requestAnimationFrame((t) => this.frame(t));
  }

  update(dt) {
    this.time += dt;
    this.minutes += dt * 0.85;
    while (this.minutes >= 1440) {
      this.minutes -= 1440;
      this.day += 1;
    }
    this.buffT = Math.max(0, this.buffT - dt);
    this.abilityCd = Math.max(0, this.abilityCd - dt);
    this.leapT = Math.max(0, this.leapT - dt);
    this.updateButterflies(dt);
    this.updateClouds(dt);
    this.updateWilds(dt);
    if (!this.panelOpen) {
      if (this.mounted) this.updateMount(dt);
      else this.updateFoot(dt);
    }
    if (!this.mounted) {
      this.person.group.position.set(this.player.x, this.player.y + HIP, this.player.z);
      this.person.group.rotation.set(0, this.player.yaw, 0);
      this.person.animate(dt, this.player.moving && !this.panelOpen);
    }
    this.updatePets(dt);
    this.updateGrowth(dt);
    this.updateMissions();
    this.updateForage();
    this.trackTravel();
    this.updateCamera(dt);
    this.updateBits(dt);
    this.sun.position.set(this.player.x + 26, 44, this.player.z + 12);
    this.sun.target.position.set(this.player.x, this.player.y, this.player.z);
    this.sun.target.updateMatrixWorld();
    const pet = this.activePet();
    if (pet) {
      this.ring.visible = true;
      this.ring.position.set(pet.x, pet.y + 0.08, pet.z);
    }
    this.renderer.render(this.scene, this.camera);
    if (this.time - this.lastSave > 5) this.writeSave();
  }

  bindInput() {
    const typing = () => {
      const el = document.activeElement;
      return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
    };
    window.addEventListener("keydown", (e) => {
      if (typing()) return;
      this.keys[e.code] = true;
      if (e.code === "Space") e.preventDefault();
      if (e.repeat) return;
      if (e.code === "Escape") this.ui?.close();
      else if (e.code === "KeyE") this.interact();
      else if (e.code === "KeyF") this.useAbility();
      else if (e.code === "KeyR") this.toggleMount();
      else if (e.code === "KeyG") this.ui?.toggle("growth");
      else if (e.code === "KeyM") this.ui?.toggle("missions");
      else if (e.code === "KeyI") this.ui?.toggle("inventory");
      else if (e.code === "KeyJ") this.ui?.toggle("journal");
      else if (e.code === "KeyV") this.ui?.toggle("companions");
      else if (e.code === "KeyP") this.ui?.toggle("map");
      else if (e.code === "Tab") {
        e.preventDefault();
        this.cyclePet(e.shiftKey ? -1 : 1);
      }
    });
    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });
    this.canvas.addEventListener("pointerdown", (e) => {
      this.drag = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener("pointerup", () => {
      this.drag = null;
    });
    window.addEventListener("pointermove", (e) => {
      if (!this.drag) return;
      const dx = e.clientX - this.drag.x;
      const dy = e.clientY - this.drag.y;
      this.drag.x = e.clientX;
      this.drag.y = e.clientY;
      this.camYaw -= dx * 0.005;
      this.camPitch = clamp(this.camPitch + dy * 0.003, 0.28, 1.15);
    });
    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      this.camDist = clamp(this.camDist + Math.sign(e.deltaY) * 0.8, 6.5, 22);
    }, { passive: false });
  }

  activePet() {
    return this.pets.find((p) => p.uid === this.activeUid) || this.pets[0] || null;
  }

  toast(text) {
    this.ui?.toast(text);
  }

  applyAway(seconds) {
    const grant = Math.min(30, seconds * passivePerSecond(false) * 0.55);
    if (grant < 1) return;
    for (const pet of this.pets) this.addGrowth(pet, grant);
    this.toast("Your companions grew a little while you were away.");
    this.pendingAway = 0;
  }

  applyWorldState() {
    for (const b of this.world.briars) {
      if (this.cutBriars.includes(b.id)) {
        b.cut = true;
        b.mesh.visible = false;
        const col = this.world.colliders.find((c) => Math.hypot(c.x - b.x, c.z - b.z) < 0.3);
        if (col) col.disabled = true;
      }
    }
    for (const o of this.world.obstacles) {
      if (this.movedObstacles.includes(o.id)) {
        o.moved = true;
        o.collider.disabled = true;
        o.mesh.position.x += 3.3;
        o.mesh.position.z += 0.4;
      }
    }
  }

  updateButterflies(dt) {
    for (const b of this.world.butterflies) {
      b.phase += dt;
      b.x = b.baseX + Math.cos(b.phase) * 1.5;
      b.z = b.baseZ + Math.sin(b.phase * 0.8) * 1.15;
      b.mesh.position.set(b.x, heightAt(b.x, b.z) + 0.75 + Math.sin(b.phase * 3) * 0.18, b.z);
      b.mesh.rotation.y = b.phase;
    }
  }

  updateClouds(dt) {
    for (const cloud of this.world.clouds) {
      cloud.position.x += dt * 0.6;
      if (cloud.position.x > 120) cloud.position.x = -120;
    }
  }

  updateWilds(dt) {
    this.player.hit = Math.max(0, this.player.hit - dt);
    let threat = false;
    for (const wild of this.wilds) {
      const sp = SPECIES[wild.species];
      const pdx = this.player.x - wild.x;
      const pdz = this.player.z - wild.z;
      const pd = Math.hypot(pdx, pdz) || 0.001;
      wild.attackCd = Math.max(0, (wild.attackCd || 0) - dt);
      let speed = 1.2;
      if (wild.down || wild.submitted) {
        speed = 0;
      } else if (wild.boss || wild.temperament === "fight") {
        const range = wild.boss ? 26 : 14;
        if (pd < range) {
          threat = true;
          wild.tx = this.player.x;
          wild.tz = this.player.z;
          const enraged = wild.boss && wild.hp < wild.maxHp * 0.35;
          speed = wild.boss ? (enraged ? 8.4 : 6.1) : 5.6;
          const reach = wild.boss ? 2.6 : 1.55;
          if (pd < reach && wild.attackCd <= 0 && !this.panelOpen) {
            this.hurtPlayer(wild);
            wild.attackCd = wild.boss ? (enraged ? 0.62 : 0.9) : 1.55;
          }
        } else if (Math.hypot(wild.x - wild.tx, wild.z - wild.tz) < 0.6) {
          const a = Math.random() * Math.PI * 2;
          wild.tx = wild.homeX + Math.cos(a) * (wild.boss ? 3 : 4);
          wild.tz = wild.homeZ + Math.sin(a) * (wild.boss ? 3 : 4);
        }
      } else if (pd < 11) {
        wild.tx = wild.x - (pdx / pd) * 9;
        wild.tz = wild.z - (pdz / pd) * 9;
        speed = 7.4;
      } else if (Math.hypot(wild.x - wild.tx, wild.z - wild.tz) < 0.5) {
        const a = Math.random() * Math.PI * 2;
        wild.tx = wild.homeX + Math.cos(a) * 4;
        wild.tz = wild.homeZ + Math.sin(a) * 4;
      }
      const dx = wild.tx - wild.x;
      const dz = wild.tz - wild.z;
      const dist = Math.hypot(dx, dz) || 1;
      const step = Math.min(dist, speed * dt);
      if (speed > 0) {
        wild.x = clamp(wild.x + (dx / dist) * step, -118, 140);
        wild.z = clamp(wild.z + (dz / dist) * step, -118, 140);
        wild.yaw = Math.atan2(dx, dz);
      }
      wild.moving = step > 0.01 && speed > 0;
      const stage = wild.boss ? "alpha" : "baby";
      let view = this.wildViews.get(wild.id);
      if (!view || view.stage !== stage) {
        if (view) {
          this.scene.remove(view.group);
          view.dispose();
        }
        view = buildCreature(wild.species, stage, wild.boss ? 1 : 0.2, []);
        view.stage = stage;
        this.scene.add(view.group);
        this.wildViews.set(wild.id, view);
      }
      const y = heightAt(wild.x, wild.z);
      const size = wild.boss ? wild.scale : 1;
      view.group.position.set(wild.x, y, wild.z);
      view.group.rotation.y = wild.yaw;
      view.group.scale.setScalar(size * (wild.flash > 0 ? 1.06 : 1));
      wild.flash = Math.max(0, (wild.flash || 0) - dt);
      view.animate(dt, {
        moving: wild.moving,
        hop: sp.personality === "hoppy" || (wild.temperament === "flee" && pd < 11),
        flap: sp.plan === "bird",
        flapStrong: sp.plan === "bird" && (wild.boss || wild.moving),
        play: false,
        sit: false,
      });
      if (pd < 16 && !this.stats.discovered[wild.species]) {
        this.stats.discovered[wild.species] = true;
        this.coins += 6;
        this.toast(`Discovered ${wild.boss ? wild.name : sp.name}`);
        this.saveSoon();
      }
    }
    if (!threat && this.player.hp < this.player.maxHp) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 10 * dt);
    }
  }

  hurtPlayer(wild) {
    const dmg = wild.boss ? (wild.hp < wild.maxHp * 0.35 ? 34 : 24) : 9;
    this.player.hp -= dmg;
    this.player.hit = 0.35;
    const away = Math.atan2(this.player.x - wild.x, this.player.z - wild.z);
    const knock = wild.boss ? 3.2 : 1.3;
    this.player.x += Math.sin(away) * knock;
    this.player.z += Math.cos(away) * knock;
    this.toast(`${wild.boss ? wild.name : SPECIES[wild.species].name} hits you for ${dmg}.`);
    if (this.player.hp <= 0) {
      this.player.hp = this.player.maxHp;
      if (this.mounted) this.dismount();
      this.player.x = 0;
      this.player.z = 20;
      this.player.y = heightAt(0, 20);
      this.ui?.banner("You were driven back to camp.");
    }
  }

  strikeNear(pet) {
    let best = null;
    let bestD = 3.2;
    for (const wild of this.wilds) {
      if (wild.down || wild.submitted) continue;
      if (wild.temperament !== "fight" && !wild.boss) continue;
      const d = Math.hypot((pet.x ?? this.player.x) - wild.x, (pet.z ?? this.player.z) - wild.z);
      const reach = wild.boss ? 4.2 : 2.8;
      if (d < reach && d < bestD) {
        best = wild;
        bestD = d;
      }
    }
    if (!best) return false;
    const stats = petStats(pet);
    let dmg = Math.max(1, stats.atk);
    if (pet.stage === "baby") dmg = Math.max(1, Math.round(dmg * 0.4));
    else if (pet.stage === "juvenile") dmg = Math.round(dmg * 0.7);
    else if (pet.stage === "alpha") dmg = Math.round(dmg * 1.55);
    if (best.boss) dmg = Math.max(1, Math.round(dmg * 0.42));
    best.hp -= dmg;
    best.flash = 0.18;
    this.burst(best.x, heightAt(best.x, best.z) + 0.8, best.z);
    if (best.hp <= 0) this.defeatWild(best);
    else this.toast(`${dmg} damage. ${best.boss ? best.name : SPECIES[best.species].name} has ${Math.max(0, Math.ceil(best.hp))} left.`);
    return true;
  }

  defeatWild(wild) {
    wild.hp = 0;
    wild.down = true;
    wild.submitted = true;
    if (wild.boss) {
      if (!this.stats.bosses.includes(wild.id)) this.stats.bosses.push(wild.id);
      this.coins += 90;
      const pet = this.activePet();
      if (pet) {
        this.addXp(pet, 60);
        this.addGrowth(pet, 28);
      }
      this.ui?.banner(`${wild.name} falls.`);
    } else {
      this.toast(`${SPECIES[wild.species].name} yields. Press E to befriend them.`);
    }
    this.saveSoon();
  }

  updateFoot(dt) {
    let ix = 0;
    let iz = 0;
    const fx = -Math.sin(this.camYaw);
    const fz = -Math.cos(this.camYaw);
    const rx = Math.cos(this.camYaw);
    const rz = -Math.sin(this.camYaw);
    if (this.keys.KeyW) { ix += fx; iz += fz; }
    if (this.keys.KeyS) { ix -= fx; iz -= fz; }
    if (this.keys.KeyA) { ix -= rx; iz -= rz; }
    if (this.keys.KeyD) { ix += rx; iz += rz; }
    const moving = ix !== 0 || iz !== 0;
    const len = Math.hypot(ix, iz) || 1;
    ix /= len;
    iz /= len;
    const sprint = this.keys.ShiftLeft || this.keys.ShiftRight;
    let speed = moving ? (sprint ? 9.6 : 6.2) : 0;
    const follower = this.activePet();
    if (follower && follower.species === "horse" && follower.stage === "juvenile") speed *= 1.1;
    if (this.buffT > 0) speed *= 1.16;
    if (this.glideT > 0) speed *= 1.22;
    if (this.player.x > 104) speed *= 0.48;
    if (moving) {
      let nx = this.player.x + ix * speed * dt;
      let nz = this.player.z + iz * speed * dt;
      const flags = this.travelFlags(false);
      const gated = this.applyGates(this.player.x, this.player.z, nx, nz, this.player.y, flags);
      const hit = collideCircle(gated.x, gated.z, 0.42, this.world.colliders);
      this.player.x = clamp(hit.x, -118, 140);
      this.player.z = clamp(hit.z, -118, 140);
      this.player.yaw = Math.atan2(ix, iz);
    }
    this.slideOffPeak(dt, false);
    let floor = this.floorAt(this.player.x, this.player.z, this.player.y);
    if (this.glideT > 0) {
      this.glideT -= dt;
      const cap = floor + this.glideCap;
      this.player.y += (this.keys.Space ? 2.4 : 1.4) * dt;
      if (this.player.y > cap) this.player.y = cap;
      if (this.player.y < floor) this.player.y = floor;
      this.grounded = this.player.y <= floor + 0.05;
    } else {
      if (this.keys.Space && this.grounded) this.player.vy = 6.4;
      this.player.vy -= 28 * dt;
      this.player.y += this.player.vy * dt;
      if (this.player.y <= floor) {
        this.player.y = floor;
        this.player.vy = 0;
        this.grounded = true;
      } else this.grounded = false;
    }
    this.player.moving = moving;
  }

  updateMount(dt) {
    const pet = this.activePet();
    if (!pet) {
      this.mounted = false;
      return;
    }
    const view = this.ensureView(pet);
    const prof = mountProfile(pet);
    if (this.mountBlend < 1) {
      this.mountBlend = Math.min(1, this.mountBlend + dt / 0.42);
      const t = this.mountBlend * this.mountBlend * (3 - 2 * this.mountBlend);
      const seat = view.anim.seat;
      this.person.group.position.set(
        this.mountFrom.x + (seat.x - this.mountFrom.x) * t,
        this.mountFrom.y + (seat.y - this.mountFrom.y) * t,
        this.mountFrom.z + (seat.z - this.mountFrom.z) * t,
      );
      pet.y = heightAt(pet.x, pet.z);
      this.player.x = pet.x;
      this.player.z = pet.z;
      this.player.y = pet.y;
      return;
    }
    if (this.keys.KeyA) pet.yaw += prof.turn * dt;
    if (this.keys.KeyD) pet.yaw -= prof.turn * dt;
    const sprint = (this.keys.ShiftLeft || this.keys.ShiftRight) && this.stamina > 1;
    let top = prof.speed * (sprint ? 1.3 : 1) * (this.buffT > 0 ? 1.12 : 1);
    if (pet.x > 104 && pet.species !== "camel") top *= 0.5;
    if (pet.species === "camel" && pet.x > 104) top *= 1.08;
    let target = 0;
    if (this.keys.KeyW) target = top;
    if (this.keys.KeyS) target = -top * 0.4;
    const diff = target - this.mountSpeed;
    const maxStep = prof.accel * dt;
    this.mountSpeed += clamp(diff, -maxStep, maxStep);
    if (sprint && Math.abs(this.mountSpeed) > 0.8) this.stamina = Math.max(0, this.stamina - 15 * dt);
    else this.stamina = Math.min(prof.stamina, this.stamina + 13 * dt);

    const fx = Math.sin(pet.yaw);
    const fz = Math.cos(pet.yaw);
    let nx = pet.x + fx * this.mountSpeed * dt;
    let nz = pet.z + fz * this.mountSpeed * dt;
    const flags = this.travelFlags(true);
    const gated = this.applyGates(pet.x, pet.z, nx, nz, pet.y, flags);
    if (!this.flying) {
      const hit = collideCircle(gated.x, gated.z, 0.7, this.world.colliders);
      nx = hit.x;
      nz = hit.z;
    } else {
      nx = gated.x;
      nz = gated.z;
    }
    pet.x = clamp(nx, -118, 140);
    pet.z = clamp(nz, -118, 140);

    const ground = this.floorAt(pet.x, pet.z, pet.y);
    if (prof.fly) {
      if (!this.flying && this.keys.Space && this.grounded) {
        this.flying = true;
        this.mountVy = 7;
        this.grounded = false;
      }
      if (this.flying) {
        let climb = prof.climbRate;
        if (this.stamina <= 0) climb *= 0.45;
        if (this.keys.Space) this.mountVy = climb;
        else if (this.keys.KeyC || this.landing) this.mountVy = -climb;
        else this.mountVy *= 0.9;
        pet.y += this.mountVy * dt;
        if (pet.y > 46) pet.y = 46;
        if (pet.y <= ground + 0.04 && this.mountVy <= 0.2) {
          pet.y = ground;
          this.flying = false;
          this.grounded = true;
          this.mountVy = 0;
          if (this.landing) {
            this.landing = false;
            this.dismount();
            return;
          }
        } else this.grounded = false;
      } else {
        pet.y = ground;
        this.grounded = true;
      }
    } else {
      if (this.keys.Space && this.grounded && prof.jump > 0) {
        const sprinting = this.keys.ShiftLeft || this.keys.ShiftRight;
        if (pet.species === "tiger" && sprinting) {
          this.leapT = 0.85;
          this.mountVy = Math.max(prof.jump, 8);
          this.mountSpeed += 5;
        } else this.mountVy = prof.jump;
        this.grounded = false;
      }
      this.mountVy -= 30 * dt;
      pet.y += this.mountVy * dt;
      if (pet.y <= ground) {
        pet.y = ground;
        this.mountVy = 0;
        this.grounded = true;
      } else this.grounded = false;
    }
    this.player.x = pet.x;
    this.player.z = pet.z;
    this.player.y = pet.y;
    this.player.yaw = pet.yaw;
    this.player.moving = Math.abs(this.mountSpeed) > 0.35;
    pet.moving = this.player.moving;
    if (!this.flying) this.tryShove(pet);
    this.slideOffPeak(dt, true);
    this.checkSites();
  }

  floorAt(x, z, y) {
    let ground = heightAt(x, z);
    const island = islandY(x, z);
    if (island != null && y > island - 2.4) ground = Math.max(ground, island);
    return ground;
  }

  travelFlags(mounted) {
    const pet = this.activePet();
    return {
      climb: !!(pet && canClimb(pet) && (mounted || pet.uid === this.activeUid)),
      fly: this.flying,
      tigerJump: this.leapT > 0,
    };
  }

  applyGates(px, pz, nx, nz, y, flags) {
    if (!flags.climb && !flags.fly) {
      if (nz < MOUNTAIN_GATE && pz >= MOUNTAIN_GATE - 0.01) nz = MOUNTAIN_GATE + 0.08;
    }
    if (!flags.fly && !flags.tigerJump && inChasm(nx, nz) && y < heightAt(nx, nz) + 3) {
      if (!inChasm(nx, pz)) nz = pz;
      if (!inChasm(px, nz)) nx = px;
      if (inChasm(nx, nz)) {
        nx = px;
        nz = pz;
      }
    }
    return { x: nx, z: nz };
  }

  slideOffPeak(dt, mounted) {
    const flags = this.travelFlags(mounted);
    if (flags.climb || flags.fly) return;
    if (this.player.z < MOUNTAIN_GATE) {
      const nz = Math.min(MOUNTAIN_GATE + 0.2, this.player.z + 9 * dt);
      this.player.z = nz;
      if (mounted) {
        const pet = this.activePet();
        if (pet) pet.z = nz;
      }
    }
  }

  checkSites() {
    const pet = this.activePet();
    if (!pet) return;
    if (this.flying && pet.species === "eagle" && stageAtLeast(pet.stage, "adult")) {
      const pad = islandY(this.player.x, this.player.z);
      if (pad && Math.hypot(this.player.x - ISLAND.x, this.player.z - ISLAND.z) < 7.5 && Math.abs(this.player.y - pad) < 1.6) {
        if (!this.stats.reachedPerch) {
          this.stats.reachedPerch = true;
          this.toast("The Sky Perch. Your eagle holds the wind.");
          this.saveSoon();
        }
      }
    }
    if (pet.species === "goat" && canClimb(pet) && pet.level >= 2) {
      const near = Math.hypot(this.player.x - PEAK.x, this.player.z - PEAK.z) < 8
        && Math.hypot(pet.x - PEAK.x, pet.z - PEAK.z) < 10;
      if (near && !this.stats.reachedPeak) {
        this.stats.reachedPeak = true;
        this.toast("High Ledge. The goat picked every step.");
        this.saveSoon();
      }
    }
    if (this.mounted && pet.species === "camel" && stageAtLeast(pet.stage, "adult")) {
      if (Math.hypot(this.player.x - OASIS.x, this.player.z - OASIS.z) < 7 && !this.stats.reachedOasis) {
        this.stats.reachedOasis = true;
        this.toast("Crystal Oasis. The camel never argued with the sand.");
        this.saveSoon();
      }
    }
  }

  trackTravel() {
    const dx = this.player.x - this.prevX;
    const dz = this.player.z - this.prevZ;
    const dist = Math.hypot(dx, dz);
    this.prevX = this.player.x;
    this.prevZ = this.player.z;
    if (dist <= 0 || dist > 2.5) return;
    const pet = this.activePet();
    if (!pet) return;
    this.exploreCarry += dist;
    if (this.exploreCarry >= 12) {
      const chunks = Math.floor(this.exploreCarry / 12);
      this.exploreCarry -= chunks * 12;
      this.addGrowth(pet, 1.15 * chunks);
      this.addXp(pet, chunks);
    }
    if (pet.stage === "baby") this.stats.babyDistance += dist;
    if (pet.species === "wolf" && pet.stage === "baby" && regionAt(this.player.x, this.player.z) === "forest") {
      this.stats.wolfDistance += dist;
    }
    if (this.mounted && pet.species === "wolf" && stageAtLeast(pet.stage, "adult")) {
      this.stats.wolfRidden += dist;
    }
  }

  updatePets(dt) {
    for (const pet of this.pets) {
      const sp = SPECIES[pet.species];
      const ridden = this.mounted && this.mountUid === pet.uid;
      const active = pet.uid === this.activeUid && !ridden;
      if (!ridden) {
        let tx;
        let tz;
        let stop;
        if (active) {
          const dest = this.petDestination(pet, dt);
          tx = dest.x;
          tz = dest.z;
          stop = this.followDist(pet);
        } else {
          const slot = this.campSlot(pet);
          const buddy = this.campBuddy(pet);
          pet.socialT = (pet.socialT ?? 2) - dt;
          if (buddy && pet.socialT > 0 && Math.hypot(buddy.x - slot.x, buddy.z - slot.z) < 6) {
            tx = buddy.x;
            tz = buddy.z;
            stop = 1;
          } else {
            if (pet.socialT < -2) pet.socialT = 2 + Math.random() * 3;
            tx = slot.x;
            tz = slot.z;
            stop = 0.4;
          }
        }
        const dx = tx - pet.x;
        const dz = tz - pet.z;
        const dist = Math.hypot(dx, dz);
        const speed = petStats(pet).speed * (active ? 1.2 : 0.9);
        if (dist > stop) {
          const step = Math.min(dist - stop, speed * dt);
          pet.x += (dx / dist) * step;
          pet.z += (dz / dist) * step;
          pet.yaw = Math.atan2(dx, dz);
          pet.moving = true;
        } else pet.moving = false;
        const hit = collideCircle(pet.x, pet.z, 0.34, this.world.colliders);
        pet.x = hit.x;
        pet.z = hit.z;
        pet.y = heightAt(pet.x, pet.z);
      }
      pet.sitTimer = (pet.sitTimer || 0) + dt;
      pet.sitting = sp.personality === "sleepy"
        && (pet.stage === "baby" || pet.stage === "juvenile")
        && !pet.moving
        && !ridden
        && (pet.sitTimer % 10) > 6.4;
      pet.playing = sp.personality === "playful" && !pet.moving && !ridden && Math.sin(this.time * 0.65 + pet.playSeconds) > 0.25;
      const view = this.ensureView(pet);
      view.anim.group.position.set(pet.x, pet.y, pet.z);
      view.anim.group.rotation.y = pet.yaw;
      const punch = pet.punch || 0;
      const pulse = punch > 0 ? 1 + Math.sin(Math.min(1, punch) * Math.PI) * 0.12 : 1;
      pet.punch = Math.max(0, punch - dt * 0.65);
      const stageScale = pet.stage === "alpha" ? 1.32 : pet.stage === "prime" ? 1.14 : pet.stage === "baby" ? 0.88 : pet.stage === "juvenile" ? 0.94 : 1;
      view.anim.group.scale.setScalar((0.94 + (pet.growth / 100) * 0.1) * pulse * stageScale);
      view.anim.animate(dt, {
        moving: !!(pet.moving || (ridden && Math.abs(this.mountSpeed) > 0.35)),
        sit: pet.sitting,
        play: pet.playing,
        hop: sp.personality === "hoppy",
        flap: sp.plan === "bird",
        flapStrong: sp.plan === "bird" && (pet.stage === "baby" || this.flying || this.glideT > 0 || sp.personality === "flutter"),
      });
    }
  }

  petDestination(pet, dt) {
    const sp = SPECIES[pet.species];
    if (sp.personality === "hunter") {
      pet.chaseT = pet.chaseT || 0;
      if (pet.chaseT > 0) {
        pet.chaseT -= dt;
        const bug = this.world.butterflies.find((b) => b.id === pet.chaseId);
        if (bug) return { x: bug.x, z: bug.z };
      } else {
        let best = null;
        let bestD = pet.stage === "baby" ? 9 : 6.5;
        for (const bug of this.world.butterflies) {
          const d = Math.hypot(bug.x - pet.x, bug.z - pet.z);
          if (d < bestD) {
            best = bug;
            bestD = d;
          }
        }
        if (best) {
          pet.chaseT = 2.2;
          pet.chaseId = best.id;
          return { x: best.x, z: best.z };
        }
      }
    }
    return { x: this.player.x, z: this.player.z };
  }

  followDist(pet) {
    const sp = SPECIES[pet.species];
    if (sp.personality === "clingy" && pet.stage === "baby") return 1.15;
    if (pet.stage === "baby") return 1.6;
    if (pet.stage === "adult" || pet.stage === "prime") return 2.65;
    return 2.1;
  }

  campSlot(pet) {
    const i = Math.max(0, this.pets.indexOf(pet));
    const a = (i / Math.max(6, this.pets.length)) * Math.PI * 2;
    return { x: CAMP.x + Math.cos(a) * 3.3, z: CAMP.z + Math.sin(a) * 2.5 };
  }

  campBuddy(pet) {
    return this.pets.find((other) => other !== pet && other.uid !== this.activeUid) || null;
  }

  ensureView(pet) {
    const bucket = Math.floor(pet.growth / 20);
    const key = `${pet.stage}|${bucket}|${(pet.accessories || []).join(",")}`;
    let view = this.views.get(pet.uid);
    if (view && view.key === key) return view;
    const riding = this.mounted && this.mountUid === pet.uid;
    if (riding) this.scene.attach(this.person.group);
    if (view) {
      this.scene.remove(view.anim.group);
      view.anim.dispose();
    }
    const anim = buildCreature(pet.species, pet.stage, pet.growth / 100, pet.accessories || []);
    this.scene.add(anim.group);
    view = { anim, key };
    this.views.set(pet.uid, view);
    if (riding) {
      this.person.setSitting(true);
      anim.pivot.attach(this.person.group);
      this.person.group.rotation.set(0.18, 0, 0);
      this.person.group.position.set(anim.seat.x, anim.seat.y, anim.seat.z);
      this.mountBlend = 1;
    }
    return view;
  }

  updateGrowth(dt) {
    for (const pet of this.pets) {
      const active = pet.uid === this.activeUid;
      this.addGrowth(pet, passivePerSecond(active) * dt);
      this.addXp(pet, dt * (active ? 0.12 : 0.04));
      pet.playSeconds += dt;
      if (active) pet.bond = Math.min(100, pet.bond + dt * 0.04);
    }
  }

  addGrowth(pet, amount) {
    if (!pet || amount <= 0) return;
    const sp = SPECIES[pet.species];
    if (!sp.stages.includes(pet.stage)) pet.stage = "baby";
    const nxt = sp.stages[sp.stages.indexOf(pet.stage) + 1];
    if (!nxt && pet.growth >= 100) return;
    pet.growth += amount;
    while (pet.growth >= 100) {
      const next = sp.stages[sp.stages.indexOf(pet.stage) + 1];
      if (!next) {
        pet.growth = 100;
        break;
      }
      pet.growth -= 100;
      const prev = pet.stage;
      pet.stage = next;
      this.onEvolve(pet, prev, next);
    }
  }

  addXp(pet, amount) {
    if (!pet || amount <= 0) return;
    pet.xp += amount;
    let raised = false;
    while (pet.xp >= xpNeed(pet.level)) {
      pet.xp -= xpNeed(pet.level);
      pet.level += 1;
      raised = true;
    }
    if (raised) {
      this.toast(`${pet.name} reached level ${pet.level}.`);
      tone(880, 0.09, "sine", 0.04);
      this.saveSoon();
    }
  }

  onEvolve(pet, prev, next) {
    const sp = SPECIES[pet.species];
    pet.punch = 1;
    this.burst(pet.x, pet.y + 0.8, pet.z);
    chime();
    creatureCall(sp, next);
    const msg = `${pet.name} grew into a ${stageLabel(next)}.`;
    if (pet.uid === this.activeUid) this.ui?.banner(msg);
    else this.toast(msg);
    const fresh = sp.abilities.filter((a) => a.stage === next);
    if (fresh.length) this.toast(`New ability: ${fresh.map((a) => a.name).join(", ")}`);
    if (sp.ride && sp.ride.minStage === next) this.toast(`${pet.name} can be ridden.`);
    if (sp.climb === next) this.toast(`${pet.name} can take the high trail.`);
    if (sp.ride?.fly && (sp.ride.flyStage || "adult") === next) this.toast(`${pet.name} can fly with you.`);
    this.saveSoon();
    this.ui?.refresh();
  }

  burst(x, y, z) {
    for (let i = 0; i < 16; i++) {
      const mesh = new Mesh(this.bitGeo, new MeshStandardMaterial({ color: i % 2 ? "#f2d48a" : "#fffaf2" }));
      mesh.position.set(x, y, z);
      mesh.userData.v = new Vector3((Math.random() - 0.5) * 3.2, 1.8 + Math.random() * 2.2, (Math.random() - 0.5) * 3.2);
      mesh.userData.life = 1.05;
      this.scene.add(mesh);
      this.bits.push(mesh);
    }
  }

  updateBits(dt) {
    for (const mesh of this.bits) {
      mesh.userData.life -= dt;
      mesh.userData.v.y -= 3.5 * dt;
      mesh.position.addScaledVector(mesh.userData.v, dt);
      const s = Math.max(0.01, mesh.userData.life);
      mesh.scale.setScalar(s);
    }
    this.bits = this.bits.filter((mesh) => {
      if (mesh.userData.life > 0) return true;
      this.scene.remove(mesh);
      mesh.material.dispose();
      return false;
    });
  }

  updateMissions() {
    const snap = { pets: this.pets, stats: this.stats };
    for (const mission of MISSIONS) {
      if (this.missionsDone[mission.id]) continue;
      if (mission.done(snap)) this.completeMission(mission);
    }
  }

  completeMission(mission) {
    this.missionsDone[mission.id] = true;
    const pet = this.rewardPet(mission);
    const reward = mission.reward;
    if (reward.coins) this.coins += reward.coins;
    if (reward.xp && pet) this.addXp(pet, reward.xp);
    if (reward.growth && pet) this.addGrowth(pet, reward.growth);
    if (reward.item) {
      if (!this.ownedAccessories.includes(reward.item)) this.ownedAccessories.push(reward.item);
      if (pet && !pet.accessories.includes(reward.item)) pet.accessories.push(reward.item);
    }
    chime();
    const item = reward.item ? ` ${ACCESSORIES[reward.item]}.` : "";
    this.ui?.banner(`${mission.title} complete.${item}`);
    this.saveSoon();
    this.ui?.refresh();
  }

  rewardPet(mission) {
    const want = {
      "first-flight": "eagle",
      mountain: "goat",
      desert: "camel",
      guardian: "wolf",
      "forest-adventure": "wolf",
    }[mission.id];
    if (want) return this.pets.find((p) => p.species === want) || this.activePet();
    if (mission.id === "learning-to-fly") {
      return this.pets.find((p) => ["eagle", "owl", "aurora"].includes(p.species)) || this.activePet();
    }
    if (mission.id === "little-hunter") {
      return this.pets.find((p) => ["cat", "lion", "tiger"].includes(p.species)) || this.activePet();
    }
    if (mission.id === "first-steps") return this.pets.find((p) => p.stage === "baby") || this.activePet();
    return this.activePet();
  }

  updateForage() {
    const now = Date.now();
    for (const node of this.world.forage) {
      const gone = this.forageGone[node.id] || 0;
      node.mesh.visible = !gone || now - gone > 50000;
      if (node.mesh.visible) {
        node.mesh.position.y = heightAt(node.x, node.z) + 0.28 + Math.sin(this.time * 2 + node.x) * 0.05;
      }
    }
  }

  updateCamera(dt) {
    const lookY = this.player.y + (this.flying ? 1.6 : 1.2);
    const dist = this.camDist * (this.flying ? 1.28 : 1);
    const flat = Math.cos(this.camPitch) * dist;
    const tx = this.player.x + Math.sin(this.camYaw) * flat;
    const tz = this.player.z + Math.cos(this.camYaw) * flat;
    const ty = lookY + Math.sin(this.camPitch) * dist;
    const k = 1 - Math.exp(-4.2 * dt);
    this.camera.position.x += (tx - this.camera.position.x) * k;
    this.camera.position.y += (ty - this.camera.position.y) * k;
    this.camera.position.z += (tz - this.camera.position.z) * k;
    this.camera.lookAt(this.player.x, lookY, this.player.z);
  }

  interact() {
    if (this.panelOpen) return;
    if (this.mounted) {
      const ground = heightAt(this.player.x, this.player.z);
      if (this.flying && this.player.y > ground + 1.4) {
        this.landing = true;
        this.toast("Landing.");
        return;
      }
      this.dismount();
      return;
    }
    const near = this.nearestInteract();
    if (!near) {
      this.toast("Nothing close enough.");
      return;
    }
    if (near.kind === "wild") this.befriend(near.wild);
    else if (near.kind === "forage") this.collect(near.node);
    else if (near.kind === "shop") this.ui?.toggle("shop");
    else if (near.kind === "mount") this.toggleMount();
  }

  nearestInteract() {
    const options = [];
    for (const wild of this.wilds) {
      const d = Math.hypot(wild.x - this.player.x, wild.z - this.player.z);
      if (d < 2.5) options.push({ d, kind: "wild", wild, label: `E  Befriend ${SPECIES[wild.species].name}` });
    }
    for (const node of this.world.forage) {
      if (!node.mesh.visible) continue;
      const d = Math.hypot(node.x - this.player.x, node.z - this.player.z);
      if (d < 1.8) options.push({ d, kind: "forage", node, label: `E  Gather ${foodName(node.food)}` });
    }
    const shopD = Math.hypot(SHOP.x - this.player.x, SHOP.z - this.player.z);
    if (shopD < 2.3) options.push({ d: shopD, kind: "shop", label: "E  Camp shop" });
    const pet = this.activePet();
    if (pet && !this.mounted) {
      const prof = mountProfile(pet);
      const d = Math.hypot(pet.x - this.player.x, pet.z - this.player.z);
      if (prof.rideable && d < 2.8) {
        options.push({
          d,
          kind: "mount",
          label: prof.unlocked ? `E  Mount ${pet.name}` : prof.reason,
        });
      }
    }
    options.sort((a, b) => a.d - b.d);
    return options[0] || null;
  }

  prompt() {
    if (this.mounted) {
      const prof = mountProfile(this.activePet());
      if (prof.fly) {
        return this.flying
          ? "Space rise · C descend · Shift sprint · E land"
          : "Space take off · Shift sprint · E dismount";
      }
      return "W forward · A D turn · Shift sprint · Space jump · E dismount";
    }
    const near = this.nearestInteract();
    if (near) return near.label;
    const ability = currentAbility(this.activePet());
    return ability ? `F  ${ability.name}` : "WASD explore";
  }

  befriend(wild) {
    const sp = SPECIES[wild.species];
    if (wild.boss) {
      this.toast(`${wild.name} will not travel with you.`);
      return;
    }
    if (wild.temperament === "fight" && !wild.submitted) {
      this.toast("They're fighting. Press F with your companion.");
      return;
    }
    if (this.pets.some((p) => p.species === wild.species)) {
      this.toast(`You already travel with a ${sp.name}.`);
      return;
    }
    let name = sp.defaultName;
    if (this.pets.some((p) => p.name === name)) name = `${name} II`;
    const pet = {
      uid: crypto.randomUUID(),
      species: sp.id,
      name,
      stage: "baby",
      growth: 0,
      xp: 0,
      level: 1,
      bond: 12,
      playSeconds: 0,
      accessories: [],
      lastFeedAt: 0,
    };
    this.pets.push(pet);
    this.activeUid = pet.uid;
    this.removedWild.push(wild.id);
    this.stats.befriended += 1;
    this.stats.discovered[sp.id] = true;
    this.coins += 10;
    const view = this.wildViews.get(wild.id);
    if (view) {
      this.scene.remove(view.group);
      view.dispose();
      this.wildViews.delete(wild.id);
    }
    this.wilds = this.wilds.filter((w) => w.id !== wild.id);
    creatureCall(sp, "baby");
    this.toast(`${pet.name} joins you as a baby ${sp.name}.`);
    this.saveSoon();
    this.ui?.refresh();
  }

  collect(node) {
    this.forageGone[node.id] = Date.now();
    node.mesh.visible = false;
    this.foods[node.food] = (this.foods[node.food] || 0) + 1;
    blip();
    this.toast(`Gathered ${foodName(node.food)}.`);
    this.saveSoon();
  }

  feed(uid, foodId) {
    const pet = this.pets.find((p) => p.uid === uid);
    if (!pet) return;
    if ((this.foods[foodId] || 0) <= 0) {
      this.toast(`No ${foodName(foodId).toLowerCase()} left.`);
      return;
    }
    const now = Date.now();
    if (now - (pet.lastFeedAt || 0) < 7000) {
      this.toast(`${pet.name} is still chewing.`);
      return;
    }
    this.foods[foodId] -= 1;
    pet.lastFeedAt = now;
    const favorite = SPECIES[pet.species].diet.includes(foodId);
    pet.bond = Math.min(100, pet.bond + (favorite ? 8 : 2));
    this.addXp(pet, favorite ? 10 : 4);
    this.addGrowth(pet, favorite ? 14 : 5);
    eatSound();
    this.burst(pet.x, pet.y + 0.6, pet.z);
    this.toast(favorite
      ? `${pet.name} loves the ${foodName(foodId).toLowerCase()}.`
      : `${pet.name} eats it. A favorite would have done more.`);
    this.saveSoon();
    this.ui?.refresh();
  }

  buy(foodId) {
    if (this.coins < 6) {
      this.toast("The shop wants 6 coins.");
      return;
    }
    this.coins -= 6;
    this.foods[foodId] = (this.foods[foodId] || 0) + 1;
    blip();
    this.toast(`Bought ${foodName(foodId).toLowerCase()}.`);
    this.saveSoon();
    this.ui?.refresh();
  }

  rename(uid, name) {
    const pet = this.pets.find((p) => p.uid === uid);
    const clean = String(name || "").trim().slice(0, 18);
    if (!pet || !clean) return;
    pet.name = clean;
    this.saveSoon();
    this.ui?.refresh();
  }

  setActive(uid) {
    if (!this.pets.some((p) => p.uid === uid)) return;
    if (this.mounted) this.dismount();
    this.activeUid = uid;
    const pet = this.activePet();
    this.toast(`${pet.name} is following.`);
    this.saveSoon();
    this.ui?.refresh();
  }

  cyclePet(dir) {
    if (this.pets.length < 2) return;
    if (this.mounted) this.dismount();
    const i = Math.max(0, this.pets.findIndex((p) => p.uid === this.activeUid));
    const next = this.pets[(i + dir + this.pets.length) % this.pets.length];
    this.setActive(next.uid);
  }

  toggleMount() {
    if (this.panelOpen) return;
    if (this.mounted) {
      this.interact();
      return;
    }
    const pet = this.activePet();
    const prof = mountProfile(pet);
    if (!prof.unlocked) {
      this.toast(prof.reason);
      return;
    }
    pet.x = this.player.x;
    pet.z = this.player.z;
    pet.y = heightAt(pet.x, pet.z);
    pet.yaw = this.player.yaw;
    const view = this.ensureView(pet);
    view.anim.group.position.set(pet.x, pet.y, pet.z);
    view.anim.group.rotation.y = pet.yaw;
    this.mounted = true;
    this.mountUid = pet.uid;
    this.flying = false;
    this.landing = false;
    this.mountSpeed = 0;
    this.mountVy = 0;
    this.stamina = prof.stamina;
    this.grounded = true;
    this.person.setSitting(true);
    view.anim.pivot.attach(this.person.group);
    this.mountFrom = { x: 0.95, y: 0.2, z: 0.35 };
    this.mountBlend = 0;
    this.person.group.position.set(this.mountFrom.x, this.mountFrom.y, this.mountFrom.z);
    this.person.group.rotation.set(0.18, 0, 0);
    blip();
    this.toast(`You mount ${pet.name}.`);
  }

  dismount() {
    const pet = this.pets.find((p) => p.uid === this.mountUid) || this.activePet();
    const yaw = pet ? pet.yaw : this.player.yaw;
    const x = (pet ? pet.x : this.player.x) + Math.cos(yaw) * 1.35;
    const z = (pet ? pet.z : this.player.z) - Math.sin(yaw) * 1.35;
    this.scene.attach(this.person.group);
    this.mounted = false;
    this.flying = false;
    this.landing = false;
    this.mountUid = null;
    this.mountSpeed = 0;
    this.person.setSitting(false);
    this.player.x = x;
    this.player.z = z;
    this.player.y = heightAt(x, z);
    this.player.yaw = yaw;
    this.grounded = true;
    this.person.group.position.set(x, this.player.y + HIP, z);
    this.person.group.rotation.set(0, yaw, 0);
    this.toast("Dismounted.");
  }

  useAbility() {
    if (this.panelOpen || this.abilityCd > 0) return;
    const pet = this.activePet();
    if (!pet) return;
    const ability = currentAbility(pet);
    if (!ability) return;
    this.abilityCd = 1.35;
    const sp = SPECIES[pet.species];
    creatureCall(sp, pet.stage);
    const struck = this.strikeNear(pet);
    if (this.mounted) {
      if (sp.ride?.fly) {
        this.flying = true;
        this.mountVy = sp.id === "aurora" || pet.stage === "prime" ? 16 : 12;
        this.toast(`${pet.name} climbs.`);
      } else if (pet.species === "tiger") {
        this.mountSpeed += 6;
        this.leapT = Math.max(this.leapT, 0.45);
        this.toast(`${pet.name} surges.`);
      } else if (ability.kind === "howl" || pet.species === "wolf") {
        this.buffT = 4.5;
        this.toast(`${pet.name} howls. The stride opens.`);
      } else if (ability.kind === "shove") this.tryShove(pet);
      else this.toast(`${pet.name} uses ${ability.name}.`);
      return;
    }
    if (ability.kind === "flutter" || ability.kind === "glide") {
      this.stats.birdFlutters += 1;
      this.glideT = ability.seconds || 1;
      this.glideCap = ability.cap || 1.2;
      this.player.vy = 3;
      this.addGrowth(pet, 1.5);
      this.toast(`${pet.name} uses ${ability.name}.`);
    } else if (ability.kind === "soar") {
      this.toast(`Mount ${pet.name} to fly. A flap on the ground is only practice.`);
      this.stats.birdFlutters += 1;
    } else if (ability.kind === "feline") {
      this.stats.felineHunts += 1;
      this.addGrowth(pet, 1.2);
      pet.x += Math.sin(pet.yaw) * 0.45;
      pet.z += Math.cos(pet.yaw) * 0.45;
      this.toast(`${pet.name} uses ${ability.name}.`);
    } else if (ability.kind === "strike") {
      if (ability.id === "guard" && !struck) this.tryCutBriar(pet);
      else if (!struck) {
        this.addGrowth(pet, 0.9);
        this.toast(`${ability.name}. Nothing is close enough to hit.`);
      }
    } else if (ability.kind === "howl") {
      this.buffT = 5;
      this.toast(`${pet.name} howls. You both pick up the pace.`);
    } else if (ability.kind === "shove") {
      this.tryShove(pet);
    } else if (ability.kind === "climb") {
      this.toast(canClimb(pet) ? "Sure feet. The high trail will hold." : "Not yet. They need to grow into it.");
    } else {
      pet.bond = Math.min(100, pet.bond + 2);
      this.addGrowth(pet, 0.7);
      this.toast(`${pet.name} uses ${ability.name}.`);
    }
    this.ui?.refresh();
  }

  tryCutBriar(pet) {
    let best = null;
    let bestD = 2.8;
    for (const briar of this.world.briars) {
      if (briar.cut) continue;
      const d = Math.hypot(pet.x - briar.x, pet.z - briar.z);
      if (d < bestD) {
        best = briar;
        bestD = d;
      }
    }
    if (!best) {
      this.toast("No briar close enough for Guard Strike.");
      return;
    }
    best.cut = true;
    best.mesh.visible = false;
    const col = this.world.colliders.find((c) => Math.hypot(c.x - best.x, c.z - best.z) < 0.3);
    if (col) col.disabled = true;
    if (!this.cutBriars.includes(best.id)) this.cutBriars.push(best.id);
    this.stats.briarsCut += 1;
    this.burst(best.x, best.y || heightAt(best.x, best.z) + 0.4, best.z);
    this.toast("Guard Strike clears the briar.");
    this.addXp(pet, 8);
    this.saveSoon();
  }

  tryShove(pet) {
    if (!pet || !stageAtLeast(pet.stage, "adult")) return false;
    let moved = false;
    for (const obstacle of this.world.obstacles) {
      if (obstacle.moved) continue;
      const dist = Math.hypot(pet.x - obstacle.x, pet.z - obstacle.z);
      if (dist > obstacle.r + 1.55) continue;
      const logs = obstacle.kind === "log" && pet.species === "bear";
      const rocks = obstacle.kind === "boulder" && pet.species === "elephant";
      if (!logs && !rocks) continue;
      obstacle.moved = true;
      obstacle.collider.disabled = true;
      const dx = obstacle.x - pet.x || 1;
      const dz = obstacle.z - pet.z || 0;
      const len = Math.hypot(dx, dz) || 1;
      obstacle.mesh.position.x += (dx / len) * 3.5;
      obstacle.mesh.position.z += (dz / len) * 3.5;
      if (!this.movedObstacles.includes(obstacle.id)) this.movedObstacles.push(obstacle.id);
      this.toast(logs ? "The bear shoves the log aside." : "The elephant rolls the boulder clear.");
      moved = true;
      this.saveSoon();
    }
    if (!moved && !this.mounted) this.toast("Nothing heavy within reach.");
    return moved;
  }

  labels() {
    const list = [];
    for (const pet of this.pets) {
      const sp = SPECIES[pet.species];
      list.push({
        text: `${pet.name} · ${stageLabel(pet.stage)}`,
        x: pet.x,
        y: pet.y + Math.max(0.8, sp.scale * 1.05),
        z: pet.z,
        kind: pet.uid === this.activeUid ? "active" : "pet",
      });
    }
    for (const wild of this.wilds) {
      const sp = SPECIES[wild.species];
      list.push({
        text: sp.name,
        x: wild.x,
        y: heightAt(wild.x, wild.z) + Math.max(0.7, sp.scale * 0.95),
        z: wild.z,
        kind: "wild",
      });
    }
    for (const marker of this.world.markers) {
      if (Math.hypot(marker.x - this.player.x, marker.z - this.player.z) > 28) continue;
      list.push({
        text: marker.name,
        x: marker.x,
        y: (marker.y ?? heightAt(marker.x, marker.z)) + 1.5,
        z: marker.z,
        kind: "mark",
      });
    }
    return list;
  }

  clockLabel() {
    const h = Math.floor(this.minutes / 60) % 24;
    const m = Math.floor(this.minutes % 60);
    return `Day ${String(this.day).padStart(2, "0")}   ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  currentMission() {
    const snap = { pets: this.pets, stats: this.stats };
    return MISSIONS.find((m) => !this.missionsDone[m.id]) || null;
  }

  writeSave() {
    const data = {
      v: 1,
      lastSeen: Date.now(),
      welcomed: this.welcomed,
      muted: this.muted,
      coins: this.coins,
      day: this.day,
      minutes: this.minutes,
      foods: this.foods,
      ownedAccessories: this.ownedAccessories,
      removedWild: this.removedWild,
      cutBriars: this.cutBriars,
      movedObstacles: this.movedObstacles,
      forageGone: this.forageGone,
      activeUid: this.activeUid,
      pets: this.pets.map((p) => ({
        uid: p.uid,
        species: p.species,
        name: p.name,
        stage: p.stage,
        growth: p.growth,
        xp: p.xp,
        level: p.level,
        bond: p.bond,
        playSeconds: p.playSeconds,
        accessories: p.accessories || [],
        lastFeedAt: p.lastFeedAt || 0,
      })),
      stats: this.stats,
      missionsDone: this.missionsDone,
    };
    try {
      persist(data);
    } catch {
      /* ignore quota */
    }
    this.lastSave = this.time;
    this.ui?.flashSaved();
  }

  saveSoon() {
    this.lastSave = this.time - 4.2;
  }

  toggleMute() {
    this.muted = !this.muted;
    setMuted(this.muted);
    this.saveSoon();
    this.ui?.refresh();
  }

  reset() {
    clearSave();
    location.reload();
  }
}
