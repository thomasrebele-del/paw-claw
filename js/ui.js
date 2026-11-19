import {
  AmbientLight,
  Color,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "../vendor/three.module.js";
import {
  ACCESSORIES,
  FOODS,
  MISSIONS,
  SPECIES,
  currentAbility,
  formatDuration,
  growthNeeds,
  lockedAbilities,
  mountProfile,
  petStats,
  sizeText,
  stageLabel,
  timeUntilNext,
  unlockedAbilities,
  xpNeed,
} from "./data.js";
import { regionName } from "./world.js";
import { buildCreature } from "./meshes.js";

function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

export function createUI(game) {
  const root = document.querySelector("#ui");
  root.innerHTML = `
    <section class="card brand">
      <div class="mark">🐾</div>
      <div>
        <p class="kicker">Early adventure</p>
        <h1>PAW & CLAW</h1>
      </div>
      <button class="text-btn ghost" data-act="settings" type="button">Settings</button>
    </section>
    <section class="card loc">
      <p class="kicker" data-f="clock">Day 01</p>
      <h2 data-f="region">Greenwood Forest</h2>
    </section>
    <div class="card coins"><span data-f="coins">0</span> coins</div>
    <section class="card vitals">
      <p class="kicker">You</p>
      <div class="bar hp"><span data-f="hp"></span></div>
      <p data-f="hp-label">120 / 120</p>
      <div data-f="boss-wrap" hidden>
        <p class="kicker" data-f="boss-name">Boss</p>
        <div class="bar boss"><span data-f="boss-hp"></span></div>
      </div>
    </section>
    <div class="hurt" data-f="hurt"></div>
    <canvas class="minimap" data-f="minimap" width="336" height="200"></canvas>
    <section class="card mission">
      <p class="kicker">Your adventure</p>
      <h3 data-f="mission-title">An unexpected friendship</h3>
      <p data-f="mission-summary"></p>
      <div class="bar"><span data-f="mission-bar"></span></div>
      <p data-f="mission-progress"></p>
    </section>
    <section class="card story" data-f="story">
      <p class="kicker">Your story starts here</p>
      <h2>A little wild. A little wonder.</h2>
      <p>Every great adventure begins with a new friend.</p>
    </section>
    <section class="card companion">
      <div class="row">
        <p class="kicker">Following</p>
        <span class="stage" data-f="stage">Baby</span>
      </div>
      <h3 data-f="pet-name">Maple</h3>
      <p data-f="pet-meta">Shiba Inu · Lv 1</p>
      <div class="bar"><span data-f="growth"></span></div>
      <p data-f="growth-label">Growth 8%</p>
      <div class="bar thin" data-f="stamina-wrap" hidden><span data-f="stamina"></span></div>
      <p data-f="ability"></p>
      <button class="mount-btn" data-f="mount" type="button">Mount</button>
    </section>
    <div class="card prompt" data-f="prompt">WASD explore</div>
    <nav class="card dock">
      <button type="button" data-act="companions">Companions<kbd>V</kbd></button>
      <button type="button" data-act="growth">Growth<kbd>G</kbd></button>
      <button type="button" data-act="missions">Missions<kbd>M</kbd></button>
      <button type="button" data-act="inventory">Inventory<kbd>I</kbd></button>
      <button type="button" data-act="journal">Journal<kbd>J</kbd></button>
      <button type="button" data-act="map">Map<kbd>P</kbd></button>
    </nav>
    <div class="toasts" data-f="toasts"></div>
    <div class="banner card" data-f="banner"></div>
    <div class="saved" data-f="saved">Adventure saved</div>
    <div data-f="panel-host"></div>
  `;

  const q = (name) => root.querySelector(`[data-f="${name}"]`);
  const ui = {
    root,
    panel: null,
    compare: [],
    preview: null,
    labels: [],
    toasts: [],
    toast(text) {
      this.toasts.push({ text, t: 4.2 });
      this.drawToasts();
    },
    banner(text) {
      const el = q("banner");
      el.innerHTML = `<strong>${esc(text)}</strong>`;
      el.classList.add("show");
      clearTimeout(this.bannerTimer);
      this.bannerTimer = setTimeout(() => el.classList.remove("show"), 3200);
    },
    flashSaved() {
      const el = q("saved");
      el.classList.add("show");
      clearTimeout(this.savedTimer);
      this.savedTimer = setTimeout(() => el.classList.remove("show"), 1200);
    },
    drawToasts() {
      q("toasts").innerHTML = this.toasts.map((t) => `<div class="toast card">${esc(t.text)}</div>`).join("");
    },
    toggle(name) {
      if (this.panel === name) this.close();
      else this.open(name);
    },
    open(name) {
      this.panel = name;
      game.panelOpen = true;
      this.renderPanel();
    },
    close() {
      this.panel = null;
      game.panelOpen = false;
      q("panel-host").innerHTML = "";
      if (this.preview) {
        this.preview.renderer.dispose();
        this.preview = null;
      }
    },
    refresh() {
      if (!this.panel) return;
      if (document.activeElement && document.activeElement.tagName === "INPUT") return;
      this.renderPanel();
    },
    renderPanel() {
      const host = q("panel-host");
      host.innerHTML = `<div class="backdrop" data-act="close"></div><section class="panel card">${this.panelHTML()}</section>`;
      if (this.panel === "growth") this.mountPreview();
      if (this.panel === "map") this.drawWorldMap(host.querySelector("canvas"));
    },
    panelHTML() {
      const header = (title, kicker) => `
        <header>
          <div><p class="kicker">${kicker}</p><h2>${title}</h2></div>
          <button class="close" data-act="close" type="button">×</button>
        </header>`;
      if (this.panel === "companions") return header("Your companions", "Collection") + this.companionsHTML();
      if (this.panel === "growth") return header("Growth", "Life stages") + this.growthHTML();
      if (this.panel === "missions") return header("Missions", "The trail") + this.missionsHTML();
      if (this.panel === "inventory") return header("Inventory", "Pack") + this.inventoryHTML();
      if (this.panel === "journal") return header("Discovery journal", "Seen in the wild") + this.journalHTML();
      if (this.panel === "map") return header("World map", "Greenwood and beyond") + `<canvas class="panel-map" width="1280" height="840"></canvas>`;
      if (this.panel === "shop") return header("Camp shop", "6 coins each") + this.shopHTML();
      if (this.panel === "settings") return header("Settings", "Adventure") + this.settingsHTML();
      return "";
    },
    companionsHTML() {
      const cards = game.pets.map((pet) => {
        const sp = SPECIES[pet.species];
        const prof = mountProfile(pet);
        const active = pet.uid === game.activeUid;
        return `<article class="pet ${active ? "active" : ""}">
          <div class="row">
            <strong>${esc(pet.name)}</strong>
            <span class="stage ${pet.stage}">${stageLabel(pet.stage)}</span>
          </div>
          <p>${esc(sp.name)} · Lv ${pet.level} · ${Math.floor(pet.growth)}% growth</p>
          <div class="bar"><span style="width:${Math.min(100, pet.growth)}%"></span></div>
          <p>Rideable: ${prof.rideable ? "Yes" : "No"}${prof.rideable ? ` · ${esc(prof.reason)}` : ""}</p>
          <div class="row">
            <button class="text-btn ghost" data-act="follow" data-uid="${pet.uid}" type="button">${active ? "Following" : "Follow"}</button>
            <button class="text-btn ghost" data-act="compare" data-uid="${pet.uid}" type="button">Compare</button>
          </div>
        </article>`;
      }).join("");
      const picked = this.compare.map((uid) => game.pets.find((p) => p.uid === uid)).filter(Boolean);
      let compare = "";
      if (picked.length) {
        compare = `<div class="compare">${picked.map((pet) => mountCard(pet)).join("")}</div>`;
      }
      return `<div class="list">${cards}</div><h3 style="margin-top:14px">Mount comparison</h3><p>Pick two companions. Only real mounts show riding stats.</p>${compare}`;
    },
    growthHTML() {
      const pet = this.growthPet();
      const sp = SPECIES[pet.species];
      const stats = petStats(pet);
      const prof = mountProfile(pet);
      const next = sp.stages[sp.stages.indexOf(pet.stage) + 1];
      const eta = timeUntilNext(pet, pet.uid === game.activeUid);
      const needs = growthNeeds(pet).map((line) => `<li>${esc(line)}</li>`).join("");
      const abilities = [
        ...unlockedAbilities(pet).map((a) => `<div class="ability"><b>${esc(a.name)}</b> · ${esc(a.blurb)}</div>`),
        ...lockedAbilities(pet).map((a) => `<div class="ability lock">${esc(a.name)} unlocks at ${stageLabel(a.stage)}. ${esc(a.blurb)}</div>`),
      ].join("");
      const foods = FOODS.filter((food) => (game.foods[food.id] || 0) > 0).map((food) => {
        const favorite = sp.diet.includes(food.id);
        return `<button class="feed" data-act="feed" data-uid="${pet.uid}" data-food="${food.id}" type="button">${esc(food.name)} ×${game.foods[food.id]}${favorite ? " · favorite" : ""}</button>`;
      }).join(" ");
      const options = game.pets.map((p) => `<option value="${p.uid}" ${p.uid === pet.uid ? "selected" : ""}>${esc(p.name)}</option>`).join("");
      return `<div class="grid">
        <div>
          <label class="kicker">Companion</label>
          <select data-act="pick-growth">${options}</select>
          <div class="row" style="margin-top:10px">
            <input data-act="rename" data-uid="${pet.uid}" value="${esc(pet.name)}" maxlength="18">
            <span class="stage ${pet.stage}">${stageLabel(pet.stage)}</span>
          </div>
          <p>${esc(sp.name)} · Lv ${pet.level} · bond ${Math.floor(pet.bond)}</p>
          <div class="bar"><span style="width:${Math.min(100, pet.growth)}%"></span></div>
          <p>Growth ${Math.floor(pet.growth)}%${next ? ` · next ${stageLabel(next)}` : " · fully grown"}</p>
          <p>${eta == null ? "No further stage." : `About ${formatDuration(eta)} of companionship, sooner with food and missions.`}</p>
          <p>Size ${esc(sizeText(pet))}</p>
          <div class="stats">
            <div class="stat"><b>${stats.hp}</b>Health</div>
            <div class="stat"><b>${stats.atk}</b>Attack</div>
            <div class="stat"><b>${stats.def}</b>Defense</div>
            <div class="stat"><b>${stats.speed.toFixed(1)}</b>Speed</div>
          </div>
          <p class="kicker">What grows them</p>
          <ul class="needs">${needs}</ul>
          <p class="kicker" style="margin-top:12px">Abilities</p>
          ${abilities}
          <p class="kicker" style="margin-top:12px">Feed</p>
          <div class="row" style="flex-wrap:wrap">${foods || "<span class='warn'>Gather food or visit the camp shop.</span>"}</div>
        </div>
        <div>
          <p class="kicker">${next ? `Next stage · ${stageLabel(next)}` : "Current stage"}</p>
          <canvas id="preview" width="360" height="360"></canvas>
          ${mountCard(pet)}
          <p>Rideable: <b>${prof.rideable ? "YES" : "NO"}</b></p>
          <p>${esc(prof.reason || "")}</p>
          ${prof.unlocked ? `<button class="mount-btn" data-act="mount" type="button">Mount ${esc(pet.name)}</button>` : ""}
        </div>
      </div>`;
    },
    missionsHTML() {
      const snap = { pets: game.pets, stats: game.stats };
      return `<div class="list">${MISSIONS.map((mission) => {
        const done = !!game.missionsDone[mission.id];
        return `<article class="mission-row">
          <div>
            <strong>${esc(mission.title)}</strong>
            <p>${esc(mission.summary)}</p>
            <p>${esc(mission.progress(snap))}</p>
            <div class="bar"><span style="width:${Math.round(mission.ratio(snap) * 100)}%"></span></div>
          </div>
          <span class="stage ${done ? "adult" : "juvenile"}">${done ? "Done" : "Open"}</span>
        </article>`;
      }).join("")}</div>`;
    },
    inventoryHTML() {
      const foods = FOODS.map((food) => `
        <article class="food">
          <div><strong>${esc(food.name)}</strong><p>${esc(food.hint)} · ${game.foods[food.id] || 0} held</p></div>
          <button class="feed" data-act="feed" data-uid="${game.activeUid}" data-food="${food.id}" type="button">Feed follower</button>
        </article>`).join("");
      const gear = game.ownedAccessories.length
        ? game.ownedAccessories.map((id) => `<span class="pet">${esc(ACCESSORIES[id] || id)}</span>`).join("")
        : "<p>Missions leave bells, ribbons, and sashes on the companion who earned them.</p>";
      return `<div class="list">${foods}</div><h3 style="margin-top:14px">Accessories</h3><div class="list">${gear}</div>
        <button class="text-btn" data-act="shop" type="button" style="margin-top:12px">Open camp shop</button>`;
    },
    journalHTML() {
      return `<div class="list">${Object.values(SPECIES).map((sp) => {
        const known = !!game.stats.discovered[sp.id];
        const owned = game.pets.find((p) => p.species === sp.id);
        return `<article class="journal-row">
          <strong>${known ? esc(sp.name) : "Unknown"}</strong>
          <p>${known ? esc(sp.blurb) : "Get closer, or befriend them."}</p>
          <p>${owned ? `In your collection · ${stageLabel(owned.stage)}` : known ? "Seen" : ""}</p>
        </article>`;
      }).join("")}</div>`;
    },
    shopHTML() {
      return `<p>You have ${game.coins} coins. Feeding a favorite is worth more than feeding often.</p><div class="list">${FOODS.map((food) => `
        <article class="food">
          <div><strong>${esc(food.name)}</strong><p>${esc(food.hint)}</p></div>
          <button class="buy" data-act="buy" data-food="${food.id}" type="button">Buy · 6</button>
        </article>`).join("")}</div>`;
    },
    settingsHTML() {
      return `<p>Growth, names, and who follows you stay on this browser.</p>
        <div class="row">
          <button class="text-btn ghost" data-act="mute" type="button">${game.muted ? "Unmute" : "Mute"}</button>
          <button class="text-btn" data-act="reset" type="button">Reset adventure</button>
        </div>`;
    },
    growthPet() {
      return game.pets.find((p) => p.uid === this.growthUid) || game.activePet();
    },
    mountPreview() {
      const canvas = root.querySelector("#preview");
      if (!canvas) return;
      const pet = this.growthPet();
      const sp = SPECIES[pet.species];
      const next = sp.stages[sp.stages.indexOf(pet.stage) + 1] || pet.stage;
      if (this.preview) {
        this.preview.renderer.dispose();
        if (this.preview.creature) this.preview.creature.dispose();
      }
      const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setSize(180, 180, false);
      const scene = new Scene();
      scene.background = new Color("#e7f3e4");
      const camera = new PerspectiveCamera(35, 1, 0.1, 50);
      const creature = buildCreature(pet.species, next, next === pet.stage ? pet.growth / 100 : 0, pet.accessories || []);
      scene.add(creature.group);
      const fit = Math.max(1.4, sp.scale * 2.3);
      camera.position.set(fit, fit * 0.7, fit * 1.15);
      camera.lookAt(0, fit * 0.28, 0);
      scene.add(new AmbientLight("#ffffff", 1));
      scene.add(new DirectionalLight("#fff4dc", 1.2));
      this.preview = { renderer, scene, camera, creature };
    },
    update(dt) {
      const pet = game.activePet();
      q("clock").textContent = game.clockLabel();
      q("region").textContent = regionName(game.player.x, game.player.z);
      q("coins").textContent = String(game.coins);
      const hpPct = Math.max(0, game.player.hp / game.player.maxHp);
      q("hp").style.width = `${Math.round(hpPct * 100)}%`;
      q("hp-label").textContent = `${Math.ceil(game.player.hp)} / ${game.player.maxHp}`;
      q("hurt").classList.toggle("on", game.player.hit > 0);
      const boss = game.wilds.find((w) => w.boss && !w.down && Math.hypot(w.x - game.player.x, w.z - game.player.z) < 32);
      const bossWrap = q("boss-wrap");
      if (boss) {
        bossWrap.hidden = false;
        q("boss-name").textContent = boss.name;
        q("boss-hp").style.width = `${Math.max(0, Math.round((boss.hp / boss.maxHp) * 100))}%`;
      } else bossWrap.hidden = true;
      const mission = game.currentMission();
      const snap = { pets: game.pets, stats: game.stats };
      if (mission) {
        q("mission-title").textContent = mission.title;
        q("mission-summary").textContent = mission.summary;
        q("mission-progress").textContent = mission.progress(snap);
        q("mission-bar").style.width = `${Math.round(mission.ratio(snap) * 100)}%`;
      } else {
        q("mission-title").textContent = "The wilds are quiet";
        q("mission-summary").textContent = "Every written trail is finished.";
        q("mission-progress").textContent = "";
        q("mission-bar").style.width = "100%";
      }
      if (game.stats.befriended > 0) q("story").style.display = "none";
      if (pet) {
        const sp = SPECIES[pet.species];
        const ability = currentAbility(pet);
        const prof = mountProfile(pet);
        q("pet-name").textContent = pet.name;
        q("stage").textContent = stageLabel(pet.stage);
        q("stage").className = `stage ${pet.stage}`;
        q("pet-meta").textContent = `${sp.name} · Lv ${pet.level}`;
        q("growth").style.width = `${Math.min(100, pet.growth)}%`;
        q("growth-label").textContent = `Growth ${Math.floor(pet.growth)}% · ${Math.floor(pet.xp)}/${xpNeed(pet.level)} xp`;
        q("ability").textContent = ability ? `F  ${ability.name}` : "";
        const mountBtn = q("mount");
        if (game.mounted) {
          mountBtn.textContent = "Dismount";
          mountBtn.classList.remove("locked");
        } else if (!prof.rideable) {
          mountBtn.textContent = "Not a mount";
          mountBtn.classList.add("locked");
        } else if (!prof.unlocked) {
          mountBtn.textContent = prof.reason;
          mountBtn.classList.add("locked");
        } else {
          mountBtn.textContent = `Mount ${pet.name}`;
          mountBtn.classList.remove("locked");
        }
        const wrap = q("stamina-wrap");
        if (game.mounted) {
          wrap.hidden = false;
          q("stamina").style.width = `${Math.max(0, (game.stamina / Math.max(1, prof.stamina)) * 100)}%`;
        } else wrap.hidden = true;
      }
      q("prompt").textContent = game.prompt();
      this.toasts = this.toasts.filter((t) => {
        t.t -= dt;
        return t.t > 0;
      });
      if (this.toasts.length !== q("toasts").children.length) this.drawToasts();
      this.drawLabels();
      this.drawMinimap(q("minimap"));
      if (this.preview && this.panel === "growth") {
        this.preview.creature.group.rotation.y += dt * 0.6;
        this.preview.creature.animate(dt, { moving: true, flap: true, flapStrong: true });
        this.preview.renderer.render(this.preview.scene, this.preview.camera);
      }
    },
    drawLabels() {
      const labels = game.labels();
      while (this.labels.length < labels.length) {
        const el = document.createElement("div");
        el.style.cssText = "position:absolute;transform:translate(-50%,-100%);font-size:12px;font-weight:600;padding:3px 7px;border-radius:999px;background:rgba(255,252,247,.92);pointer-events:none;white-space:nowrap";
        root.append(el);
        this.labels.push(el);
      }
      const w = window.innerWidth;
      const h = window.innerHeight;
      labels.forEach((label, i) => {
        const el = this.labels[i];
        const v = new Vector3(label.x, label.y, label.z).project(game.camera);
        if (v.z > 1) {
          el.style.display = "none";
          return;
        }
        el.style.display = "block";
        el.style.left = `${(v.x * 0.5 + 0.5) * w}px`;
        el.style.top = `${(-v.y * 0.5 + 0.5) * h}px`;
        el.textContent = label.text;
      });
      for (let i = labels.length; i < this.labels.length; i++) this.labels[i].style.display = "none";
    },
    drawMinimap(canvas) {
      paintMap(canvas, game, true);
    },
    drawWorldMap(canvas) {
      if (canvas) paintMap(canvas, game, false);
    },
  };

  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-act]");
    if (!button) return;
    const act = button.dataset.act;
    if (act === "close") ui.close();
    else if (act === "settings") ui.toggle("settings");
    else if (["companions", "growth", "missions", "inventory", "journal", "map", "shop"].includes(act)) ui.toggle(act);
    else if (act === "follow") game.setActive(button.dataset.uid);
    else if (act === "compare") {
      ui.compare = ui.compare.filter((id) => id !== button.dataset.uid);
      ui.compare.push(button.dataset.uid);
      ui.compare = ui.compare.slice(-2);
      ui.refresh();
    } else if (act === "feed") game.feed(button.dataset.uid, button.dataset.food);
    else if (act === "buy") game.buy(button.dataset.food);
    else if (act === "mount") {
      ui.close();
      game.setActive(ui.growthPet().uid);
      game.toggleMount();
    } else if (act === "mute") game.toggleMute();
    else if (act === "reset") {
      if (confirm("Reset this adventure? Companions and growth will be cleared.")) game.reset();
    } else if (button === q("mount")) game.toggleMount();
  });
  root.addEventListener("change", (event) => {
    const el = event.target;
    if (el.dataset.act === "rename") game.rename(el.dataset.uid, el.value);
    if (el.dataset.act === "pick-growth") {
      ui.growthUid = el.value;
      ui.renderPanel();
    }
  });
  q("mount").addEventListener("click", (event) => {
    event.stopPropagation();
    game.toggleMount();
  });

  ui.growthUid = game.activeUid;
  return ui;
}

function mountCard(pet) {
  const prof = mountProfile(pet);
  if (!prof.rideable) return `<div class="pet"><strong>${esc(pet.name)}</strong><p>Rideable: No</p></div>`;
  return `<div class="pet">
    <strong>${esc(pet.name)}</strong>
    <p>Rideable: Yes · ${esc(prof.reason)}</p>
    <p>Speed ${prof.speed.toFixed(1)} · stamina ${prof.stamina} · jump ${prof.jump.toFixed(1)}</p>
    <p>${esc(prof.terrain)}. ${esc(prof.special)}</p>
    <p>${prof.fly ? "Flying mount." : "Ground mount."} ${prof.jumpReady ? "" : "Full jump is still locked."}</p>
  </div>`;
}

function paintMap(canvas, game, follow) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#e7f2df";
  ctx.fillRect(0, 0, w, h);
  const bounds = follow
    ? { x: game.player.x - 70, z: game.player.z - 42, s: w / 140 }
    : { x: -130, z: -130, s: w / 280 };
  const pt = (x, z) => [ (x - bounds.x) * bounds.s, (z - bounds.z) * bounds.s ];
  const rect = (x, z, rw, rh, color) => {
    const [px, py] = pt(x, z);
    ctx.fillStyle = color;
    ctx.fillRect(px, py, rw * bounds.s, rh * bounds.s);
  };
  rect(-48, -130, 200, 82, "#d7e4c4");
  rect(68, -40, 80, 120, "#efe3bf");
  rect(-130, -40, 82, 90, "#e4efc4");
  rect(-20, 70, 40, 60, "#ead9c0");
  for (const marker of game.world.markers) {
    const [x, y] = pt(marker.x, marker.z);
    ctx.fillStyle = "#1e6b43";
    ctx.fillRect(x - 2, y - 2, 4, 4);
  }
  for (const wild of game.wilds) {
    const [x, y] = pt(wild.x, wild.z);
    ctx.fillStyle = "#c9842a";
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const pet of game.pets) {
    const [x, y] = pt(pet.x, pet.z);
    ctx.fillStyle = pet.uid === game.activeUid ? "#1e6b43" : "#7aa88a";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  const [px, py] = pt(game.player.x, game.player.z);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(game.player.yaw);
  ctx.fillStyle = "#1c2a22";
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(4, 5);
  ctx.lineTo(-4, 5);
  ctx.fill();
  ctx.restore();
}
