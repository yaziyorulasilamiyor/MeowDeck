// MeowDeck - vanilla web virtual pet prototype.

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
    idleCat: "assets/main/cat_idle.gif",
    sleepingCat: "assets/playroom/cat_sleeping.gif",
    bathIdle: "assets/bathroom/idlecat2.png",
    bathHappy: "assets/bathroom/cathappy.png",
    bathAngry: "assets/bathroom/catangry.png",
    sceneDirty: "assets/scene2/dirtycat.png",
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
    { key: "happiness", label: "Joy" },
    { key: "hunger", label: "Fullness" },
    { key: "cleanliness", label: "Clean" },
    { key: "energy", label: "Energy" },
  ];

  const ZERO_MESSAGES = {
    happiness: "Your cat needs attention.",
    hunger: "Your cat is hungry.",
    cleanliness: "Your cat feels messy.",
    energy: "Your cat is exhausted.",
  };

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
      copy: "The bowl has become a personal matter.",
      asset: ASSETS.idleCat,
    },
    tired: {
      label: "Tired",
      copy: "Those paws are running on fumes.",
      asset: ASSETS.sleepingCat,
    },
    dirty: {
      label: "Messy",
      copy: "A bath would restore some dignity.",
      asset: ASSETS.idleCat,
    },
    lonely: {
      label: "Lonely",
      copy: "A little play would go a long way.",
      asset: ASSETS.idleCat,
    },
    happy: {
      label: "Happy",
      copy: "Purring like the room is theirs.",
      asset: ASSETS.idleCat,
    },
    cozy: {
      label: "Cozy",
      copy: "Needs are balanced for now.",
      asset: ASSETS.idleCat,
    },
  };

  const DECAY_INTERVAL_MS = 90 * 1000;
  const DECAY_ORDER = ["hunger", "energy", "cleanliness", "happiness", "hunger"];

  const el = {
    screens: {
      splash: document.getElementById("splash"),
      select: document.getElementById("select"),
      traits: document.getElementById("traits"),
      scene2: document.getElementById("scene2"),
      bathroom: document.getElementById("bathroom"),
      main: document.getElementById("main"),
      profile: document.getElementById("profile"),
      playroom: document.getElementById("playroom"),
    },
    toast: document.getElementById("toast"),
    audioBtn: document.getElementById("btn-audio"),
    catGrid: document.getElementById("cat-grid"),
    cursor: document.getElementById("cursor"),
    cats: Array.from(document.querySelectorAll(".cat")),
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
    bathCat: document.getElementById("bath-cat"),
    bathTitle: document.getElementById("bath-title"),
    bathCopy: document.getElementById("bath-copy"),
    bathClean: document.getElementById("btn-bathroom-clean"),
    bathBack: document.getElementById("btn-bathroom-back"),
    bathDone: document.getElementById("btn-try-playing"),
    mainName: document.getElementById("main-cat-name"),
    mainMood: document.getElementById("main-cat-mood"),
    moodLabel: document.getElementById("mood-label"),
    dayLabel: document.getElementById("day-label"),
    statList: document.getElementById("stat-list"),
    mainCat: document.getElementById("main-cat-img"),
    catZone: document.querySelector(".cat-zone"),
    catFeedback: document.getElementById("cat-feedback"),
    alertBanner: document.getElementById("alert-banner"),
    btnProfile: document.getElementById("btn-profile"),
    btnSettings: document.getElementById("btn-settings"),
    btnExit: document.getElementById("btn-exit"),
    btnCredits: document.getElementById("btn-credits"),
    btnPlayroom: document.getElementById("btn-playroom"),
    btnBathroom: document.getElementById("btn-bathroom"),
    btnFeed: document.getElementById("btn-feed"),
    btnPlay: document.getElementById("btn-play"),
    btnBathMain: document.getElementById("btn-bath-main"),
    btnSleep: document.getElementById("btn-sleep"),
    profileClose: document.getElementById("btn-profile-close"),
    profileAdopted: document.getElementById("profile-adopted"),
    profileName: document.getElementById("profile-name"),
    profileTrait: document.getElementById("profile-trait"),
    playroomBack: document.getElementById("btn-playroom-back"),
    playroomToy: document.getElementById("btn-playroom-toy"),
    plannedModal: document.getElementById("planned-modal"),
    plannedTitle: document.getElementById("planned-title"),
    plannedCopy: document.getElementById("planned-copy"),
    plannedClose: document.getElementById("planned-close"),
    plannedExtra: document.getElementById("planned-extra"),
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
    bathComplete: false,
    bathMode: "care",
  };

  const Sound = {
    music: null,
    muted: false,
    ctx: null,
    playMusic() {
      if (this.muted || this.music) return;
      const audio = new Audio(ASSETS.music);
      audio.loop = true;
      audio.volume = 0.24;
      audio.muted = this.muted;
      audio.play().catch(() => {});
      this.music = audio;
    },
    toggleMute() {
      this.muted = !this.muted;
      if (this.music) this.music.muted = this.muted;
      if (el.audioBtn) {
        el.audioBtn.textContent = this.muted ? "Muted" : "Sound";
        el.audioBtn.setAttribute("aria-pressed", String(this.muted));
        el.audioBtn.title = this.muted ? "Unmute audio" : "Mute audio";
      }
    },
    blip(kind = "soft") {
      if (this.muted) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = this.ctx || new AudioContext();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      const pitch = kind === "alert" ? 180 : kind === "happy" ? 520 : 360;
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

  function normalizeCat(raw) {
    if (!raw) return null;
    return {
      id: raw.id == null ? undefined : raw.id,
      name: cleanName(raw.name),
      avatar: raw.avatar || "white",
      personality: raw.personality || null,
      adopted_at: parseTime(raw.adopted_at || raw.created_at || Date.now()),
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
    const scale = Math.min(window.innerWidth / 1024, window.innerHeight / 1024, 1);
    document.documentElement.style.setProperty("--ui-scale", String(scale));
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
      window.setTimeout(() => next.classList.remove("screen-enter"), 260);
    }

    app.currentScreen = name;
    if (name === "main") {
      renderMain();
      startDecayLoop();
    }
    if (name === "profile") renderProfile();
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
    app.feedbackTimer = window.setTimeout(() => el.catFeedback.classList.add("hidden"), 1500);
  }

  function flashButton(button) {
    if (!button) return;
    button.classList.add("is-active");
    window.setTimeout(() => button.classList.remove("is-active"), 260);
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

  function computeDay(cat) {
    const adopted = parseTime(cat?.adopted_at || Date.now());
    return Math.max(1, Math.floor((Date.now() - adopted) / 86400000) + 1);
  }

  function computeMood(cat) {
    if (!cat) return "cozy";
    if (cat.hunger <= 0) return "hungry";
    if (cat.energy <= 0) return "tired";
    if (cat.cleanliness <= 0) return "dirty";
    if (cat.happiness <= 0) return "lonely";
    if (cat.happiness >= 3 && cat.hunger >= 2 && cat.cleanliness >= 2 && cat.energy >= 2) return "happy";
    return "cozy";
  }

  function currentMoodKey() {
    return app.transientMood || computeMood(app.cat);
  }

  function renderMain() {
    if (!app.cat) return;
    const moodKey = currentMoodKey();
    const mood = MOODS[moodKey] || MOODS.cozy;

    if (el.mainName) el.mainName.textContent = app.cat.name;
    if (el.mainMood) el.mainMood.textContent = mood.copy;
    if (el.moodLabel) el.moodLabel.textContent = mood.label;
    if (el.dayLabel) el.dayLabel.textContent = `Day ${computeDay(app.cat)}`;

    setSafeImage(el.mainCat, mood.asset);
    if (el.catZone) {
      el.catZone.className = `cat-zone is-${moodKey}`;
    }

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
    if (el.profileAdopted) el.profileAdopted.textContent = formatDate(app.cat.adopted_at);
    if (el.profileName) el.profileName.textContent = app.cat.name;
    if (el.profileTrait) el.profileTrait.textContent = getTraitTitle(app.cat.personality);

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
    if (options.message) showToast(options.message);
    return cat;
  }

  function setTransientMood(moodKey, message, duration = 1600) {
    window.clearTimeout(app.transientTimer);
    app.transientMood = moodKey;
    renderMain();
    if (message) showFeedback(message);
    app.transientTimer = window.setTimeout(() => {
      app.transientMood = null;
      renderMain();
    }, duration);
  }

  async function doFeed() {
    if (!app.cat) return;
    flashButton(el.btnFeed);
    Sound.blip("happy");
    await changeStats(
      { hunger: 2, happiness: 1, cleanliness: -1 },
      { message: "Snack served. Crumbs detected." },
    );
    setTransientMood("happy", "Nom.", 1500);
  }

  async function doPlay(sourceButton = el.btnPlay) {
    if (!app.cat) return;
    flashButton(sourceButton);
    if (app.cat.energy <= 0) {
      showAlert("Too tired to play right now.", true);
      setTransientMood("tired", "Sleepy.", 1500);
      return;
    }
    if (app.cat.hunger <= 0) {
      showAlert("A snack should come before play.", true);
      setTransientMood("hungry", "Food first.", 1500);
      return;
    }
    Sound.blip("happy");
    await changeStats(
      { happiness: 2, energy: -1, hunger: -1 },
      { message: "Play session complete." },
    );
    setTransientMood("happy", "Zoom.", 1700);
  }

  async function doSleep() {
    if (!app.cat) return;
    flashButton(el.btnSleep);
    Sound.blip("soft");
    await changeStats(
      { energy: 2, hunger: -1 },
      { message: "A short nap helped." },
    );
    setTransientMood("tired", "Zzz.", 1900);
  }

  function doBathMain() {
    flashButton(el.btnBathMain);
    openBathroom("care");
    showToast("Scrub to finish the bath.");
  }

  async function completeBath() {
    if (!app.cat || app.bathComplete) return;
    app.bathComplete = true;
    if (el.bathClean) el.bathClean.classList.add("hidden");
    if (el.bathDone) el.bathDone.classList.remove("hidden");
    if (el.bathTitle) el.bathTitle.textContent = "All clean";
    if (el.bathCopy) el.bathCopy.textContent = "Cleanliness up. Patience down.";
    setSafeImage(el.bathCat, ASSETS.bathAngry, ASSETS.bathIdle);
    Sound.blip("alert");
    await changeStats(
      { cleanliness: 3, happiness: -1, energy: -1 },
      { message: "Bath saved." },
    );
  }

  function startDecayLoop() {
    if (app.decayTimer) return;
    app.decayTimer = window.setInterval(async () => {
      if (app.currentScreen !== "main" || !app.cat) return;

      let key = DECAY_ORDER[app.decayStep % DECAY_ORDER.length];
      app.decayStep += 1;
      if (app.cat[key] <= 0) {
        key = DECAY_ORDER.find((candidate) => app.cat[candidate] > 0);
      }
      if (!key) return;

      await changeStats({ [key]: -1 });
      renderMain();
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
    setSafeImage(el.scene2Cat, "assets/scene2/anim.gif", ASSETS.idleCat);
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

  function openBathroom(mode) {
    app.bathMode = mode;
    app.bathComplete = false;
    setSafeImage(el.bathCat, ASSETS.bathIdle, ASSETS.idleCat);
    if (el.bathTitle) el.bathTitle.textContent = mode === "intro" ? "First bath" : "Bath time";
    if (el.bathCopy) el.bathCopy.textContent = mode === "intro" ? "Fresh box, dusty paws." : "Clean fur, wounded pride.";
    el.bathClean?.classList.remove("hidden");
    el.bathDone?.classList.add("hidden");
    el.bathBack?.classList.toggle("hidden", mode === "intro");
    showScreen("bathroom");
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
    showToast("Playroom prototype loaded.");
  }

  function openPlanned(title, copy, allowReset = false) {
    if (!el.plannedModal) return;
    if (el.plannedTitle) el.plannedTitle.textContent = title;
    if (el.plannedCopy) el.plannedCopy.textContent = copy;
    el.plannedExtra?.classList.toggle("hidden", !allowReset);
    el.plannedModal.classList.remove("hidden");
  }

  function closePlanned() {
    el.plannedModal?.classList.add("hidden");
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

    el.bathClean?.addEventListener("click", completeBath);
    el.bathCat?.addEventListener("click", completeBath);
    el.bathDone?.addEventListener("click", () => showMain("Back home, cleaner than before."));
    el.bathBack?.addEventListener("click", () => showMain());

    el.btnProfile?.addEventListener("click", openProfile);
    el.profileClose?.addEventListener("click", closeProfile);
    el.btnSettings?.addEventListener("click", () => openPlanned(
      "Settings",
      "More audio, accessibility, and save options are planned. The sound toggle already works.",
    ));
    el.btnCredits?.addEventListener("click", () => openPlanned(
      "Credits",
      "MeowDeck uses the existing pixel-art assets in this repository, with care-loop code and UI polish added in vanilla HTML, CSS, and JavaScript.",
    ));
    el.btnExit?.addEventListener("click", () => openPlanned(
      "Exit",
      "Progress is saved locally. Browser builds cannot close their own tab, but the demo can be reset.",
      true,
    ));
    el.btnPlayroom?.addEventListener("click", openPlayroom);
    el.btnBathroom?.addEventListener("click", () => openBathroom("care"));

    el.btnFeed?.addEventListener("click", doFeed);
    el.btnPlay?.addEventListener("click", () => doPlay(el.btnPlay));
    el.btnBathMain?.addEventListener("click", doBathMain);
    el.btnSleep?.addEventListener("click", doSleep);

    el.playroomBack?.addEventListener("click", () => showMain());
    el.playroomToy?.addEventListener("click", async () => {
      await doPlay(el.playroomToy);
      renderProfile();
    });

    el.plannedClose?.addEventListener("click", closePlanned);
    el.plannedExtra?.addEventListener("click", resetDemo);

    document.addEventListener("keydown", handleKeyboard);
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

    if (!el.plannedModal?.classList.contains("hidden")) {
      if (event.key === "Escape") {
        event.preventDefault();
        closePlanned();
      }
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

    if (app.currentScreen === "select") {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        goToTraits();
      }
      return;
    }

    if (app.currentScreen === "profile" && event.key === "Escape") {
      event.preventDefault();
      closeProfile();
      return;
    }

    if (app.currentScreen === "bathroom" && event.key === "Escape" && app.bathMode !== "intro") {
      event.preventDefault();
      showMain();
      return;
    }

    if (app.currentScreen === "playroom" && event.key === "Escape") {
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
    showScreen("splash");
    await wait(900);

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
