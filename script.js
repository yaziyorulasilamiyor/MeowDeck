// MeowDeck v2 - vanilla JavaScript virtual pet loop.

if (!window.db) {
  window.db = {
    _key: "cat",
    async getCat() {
      try {
        return JSON.parse(localStorage.getItem(this._key));
      } catch {
        return null;
      }
    },
    async upsertCat(payload) {
      const current = (await this.getCat()) || {};
      const next = {
        id: current.id || payload.id || 1,
        ...current,
        ...payload,
      };
      localStorage.setItem(this._key, JSON.stringify(next));
      return next.id;
    },
    async reset() {
      localStorage.removeItem(this._key);
    },
  };
}

window.addEventListener("DOMContentLoaded", () => {
  const ASSETS = {
    dayBg: "assets/main/lightbgmain.png",
    nightBg: "assets/main/DarkBg.png",
    idleCat: "assets/main/cat_idle.gif",
    sleepingCat: "assets/playroom/cat_sleeping.gif",
    bathIdle: "assets/bathroom/idlecat2.png",
    bathHappy: "assets/bathroom/cathappy.png",
    bathAngry: "assets/bathroom/catangry.png",
    bathAnim: "assets/bathroom/catbath.gif",
    sceneDirty: "assets/scene2/dirtycat.png",
    sceneBox: "assets/scene2/anim.gif",
    heartFull: "assets/ui/dolukalp.png",
    heartEmpty: "assets/ui/boskalp.png",
    music: "assets/audio/music_bg.mp3",
  };

  const DEFAULT_STATS = {
    happiness: 2,
    hunger: 2,
    cleanliness: 2,
    energy: 2,
  };

  const STAT_META = [
    { key: "happiness", label: "Happy" },
    { key: "hunger", label: "Full" },
    { key: "cleanliness", label: "Clean" },
    { key: "energy", label: "Energy" },
  ];

  const TRAITS = [
    { id: "shy", title: "Shy", desc: "Soft paws, slow trust.", src: "assets/traits/shy.gif" },
    { id: "meowy", title: "Meowy", desc: "Answers every silence.", src: "assets/traits/meowy.gif" },
    { id: "excity", title: "Excited", desc: "A spark with whiskers.", src: "assets/traits/excity.gif" },
    { id: "lazy", title: "Lazy", desc: "Professional nap critic.", src: "assets/traits/lazy.gif" },
    { id: "angry", title: "Spicy", desc: "Tiny drama, big opinions.", src: "assets/traits/angry.gif" },
    { id: "careless", title: "Careless", desc: "Does what the tail wants.", src: "assets/traits/careless.gif" },
    { id: "attention", title: "Attached", desc: "The lap is not optional.", src: "assets/traits/attention.gif" },
    { id: "fragile", title: "Fragile", desc: "Handle with gentle snacks.", src: "assets/traits/fragile.gif" },
    { id: "fatty", title: "Round", desc: "A snack-shaped philosopher.", src: "assets/traits/fatty.gif" },
  ];

  const MOODS = {
    hungry: {
      label: "Hungry",
      copy: "The bowl is looking heartbreakingly empty.",
      asset: ASSETS.idleCat,
    },
    tired: {
      label: "Tired",
      copy: "Tiny paws need a serious nap.",
      asset: ASSETS.sleepingCat,
    },
    dirty: {
      label: "Dirty",
      copy: "The fur situation is getting dramatic.",
      asset: ASSETS.idleCat,
    },
    sad: {
      label: "Sad",
      copy: "A little attention would warm the room.",
      asset: ASSETS.idleCat,
    },
    happy: {
      label: "Happy",
      copy: "Purring like the sun belongs here.",
      asset: ASSETS.idleCat,
    },
    calm: {
      label: "Calm",
      copy: "Cozy, balanced, and quietly watching.",
      asset: ASSETS.idleCat,
    },
  };

  const ZERO_MESSAGES = {
    happiness: "Happiness is empty. Try playing.",
    hunger: "Fullness is empty. Time for food.",
    cleanliness: "Cleanliness is empty. Bath time.",
    energy: "Energy is empty. Sleep will help.",
  };

  const PHASES = ["Morning", "Evening", "Night"];
  const DECAY_INTERVAL_MS = 110 * 1000;
  const DECAY_ORDER = ["hunger", "energy", "happiness", "cleanliness", "hunger"];

  const el = {
    screens: {
      splash: document.getElementById("splash"),
      select: document.getElementById("select"),
      traits: document.getElementById("traits"),
      scene2: document.getElementById("scene2"),
      main: document.getElementById("main"),
      playroom: document.getElementById("playroom"),
      bathroom: document.getElementById("bathroom"),
      profile: document.getElementById("profile"),
    },
    toast: document.getElementById("toast"),
    audioBtn: document.getElementById("btn-audio"),
    cats: Array.from(document.querySelectorAll(".cat")),
    cursor: document.getElementById("cursor"),
    traitPreview: document.getElementById("trait-preview"),
    traitName: document.querySelector("#traits .trait-name"),
    traitDesc: document.querySelector("#traits .trait-desc"),
    traitLeft: document.querySelector("#traits .trait-nav.left"),
    traitRight: document.querySelector("#traits .trait-nav.right"),
    traitConfirm: document.getElementById("trait-confirm"),
    nameModal: document.getElementById("name-modal"),
    nameInput: document.getElementById("name-input"),
    nameOk: document.getElementById("name-ok"),
    nameCancel: document.getElementById("name-cancel"),
    scene2Cat: document.getElementById("scene2-cat"),
    scene2Label: document.getElementById("scene2-label"),
    scene2Msg1: document.getElementById("scene2-msg1"),
    scene2Msg2: document.getElementById("scene2-msg2"),
    scene2Bath: document.getElementById("btn-bath"),
    mainScreen: document.getElementById("main"),
    mainBg: document.getElementById("main-bg-img"),
    mainName: document.getElementById("main-cat-name"),
    mainTrait: document.getElementById("main-trait-label"),
    mainMood: document.getElementById("main-cat-mood"),
    moodLabel: document.getElementById("mood-label"),
    phaseLabel: document.getElementById("phase-label"),
    dayLabel: document.getElementById("day-label"),
    phaseToggle: document.getElementById("btn-phase-toggle"),
    statList: document.getElementById("stat-list"),
    mainCat: document.getElementById("main-cat-img"),
    catZone: document.querySelector(".cat-zone"),
    catFeedback: document.getElementById("cat-feedback"),
    alertBanner: document.getElementById("alert-banner"),
    btnProfile: document.getElementById("btn-profile"),
    btnSettings: document.getElementById("btn-settings"),
    btnCredits: document.getElementById("btn-credits"),
    btnPlayroom: document.getElementById("btn-playroom"),
    btnBathroom: document.getElementById("btn-bathroom"),
    btnFeed: document.getElementById("btn-feed"),
    btnPlay: document.getElementById("btn-play"),
    btnBathMain: document.getElementById("btn-bath-main"),
    btnSleep: document.getElementById("btn-sleep"),
    playroomBack: document.getElementById("btn-playroom-back"),
    playroomToy: document.getElementById("btn-playroom-toy"),
    mouseChase: document.getElementById("btn-mouse-chase"),
    playBall: document.getElementById("play-ball"),
    playMouse: document.getElementById("play-mouse"),
    playScore: document.getElementById("play-score"),
    playInstruction: document.getElementById("playroom-instruction"),
    bathCat: document.getElementById("bath-cat"),
    bathTitle: document.getElementById("bath-title"),
    bathCopy: document.getElementById("bath-copy"),
    bathProgress: document.getElementById("bath-progress"),
    bathClean: document.getElementById("btn-bathroom-clean"),
    bathBack: document.getElementById("btn-bathroom-back"),
    bathDone: document.getElementById("btn-try-playing"),
    profileClose: document.getElementById("btn-profile-close"),
    profileAdopted: document.getElementById("profile-adopted"),
    profileName: document.getElementById("profile-name"),
    profileTrait: document.getElementById("profile-trait"),
    profileMood: document.getElementById("profile-mood"),
    settingsModal: document.getElementById("settings-modal"),
    settingsMute: document.getElementById("settings-mute"),
    settingsPhase: document.getElementById("settings-phase"),
    settingsReset: document.getElementById("settings-reset"),
    settingsClose: document.getElementById("settings-close"),
    creditsModal: document.getElementById("credits-modal"),
    creditsClose: document.getElementById("credits-close"),
  };

  const app = {
    cat: null,
    currentScreen: "splash",
    lastScreen: "main",
    selectedCatIndex: 4,
    traitIndex: 0,
    decayStep: 0,
    decayTimer: null,
    toastTimer: null,
    alertTimer: null,
    feedbackTimer: null,
    transientTimer: null,
    transientMood: null,
    toyTimer: null,
    mouseTimer: null,
    bathTimer: null,
    bathRunning: false,
    bathComplete: false,
    bathMode: "care",
  };

  const Sound = {
    music: null,
    muted: localStorage.getItem("meowdeck-muted") === "true",
    ctx: null,
    playMusic() {
      if (this.muted || this.music) return;
      const audio = new Audio(ASSETS.music);
      audio.loop = true;
      audio.volume = 0.2;
      audio.muted = this.muted;
      audio.play().catch(() => {});
      this.music = audio;
    },
    setMuted(value) {
      this.muted = Boolean(value);
      localStorage.setItem("meowdeck-muted", String(this.muted));
      if (this.music) this.music.muted = this.muted;
      renderAudioLabels();
    },
    toggleMute() {
      this.setMuted(!this.muted);
    },
    blip(kind = "soft") {
      if (this.muted) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = this.ctx || new AudioContext();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      const pitch = kind === "alert" ? 170 : kind === "happy" ? 530 : 360;
      osc.type = "square";
      osc.frequency.setValueAtTime(pitch, now);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    },
  };

  function clamp(value, min = 0, max = 3) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.max(min, Math.min(max, Math.round(number)));
  }

  function cleanName(value) {
    const text = String(value || "").trim();
    return text ? text.slice(0, 16) : "Miso";
  }

  function parseTime(value) {
    if (Number.isFinite(Number(value)) && Number(value) > 0) return Number(value);
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : Date.now();
  }

  function realWorldPhase() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 17) return "Morning";
    if (hour >= 17 && hour < 21) return "Evening";
    return "Night";
  }

  function computeCalendarDay(timestamp) {
    const adopted = parseTime(timestamp || Date.now());
    return Math.max(1, Math.floor((Date.now() - adopted) / 86400000) + 1);
  }

  function normalizePhase(value) {
    return PHASES.includes(value) ? value : realWorldPhase();
  }

  function normalizeCat(raw) {
    if (!raw) return null;
    const adopted = parseTime(raw.adopted_at || raw.created_at || Date.now());
    return {
      id: raw.id == null ? undefined : raw.id,
      name: cleanName(raw.name),
      avatar: raw.avatar || "white",
      personality: raw.personality || null,
      adopted_at: adopted,
      day: Math.max(1, Number(raw.day) || computeCalendarDay(adopted)),
      phase: normalizePhase(raw.phase),
      playScore: Math.max(0, Number(raw.playScore) || 0),
      happiness: clamp(raw.happiness ?? raw.stats?.happiness ?? DEFAULT_STATS.happiness),
      hunger: clamp(raw.hunger ?? raw.stats?.hunger ?? DEFAULT_STATS.hunger),
      cleanliness: clamp(raw.cleanliness ?? raw.stats?.cleanliness ?? DEFAULT_STATS.cleanliness),
      energy: clamp(raw.energy ?? raw.stats?.energy ?? DEFAULT_STATS.energy),
    };
  }

  function toDbPayload(cat, includeId) {
    const payload = {
      name: cleanName(cat.name),
      avatar: cat.avatar || "white",
      personality: cat.personality || null,
      adopted_at: cat.adopted_at || Date.now(),
      day: Math.max(1, Number(cat.day) || 1),
      phase: normalizePhase(cat.phase),
      playScore: Math.max(0, Number(cat.playScore) || 0),
      happiness: clamp(cat.happiness),
      cleanliness: clamp(cat.cleanliness),
      hunger: clamp(cat.hunger),
      energy: clamp(cat.energy),
    };
    if (includeId && cat.id != null) payload.id = cat.id;
    return payload;
  }

  async function loadCat() {
    const raw = await window.db.getCat().catch(() => null);
    app.cat = normalizeCat(raw);
    return app.cat;
  }

  async function saveCat(patch) {
    const existing = app.cat || normalizeCat(await window.db.getCat().catch(() => null));
    const seed = existing || normalizeCat({
      name: "Miso",
      avatar: "white",
      adopted_at: Date.now(),
      day: 1,
      phase: realWorldPhase(),
      playScore: 0,
      ...DEFAULT_STATS,
    });
    const next = normalizeCat({ ...seed, ...patch });
    const id = await window.db.upsertCat(toDbPayload(next, Boolean(existing?.id))).catch(() => undefined);
    const stored = normalizeCat(await window.db.getCat().catch(() => null));
    app.cat = stored || normalizeCat({ ...next, id: next.id || id });
    return app.cat;
  }

  function setSafeImage(img, src, fallback = ASSETS.idleCat) {
    if (!img || !src) return;
    img.onerror = () => {
      img.onerror = null;
      img.src = fallback;
    };
    if (img.getAttribute("src") !== src) img.src = src;
  }

  function applyScale() {
    const safeW = Math.max(320, window.innerWidth - 24);
    const safeH = Math.max(320, window.innerHeight - 24);
    const scale = Math.min(safeW / 960, safeH / 720, 1);
    document.documentElement.style.setProperty("--ui-scale", String(scale));
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function formatDate(timestamp) {
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(timestamp));
    } catch {
      return new Date(timestamp).toLocaleString();
    }
  }

  function getTraitTitle(id) {
    return TRAITS.find((trait) => trait.id === id)?.title || "Mystery";
  }

  function computeMood(cat) {
    if (!cat) return "calm";
    if (cat.hunger <= 0) return "hungry";
    if (cat.energy <= 0) return "tired";
    if (cat.cleanliness <= 0) return "dirty";
    if (cat.happiness <= 0) return "sad";
    const total = cat.happiness + cat.hunger + cat.cleanliness + cat.energy;
    if (total >= 10 && cat.happiness >= 2) return "happy";
    return "calm";
  }

  function currentMoodKey() {
    return app.transientMood || computeMood(app.cat);
  }

  function showScreen(name) {
    Object.entries(el.screens).forEach(([screenName, screen]) => {
      if (!screen) return;
      screen.classList.toggle("hidden", screenName !== name);
      if (screenName !== name) screen.classList.remove("screen-enter");
    });

    const next = el.screens[name];
    if (next) {
      next.classList.add("screen-enter");
      window.setTimeout(() => next.classList.remove("screen-enter"), 230);
    }

    app.currentScreen = name;
    if (name === "main") {
      renderMain();
      startDecayLoop();
    }
    if (name === "profile") renderProfile();
    if (name === "playroom") renderPlayroom();
  }

  function showToast(message, ms = 1800) {
    if (!el.toast) return;
    window.clearTimeout(app.toastTimer);
    el.toast.textContent = message;
    el.toast.classList.remove("hidden");
    app.toastTimer = window.setTimeout(() => el.toast.classList.add("hidden"), ms);
  }

  function showAlert(message, danger = false) {
    if (!el.alertBanner) return;
    window.clearTimeout(app.alertTimer);
    el.alertBanner.textContent = message;
    el.alertBanner.classList.toggle("is-danger", danger);
    el.alertBanner.classList.remove("hidden");
    Sound.blip(danger ? "alert" : "soft");
    app.alertTimer = window.setTimeout(() => el.alertBanner.classList.add("hidden"), 2800);
  }

  function showFeedback(message) {
    if (!el.catFeedback) return;
    window.clearTimeout(app.feedbackTimer);
    el.catFeedback.textContent = message;
    el.catFeedback.classList.remove("hidden");
    app.feedbackTimer = window.setTimeout(() => el.catFeedback.classList.add("hidden"), 1350);
  }

  function flashButton(button) {
    if (!button) return;
    button.classList.add("is-active");
    window.setTimeout(() => button.classList.remove("is-active"), 250);
  }

  function renderAudioLabels() {
    const text = Sound.muted ? "Unmute audio" : "Mute audio";
    if (el.audioBtn) {
      el.audioBtn.textContent = Sound.muted ? "Muted" : "Sound";
      el.audioBtn.setAttribute("aria-pressed", String(Sound.muted));
      el.audioBtn.title = text;
    }
    if (el.settingsMute) el.settingsMute.textContent = text;
  }

  function backgroundForPhase(phase) {
    return phase === "Morning" ? ASSETS.dayBg : ASSETS.nightBg;
  }

  function renderMain() {
    if (!app.cat) return;
    const moodKey = currentMoodKey();
    const mood = MOODS[moodKey] || MOODS.calm;
    const phaseClass = `phase-${String(app.cat.phase).toLowerCase()}`;

    setSafeImage(el.mainBg, backgroundForPhase(app.cat.phase), ASSETS.dayBg);
    setSafeImage(el.mainCat, mood.asset, ASSETS.idleCat);

    if (el.mainScreen) {
      el.mainScreen.classList.remove("phase-morning", "phase-evening", "phase-night");
      el.mainScreen.classList.add(phaseClass);
    }
    if (el.mainName) el.mainName.textContent = app.cat.name;
    if (el.mainTrait) el.mainTrait.textContent = getTraitTitle(app.cat.personality);
    if (el.mainMood) el.mainMood.textContent = mood.copy;
    if (el.moodLabel) el.moodLabel.textContent = mood.label;
    if (el.phaseLabel) el.phaseLabel.textContent = app.cat.phase;
    if (el.dayLabel) el.dayLabel.textContent = `Day ${app.cat.day}`;
    if (el.catZone) el.catZone.className = `cat-zone is-${moodKey}`;

    renderStatList();
  }

  function renderStatList() {
    if (!el.statList || !app.cat) return;
    el.statList.innerHTML = STAT_META.map((stat) => {
      const value = clamp(app.cat[stat.key]);
      const pips = [0, 1, 2].map((index) => {
        const filled = index < value ? " is-filled" : "";
        return `<span class="stat-pip${filled}"></span>`;
      }).join("");
      return `
        <div class="stat-row">
          <span>${stat.label}</span>
          <span class="stat-pips" aria-hidden="true">${pips}</span>
          <span class="stat-value">${value}/3</span>
        </div>
      `;
    }).join("");
  }

  function setHearts(prefix, value) {
    const safeValue = clamp(value);
    for (let index = 0; index < 3; index += 1) {
      const heart = document.getElementById(`h-${prefix}-${index}`);
      if (!heart) continue;
      setSafeImage(heart, index < safeValue ? ASSETS.heartFull : ASSETS.heartEmpty, ASSETS.heartEmpty);
    }
  }

  function renderProfile() {
    if (!app.cat) return;
    const mood = MOODS[computeMood(app.cat)] || MOODS.calm;
    if (el.profileAdopted) el.profileAdopted.textContent = formatDate(app.cat.adopted_at);
    if (el.profileName) el.profileName.textContent = app.cat.name;
    if (el.profileTrait) el.profileTrait.textContent = getTraitTitle(app.cat.personality);
    if (el.profileMood) el.profileMood.textContent = `${mood.label}: ${mood.copy}`;

    setHearts("happiness", app.cat.happiness);
    setHearts("cleanliness", app.cat.cleanliness);
    setHearts("hunger", app.cat.hunger);
    setHearts("energy", app.cat.energy);
  }

  function maybeWarnZeros(before, after) {
    STAT_META.forEach((stat) => {
      if (before[stat.key] > 0 && after[stat.key] <= 0) {
        showAlert(ZERO_MESSAGES[stat.key], true);
      }
    });
  }

  async function changeStats(delta, options = {}) {
    if (!app.cat) return null;
    const before = {
      happiness: app.cat.happiness,
      hunger: app.cat.hunger,
      cleanliness: app.cat.cleanliness,
      energy: app.cat.energy,
    };
    const patch = {};
    Object.keys(DEFAULT_STATS).forEach((key) => {
      patch[key] = clamp((app.cat[key] ?? DEFAULT_STATS[key]) + (delta[key] || 0));
    });

    const cat = await saveCat(patch);
    maybeWarnZeros(before, cat);

    if (app.currentScreen === "main") renderMain();
    if (app.currentScreen === "profile") renderProfile();
    if (app.currentScreen === "playroom") renderPlayroom();
    if (options.message) showToast(options.message);
    return cat;
  }

  function setTransientMood(moodKey, message, duration = 1400) {
    window.clearTimeout(app.transientTimer);
    app.transientMood = moodKey;
    if (app.currentScreen === "main") renderMain();
    if (message) showFeedback(message);
    app.transientTimer = window.setTimeout(() => {
      app.transientMood = null;
      if (app.currentScreen === "main") renderMain();
    }, duration);
  }

  async function cyclePhase() {
    if (!app.cat) return;
    const currentIndex = PHASES.indexOf(app.cat.phase);
    const nextPhase = PHASES[(currentIndex + 1) % PHASES.length];
    const nextDay = app.cat.phase === "Night" && nextPhase === "Morning"
      ? app.cat.day + 1
      : app.cat.day;
    await saveCat({ phase: nextPhase, day: nextDay });
    renderMain();
    showToast(`${nextPhase} light set.`);
  }

  async function doFeed() {
    if (!app.cat) return;
    flashButton(el.btnFeed);
    Sound.blip("happy");
    await changeStats(
      { hunger: 1, happiness: app.cat.hunger <= 1 ? 1 : 0, cleanliness: -1 },
      { message: "Breakfast crumbs everywhere." },
    );
    setTransientMood("happy", "Nom.", 1300);
  }

  async function doPlay(sourceButton = el.btnPlay) {
    if (!app.cat) return;
    flashButton(sourceButton);
    if (app.cat.energy <= 0) {
      showAlert("Too tired to play right now.", true);
      setTransientMood("tired", "Sleepy.", 1300);
      return;
    }
    if (app.cat.hunger <= 0) {
      showAlert("Food first, then play.", true);
      setTransientMood("hungry", "Snack?", 1300);
      return;
    }
    Sound.blip("happy");
    await changeStats(
      { happiness: 1, energy: -1, hunger: -1 },
      { message: "Playtime boosted happiness." },
    );
    setTransientMood("happy", "Zoom.", 1400);
  }

  async function doSleep() {
    if (!app.cat) return;
    flashButton(el.btnSleep);
    Sound.blip("soft");
    await changeStats(
      { energy: 2, hunger: -1 },
      { message: "A nap moved time along." },
    );
    await cyclePhase();
    setTransientMood("tired", "Zzz.", 1500);
  }

  function doBathMain() {
    flashButton(el.btnBathMain);
    openBathroom("care");
    showToast("Start the bath when ready.");
  }

  function startDecayLoop() {
    if (app.decayTimer) return;
    app.decayTimer = window.setInterval(async () => {
      if (!["main", "playroom"].includes(app.currentScreen) || !app.cat) return;
      let key = DECAY_ORDER[app.decayStep % DECAY_ORDER.length];
      app.decayStep += 1;
      if (app.cat[key] <= 0) {
        key = DECAY_ORDER.find((candidate) => app.cat[candidate] > 0);
      }
      if (!key) return;
      await changeStats({ [key]: -1 });
    }, DECAY_INTERVAL_MS);
  }

  function moveCursorTo(button) {
    if (!button || !el.cursor) return;
    el.cursor.style.left = `${button.offsetLeft - 5}px`;
    el.cursor.style.top = `${button.offsetTop - 5}px`;
  }

  function focusSelectedCat() {
    const whiteCat = el.cats.find((button) => button.dataset.id === "white");
    app.selectedCatIndex = el.cats.indexOf(whiteCat);
    if (!whiteCat) return;
    whiteCat.focus();
    moveCursorTo(whiteCat);
  }

  function setupSelect() {
    el.cats.forEach((button) => {
      const isWhite = button.dataset.id === "white";
      button.disabled = !isWhite;
      button.setAttribute("aria-disabled", String(!isWhite));
      button.title = isWhite ? "Choose white cat" : "Planned coat";
      button.addEventListener("mouseenter", () => {
        if (button.disabled) return;
        button.focus();
        moveCursorTo(button);
      });
      button.addEventListener("click", () => {
        if (button.dataset.id === "white") goToTraits();
      });
    });
    window.setTimeout(focusSelectedCat, 0);
  }

  function renderTrait() {
    const trait = TRAITS[app.traitIndex];
    if (!trait) return;
    setSafeImage(el.traitPreview, trait.src, ASSETS.idleCat);
    if (el.traitName) el.traitName.textContent = trait.title;
    if (el.traitDesc) el.traitDesc.textContent = trait.desc;
  }

  function nextTrait(direction) {
    app.traitIndex = (app.traitIndex + direction + TRAITS.length) % TRAITS.length;
    renderTrait();
    Sound.blip("soft");
  }

  function goToTraits() {
    showScreen("traits");
    renderTrait();
  }

  async function confirmTrait() {
    const trait = TRAITS[app.traitIndex];
    if (!trait) return;
    await saveCat({
      name: app.cat?.name || "Miso",
      avatar: "white",
      personality: trait.id,
      adopted_at: app.cat?.adopted_at || Date.now(),
      day: app.cat?.day || 1,
      phase: app.cat?.phase || realWorldPhase(),
      playScore: app.cat?.playScore || 0,
      ...DEFAULT_STATS,
    });
    showNameModal(app.cat?.name || "Miso");
  }

  function showNameModal(defaultName) {
    if (!el.nameModal || !el.nameInput) return;
    el.nameInput.value = cleanName(defaultName);
    el.nameModal.classList.remove("hidden");
    window.setTimeout(() => el.nameInput.focus(), 0);
  }

  function hideNameModal() {
    el.nameModal?.classList.add("hidden");
  }

  async function saveNameAndContinue() {
    const name = cleanName(el.nameInput?.value);
    await saveCat({ name, avatar: "white" });
    hideNameModal();
    resetScene2();
    showScreen("scene2");
  }

  function resetScene2() {
    setSafeImage(el.scene2Cat, ASSETS.sceneBox, ASSETS.idleCat);
    if (el.scene2Cat) {
      el.scene2Cat.style.left = "158px";
      el.scene2Cat.style.top = "226px";
      el.scene2Cat.style.width = "68px";
      el.scene2Cat.style.height = "68px";
      el.scene2Cat.style.transform = "";
    }
    el.scene2Label?.classList.remove("hidden");
    el.scene2Msg1?.classList.add("hidden");
    el.scene2Msg2?.classList.add("hidden");
    el.scene2Bath?.classList.add("hidden");
  }

  function unboxCat() {
    setSafeImage(el.scene2Cat, ASSETS.sceneDirty, ASSETS.idleCat);
    if (el.scene2Cat) {
      el.scene2Cat.style.left = "151px";
      el.scene2Cat.style.top = "224px";
      el.scene2Cat.style.width = "88px";
      el.scene2Cat.style.height = "64px";
      el.scene2Cat.style.transform = "scale(1.18)";
    }
    el.scene2Label?.classList.add("hidden");
    el.scene2Msg1?.classList.remove("hidden");
    el.scene2Msg2?.classList.remove("hidden");
    el.scene2Bath?.classList.remove("hidden");
    Sound.blip("happy");
  }

  function showMain(message) {
    showScreen("main");
    if (message) showToast(message);
  }

  function openProfile() {
    app.lastScreen = app.currentScreen === "profile" ? "main" : app.currentScreen;
    showScreen("profile");
  }

  function closeProfile() {
    showScreen(app.lastScreen || "main");
  }

  function openPlayroom() {
    showScreen("playroom");
    showToast("Playroom ready.");
  }

  function renderPlayroom() {
    if (el.playScore && app.cat) el.playScore.textContent = String(app.cat.playScore || 0);
  }

  function launchToy(kind) {
    const toy = kind === "mouse" ? el.playMouse : el.playBall;
    if (!toy) return;
    window.clearTimeout(kind === "mouse" ? app.mouseTimer : app.toyTimer);
    toy.classList.remove("hidden", "is-moving");
    toy.style.pointerEvents = "auto";
    void toy.offsetWidth;
    toy.classList.add("is-moving");
    const timer = window.setTimeout(() => {
      toy.classList.add("hidden");
      toy.classList.remove("is-moving");
    }, kind === "mouse" ? 2200 : 1900);
    if (kind === "mouse") app.mouseTimer = timer;
    else app.toyTimer = timer;
    if (el.playInstruction) {
      el.playInstruction.textContent = kind === "mouse"
        ? "Tap the mouse before it crosses the room."
        : "Tap the rolling ball before it stops.";
    }
  }

  async function hitToy(kind) {
    const toy = kind === "mouse" ? el.playMouse : el.playBall;
    if (!toy || toy.classList.contains("hidden")) return;
    toy.classList.add("hidden");
    toy.classList.remove("is-moving");
    Sound.blip("happy");
    const nextScore = (app.cat?.playScore || 0) + (kind === "mouse" ? 2 : 1);
    await saveCat({ playScore: nextScore });
    renderPlayroom();
    showToast(kind === "mouse" ? "Mouse caught." : "Nice catch.");
    if (nextScore % 3 === 0) {
      await changeStats({ happiness: 1, energy: -1, hunger: -1 });
    }
  }

  function openBathroom(mode) {
    app.bathMode = mode;
    app.bathComplete = false;
    app.bathRunning = false;
    window.clearTimeout(app.bathTimer);
    setSafeImage(el.bathCat, mode === "intro" ? ASSETS.bathIdle : ASSETS.bathHappy, ASSETS.bathIdle);
    if (el.bathTitle) el.bathTitle.textContent = mode === "intro" ? "First bath" : "Bath time";
    if (el.bathCopy) el.bathCopy.textContent = mode === "intro" ? "Fresh box, dusty paws." : "A warm scrub restores the sparkle.";
    if (el.bathClean) {
      el.bathClean.disabled = false;
      el.bathClean.textContent = "Start bath";
      el.bathClean.classList.remove("hidden");
    }
    el.bathDone?.classList.add("hidden");
    el.bathBack?.classList.toggle("hidden", mode === "intro");
    el.bathProgress?.classList.remove("is-running");
    showScreen("bathroom");
  }

  async function completeBath() {
    if (!app.cat || app.bathRunning || app.bathComplete) return;
    app.bathRunning = true;
    if (el.bathClean) {
      el.bathClean.disabled = true;
      el.bathClean.textContent = "Scrubbing";
    }
    if (el.bathTitle) el.bathTitle.textContent = "Bubble mode";
    if (el.bathCopy) el.bathCopy.textContent = "The cleanest little protest in town.";
    setSafeImage(el.bathCat, `${ASSETS.bathAnim}?t=${Date.now()}`, ASSETS.bathIdle);
    el.bathProgress?.classList.remove("is-running");
    void el.bathProgress?.offsetWidth;
    el.bathProgress?.classList.add("is-running");
    Sound.blip("soft");

    app.bathTimer = window.setTimeout(async () => {
      app.bathRunning = false;
      app.bathComplete = true;
      if (el.bathClean) el.bathClean.classList.add("hidden");
      el.bathDone?.classList.remove("hidden");
      if (el.bathTitle) el.bathTitle.textContent = "All clean";
      if (el.bathCopy) el.bathCopy.textContent = "Cleanliness up. Patience slightly down.";
      setSafeImage(el.bathCat, ASSETS.bathAngry, ASSETS.bathIdle);
      await changeStats(
        { cleanliness: 2, energy: -1, happiness: -1 },
        { message: "Bath complete." },
      );
    }, 1450);
  }

  function openSettings() {
    renderAudioLabels();
    el.settingsModal?.classList.remove("hidden");
  }

  function closeSettings() {
    el.settingsModal?.classList.add("hidden");
  }

  function openCredits() {
    el.creditsModal?.classList.remove("hidden");
  }

  function closeCredits() {
    el.creditsModal?.classList.add("hidden");
  }

  async function resetDemo() {
    await window.db.reset().catch(() => {});
    window.location.reload();
  }

  function setupEvents() {
    window.addEventListener("resize", applyScale);
    document.addEventListener("click", () => Sound.playMusic(), { once: true });

    el.audioBtn?.addEventListener("click", () => {
      Sound.toggleMute();
      Sound.blip("soft");
    });
    el.traitLeft?.addEventListener("click", () => nextTrait(-1));
    el.traitRight?.addEventListener("click", () => nextTrait(1));
    el.traitConfirm?.addEventListener("click", confirmTrait);
    el.nameOk?.addEventListener("click", saveNameAndContinue);
    el.nameCancel?.addEventListener("click", hideNameModal);
    el.scene2Cat?.addEventListener("click", unboxCat);
    el.scene2Bath?.addEventListener("click", () => openBathroom("intro"));
    el.phaseToggle?.addEventListener("click", cyclePhase);

    el.btnFeed?.addEventListener("click", doFeed);
    el.btnPlay?.addEventListener("click", () => doPlay(el.btnPlay));
    el.btnBathMain?.addEventListener("click", doBathMain);
    el.btnSleep?.addEventListener("click", doSleep);

    el.btnProfile?.addEventListener("click", openProfile);
    el.profileClose?.addEventListener("click", closeProfile);
    el.btnPlayroom?.addEventListener("click", openPlayroom);
    el.btnBathroom?.addEventListener("click", () => openBathroom("care"));
    el.btnSettings?.addEventListener("click", openSettings);
    el.btnCredits?.addEventListener("click", openCredits);

    el.playroomBack?.addEventListener("click", () => showMain());
    el.playroomToy?.addEventListener("click", () => launchToy("ball"));
    el.mouseChase?.addEventListener("click", () => launchToy("mouse"));
    el.playBall?.addEventListener("click", () => hitToy("ball"));
    el.playMouse?.addEventListener("click", () => hitToy("mouse"));

    el.bathClean?.addEventListener("click", completeBath);
    el.bathDone?.addEventListener("click", () => showMain("Back home, cleaner than before."));
    el.bathBack?.addEventListener("click", () => showMain());

    el.settingsMute?.addEventListener("click", () => Sound.toggleMute());
    el.settingsPhase?.addEventListener("click", cyclePhase);
    el.settingsReset?.addEventListener("click", resetDemo);
    el.settingsClose?.addEventListener("click", closeSettings);
    el.creditsClose?.addEventListener("click", closeCredits);

    document.addEventListener("keydown", handleKeyboard);
  }

  function closeTopModal() {
    if (!el.nameModal?.classList.contains("hidden")) {
      hideNameModal();
      return true;
    }
    if (!el.settingsModal?.classList.contains("hidden")) {
      closeSettings();
      return true;
    }
    if (!el.creditsModal?.classList.contains("hidden")) {
      closeCredits();
      return true;
    }
    return false;
  }

  function handleKeyboard(event) {
    if (event.shiftKey && event.key.toLowerCase() === "r") {
      event.preventDefault();
      resetDemo();
      return;
    }

    if (!el.nameModal?.classList.contains("hidden")) {
      if (event.key === "Enter") {
        event.preventDefault();
        saveNameAndContinue();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        hideNameModal();
      }
      return;
    }

    if (event.key === "Escape" && closeTopModal()) {
      event.preventDefault();
      return;
    }

    if (app.currentScreen === "traits") {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        nextTrait(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        nextTrait(1);
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        confirmTrait();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        showScreen("select");
        window.setTimeout(focusSelectedCat, 0);
      }
      return;
    }

    if (app.currentScreen === "select" && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      goToTraits();
      return;
    }

    if (app.currentScreen === "profile" && event.key === "Escape") {
      event.preventDefault();
      closeProfile();
      return;
    }

    if (app.currentScreen === "playroom" && event.key === "Escape") {
      event.preventDefault();
      showMain();
      return;
    }

    if (app.currentScreen === "bathroom" && event.key === "Escape" && app.bathMode !== "intro") {
      event.preventDefault();
      showMain();
      return;
    }

    if (app.currentScreen === "main") {
      const key = event.key.toLowerCase();
      if (key === "f") {
        event.preventDefault();
        doFeed();
      }
      if (key === "p") {
        event.preventDefault();
        doPlay(el.btnPlay);
      }
      if (key === "b") {
        event.preventDefault();
        doBathMain();
      }
      if (key === "s") {
        event.preventDefault();
        doSleep();
      }
    }
  }

  async function boot() {
    applyScale();
    setupSelect();
    setupEvents();
    renderTrait();
    renderAudioLabels();
    showScreen("splash");
    await wait(750);

    const cat = await loadCat();
    if (!cat) {
      showScreen("select");
      window.setTimeout(focusSelectedCat, 0);
      return;
    }

    await saveCat({
      name: cat.name,
      avatar: cat.avatar,
      personality: cat.personality,
      adopted_at: cat.adopted_at,
      day: cat.day,
      phase: cat.phase,
      playScore: cat.playScore,
      happiness: cat.happiness,
      hunger: cat.hunger,
      cleanliness: cat.cleanliness,
      energy: cat.energy,
    });

    if (!app.cat?.personality) {
      showScreen("traits");
      return;
    }

    showMain("Welcome back.");
  }

  boot();
});
