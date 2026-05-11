// script.js
// MeowDeck (Kedi Asistanı) - Demo Web Prototype
// Flow: Splash -> Select -> Traits -> Name -> Scene2 -> Bathroom -> Main -> Profile
// Storage: LocalStorage (window.db shim)

// ===========================
// LocalStorage DB Shim
// ===========================
if (!window.db) {
    window.db = {
        _k: "cat",
        async getCat() {
            try {
                return JSON.parse(localStorage.getItem(this._k));
            } catch {
                return null;
            }
        },
        async upsertCat(payload) {
            const cur = (await this.getCat()) || {};
            const next = { id: cur.id || 1, ...cur, ...payload };
            localStorage.setItem(this._k, JSON.stringify(next));
            return next.id;
        },
        async reset() {
            localStorage.removeItem(this._k);
        },
    };
}

window.addEventListener("DOMContentLoaded", () => {
    // ===========================
    // DOM refs
    // ===========================
    const el = {
        splash:     document.getElementById("splash"),
        select:     document.getElementById("select"),
        traits:     document.getElementById("traits"),
        nameModal:  document.getElementById("name-modal"),
        scene2:     document.getElementById("scene2"),
        bathroom:   document.getElementById("bathroom"),
        main:       document.getElementById("main"),
        profile:    document.getElementById("profile"),

        // select
        grid:   document.getElementById("cat-grid"),
        cursor: document.getElementById("cursor"),
        cats:   Array.from(document.querySelectorAll(".cat")),

        // traits
        traitPreview: document.getElementById("trait-preview"),
        traitName:    document.querySelector("#traits .trait-name"),
        traitDesc:    document.querySelector("#traits .trait-desc"),
        traitLeft:    document.querySelector("#traits .trait-nav.left"),
        traitRight:   document.querySelector("#traits .trait-nav.right"),

        // name modal
        nameInput:  document.getElementById("name-input"),
        nameOk:     document.getElementById("name-ok"),
        nameCancel: document.getElementById("name-cancel"),

        // scene2
        scene2Cat:  document.getElementById("scene2-cat"),
        scene2Label: document.querySelector(".scene2-label"),
        msg1:       document.querySelector(".scene2-msg1"),
        msg2:       document.querySelector(".scene2-msg2"),
        bathBtn:    document.getElementById("btn-bath"),

        // bathroom
        bathCat:      document.getElementById("bath-cat"),
        bathTitle:    document.getElementById("bath-title"),
        btnTryPlaying: document.getElementById("btn-try-playing"),

        // audio
        audioBtn: document.getElementById("btn-audio"),

        // main/profile buttons
        btnProfile:    document.getElementById("btn-profile"),
        profileClose:  document.getElementById("btn-profile-close"),
        profileAdopted: document.getElementById("profile-adopted"),

        // main action buttons (yeni eklenenler)
        btnFeed:      document.getElementById("btn-feed"),
        btnPlay:      document.getElementById("btn-play"),
        btnSleep:     document.getElementById("btn-sleep"),
        btnBathMain:  document.getElementById("btn-bath-main"),

        // main cat img
        mainCat: document.querySelector(".main-cat"),

        // stat bar (main ekranında küçük stat göstergesi)
        statBar: document.getElementById("stat-bar"),
    };

    // ===========================
    // UI Scale (fit 1024x1024)
    // ===========================
    function applyScale() {
        const BASE_W = 1024, BASE_H = 1024;
        const scale = Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H);
        const clamped = Math.min(1, scale);
        document.documentElement.style.setProperty("--ui-scale", String(clamped));
    }
    applyScale();
    window.addEventListener("resize", applyScale);

    // ===========================
    // Data
    // ===========================
    const TRAITS = [
        { id: "shy",       title: "shy",            desc: "utangaç kedi",            src: "assets/traits/shy.gif"       },
        { id: "meowy",     title: "meowy",           desc: "çok miyav, çığırtkan",    src: "assets/traits/meowy.gif"     },
        { id: "excity",    title: "excity",          desc: "hiperaktif / heyecanlı",  src: "assets/traits/excity.gif"    },
        { id: "lazy",      title: "lazy",            desc: "uykulu / tembel",         src: "assets/traits/lazy.gif"      },
        { id: "angry",     title: "angry",           desc: "gergin / sinirli",        src: "assets/traits/angry.gif"     },
        { id: "careless",  title: "careless",        desc: "not give a meow at all",  src: "assets/traits/careless.gif"  },
        { id: "attention", title: "attention addict",desc: "pick-me",                 src: "assets/traits/attention.gif" },
        { id: "fragile",   title: "fragile",         desc: "ağlak / hassas",          src: "assets/traits/fragile.gif"   },
        { id: "fatty",     title: "fat",             desc: "tombik",                  src: "assets/traits/fatty.gif"     },
    ];

    const state = {
        cols: 5,
        index: 0,
        traitIndex: 0,
        angry: false,
    };

    let lastNonModalScreen = "main";

    // ===========================
    // Helpers: screen switching
    // ===========================
    function hideAll() {
        el.splash?.classList.add("hidden");
        el.select?.classList.add("hidden");
        el.traits?.classList.add("hidden");
        el.nameModal?.classList.add("hidden");
        el.scene2?.classList.add("hidden");
        el.bathroom?.classList.add("hidden");
        el.main?.classList.add("hidden");
        el.profile?.classList.add("hidden");
    }

    function showOnly(sectionEl) {
        hideAll();
        sectionEl?.classList.remove("hidden");
    }

    function currentSection() {
        if (el.nameModal && !el.nameModal.classList.contains("hidden")) return "nameModal";
        if (el.profile  && !el.profile.classList.contains("hidden"))   return "profile";
        if (el.main     && !el.main.classList.contains("hidden"))       return "main";
        if (el.bathroom && !el.bathroom.classList.contains("hidden"))   return "bathroom";
        if (el.scene2   && !el.scene2.classList.contains("hidden"))     return "scene2";
        if (el.traits   && !el.traits.classList.contains("hidden"))     return "traits";
        if (el.select   && !el.select.classList.contains("hidden"))     return "select";
        if (el.splash   && !el.splash.classList.contains("hidden"))     return "splash";
        return "none";
    }

    // ===========================
    // Cursor / select navigation
    // ===========================
    function moveCursorTo(btn) {
        if (!btn || !el.cursor) return;
        el.cursor.style.left = btn.offsetLeft - 5 + "px";
        el.cursor.style.top  = btn.offsetTop  - 5 + "px";
    }

    function focusIndex(i) {
        const n = el.cats.length;
        if (!n) return;
        state.index = (i + n) % n;
        el.cats[state.index]?.focus();
        moveCursorTo(el.cats[state.index]);
    }

    // ===========================
    // Audio
    // ===========================
    const Snd = {
        music: null,
        muted: false,
        volumes: { music: 0.35, sfx: 0.8 },
        files: {
            music: {
                bg:       "assets/audio/music_bg.mp3",
                scene2:   "assets/audio/music_scene2.mp3",
                bathroom: "assets/audio/music_bathroom.mp3",
            },
            sfx: {
                click:  "assets/audio/click.wav",
                meow:   "assets/audio/meow.wav",
                scream: "assets/audio/scream.wav",
            },
        },

        ensureUnlockedOnce() {
            if (this._unlocked) return;
            const unlock = () => {
                this._unlocked = true;
                document.removeEventListener("click",   unlock, true);
                document.removeEventListener("keydown", unlock, true);
            };
            document.addEventListener("click",   unlock, true);
            document.addEventListener("keydown", unlock, true);
        },

        toggleMute() {
            this.muted = !this.muted;
            if (this.music) this.music.muted = this.muted;
            if (el.audioBtn) {
                el.audioBtn.setAttribute("aria-pressed", this.muted ? "true" : "false");
                el.audioBtn.textContent = this.muted ? "🔇" : "🔊";
            }
        },

        playMusic(name) {
            const url = this.files.music[name];
            if (!url) return;
            if (this.music && this.music.dataset?.name === name && !this.music.paused) return;
            if (this.music) { this.music.pause(); this.music = null; }
            const a = new Audio(url);
            a.dataset.name = name;
            a.loop = true;
            a.volume = this.volumes.music;
            a.muted = this.muted;
            a.play().catch(() => {});
            this.music = a;
        },

        playSfx(name) {
            const url = this.files.sfx[name];
            if (!url) return;
            const a = new Audio(url);
            a.volume = this.muted ? 0 : this.volumes.sfx;
            a.play().catch(() => {});
        },
    };

    document.addEventListener("click", () => Snd.playMusic("bg"), { once: true });

    // ===========================
    // Demo rules (only white is selectable)
    // ===========================
    function applyDemoLock() {
        el.cats.forEach((btn) => {
            const id = btn.dataset.id;
            if (id !== "white") {
                btn.disabled = true;
                btn.setAttribute("aria-disabled", "true");
                btn.title = "Demo: sadece beyaz kedi aktif";
            }
        });
    }

    // ===========================
    // Traits
    // ===========================
    function renderTrait() {
        const t = TRAITS[state.traitIndex];
        if (!t) return;
        if (el.traitPreview) el.traitPreview.src = t.src;
        if (el.traitName)    el.traitName.textContent = t.title;
        if (el.traitDesc)    el.traitDesc.textContent = t.desc;
    }

    function prevTrait() {
        state.traitIndex = (state.traitIndex - 1 + TRAITS.length) % TRAITS.length;
        renderTrait();
    }

    function nextTrait() {
        state.traitIndex = (state.traitIndex + 1) % TRAITS.length;
        renderTrait();
    }

    function goToTraits() {
        showOnly(el.traits);
        state.traitIndex = 0;
        renderTrait();
    }

    async function confirmTrait() {
        const chosen = TRAITS[state.traitIndex]?.id;
        if (!chosen) return;
        const current = await window.db.getCat().catch(() => null);
        if (current?.id) {
            await window.db.upsertCat({ id: current.id, personality: chosen });
        } else {
            await window.db.upsertCat({ name: "Pofuduk", avatar: "white", personality: chosen });
        }
        const latest = await window.db.getCat().catch(() => null);
        showNameModal(latest?.name || "Pofuduk");
    }

    // ===========================
    // Name modal
    // ===========================
    function showNameModal(defaultName = "Pofuduk") {
        if (!el.nameModal || !el.nameInput) return;
        el.nameInput.value = defaultName;
        el.nameModal.classList.remove("hidden");
        setTimeout(() => el.nameInput?.focus(), 0);
    }

    function hideNameModal() {
        el.nameModal?.classList.add("hidden");
    }

    async function saveNameAndGoScene2() {
        if (!el.nameInput) return;
        let val = el.nameInput.value.trim();
        if (!val) val = "Pofuduk";
        if (val.length > 16) val = val.slice(0, 16);
        const current = await window.db.getCat().catch(() => null);
        await window.db.upsertCat({ id: current?.id, name: val, avatar: "white" }).catch(() => {});
        hideNameModal();
        showOnly(el.scene2);
        Snd.playMusic("scene2");
    }

    // ===========================
    // Scene2
    // ===========================
    function setupScene2() {
        if (!el.scene2Cat) return;

        el.scene2Cat.addEventListener("click", () => {
            el.scene2Cat.src = "./assets/scene2/dirtycat.png";
            el.scene2Cat.style.width  = "86px";
            el.scene2Cat.style.height = "79px";
            el.scene2Cat.style.transformOrigin = "left top";
            el.scene2Cat.style.transform = "scale(1.2)";
            el.scene2Cat.style.left = "152px";
            Snd.playSfx("meow");
            el.scene2Label?.classList.add("hidden");
            el.msg1?.classList.remove("hidden");
            el.msg2?.classList.remove("hidden");
            el.bathBtn?.classList.remove("hidden");
        }, { once: true });

        el.bathBtn?.addEventListener("click", () => {
            Snd.playSfx("click");
            showOnly(el.bathroom);
            Snd.playMusic("bathroom");
            setupBathroom();
        });
    }

    // ===========================
    // Bathroom
    // ===========================
    function setupBathroom() {
        const bathCat  = el.bathCat;
        const bathTitle = el.bathTitle;
        const btnTry   = el.btnTryPlaying;
        if (!bathCat || !bathTitle || !btnTry) return;

        state.angry = false;
        btnTry.classList.add("hidden");

        bathCat.src = "./assets/bathroom/idlecat2.png";
        bathCat.style.left   = "476px";
        bathCat.style.top    = "655px";
        bathCat.style.width  = "110px";
        bathCat.style.height = "207px";

        bathTitle.innerHTML    = "Lets wash our cat!";
        bathTitle.style.left   = "251px";
        bathTitle.style.top    = "238px";

        bathCat.onmouseenter = () => {
            if (state.angry) return;
            bathCat.src = "./assets/bathroom/cathappy.png";
            bathCat.style.width  = "112px";
            bathCat.style.height = "212px";
        };

        bathCat.onmouseleave = () => {
            if (state.angry) return;
            bathCat.src = "./assets/bathroom/idlecat2.png";
            bathCat.style.width  = "110px";
            bathCat.style.height = "207px";
        };

        bathCat.onclick = () => {
            if (state.angry) return;
            state.angry = true;

            bathCat.src = "./assets/bathroom/catangry.png";
            bathCat.style.left   = "456px";
            bathCat.style.top    = "647px";
            bathCat.style.width  = "127px";
            bathCat.style.height = "211px";

            Snd.playSfx("scream");

            bathTitle.innerHTML    = 'Lets <span class="not">NOT</span> wash our cat!';
            bathTitle.style.left   = "176px";
            bathTitle.style.top    = "245px";

            setTimeout(() => {
                bathTitle.textContent = "Okay okay… let's try playing.";
                btnTry.classList.remove("hidden");
            }, 700);
        };

        btnTry.onclick = () => {
            Snd.playSfx("click");
            // Banyo tamamlandı: cleanliness +2
            applyBathBonus();
            showOnly(el.main);
            Snd.playMusic("bg");
            updateCatMood();
        };
    }

    // Banyo bonusu: temizlik artar
    async function applyBathBonus() {
        const cat = await window.db.getCat().catch(() => null);
        if (!cat) return;
        const newClean = Math.min(3, (cat.cleanliness ?? 2) + 2);
        await window.db.upsertCat({ id: cat.id, cleanliness: newClean });
    }

    // ===========================
    // Select screen
    // ===========================
    function selectCat(id) {
        if (id === "white") goToTraits();
    }

    function setupSelect() {
        applyDemoLock();
        el.cats.forEach((btn) => {
            btn.addEventListener("mouseenter", () => {
                btn.focus();
                moveCursorTo(btn);
            });
            btn.addEventListener("click", () => selectCat(btn.dataset.id));
        });
        focusIndex(0);
    }

    // ===========================
    // Profile (open/close + render)
    // ===========================
    const HEART_EMPTY = "assets/ui/boskalp.png";
    const HEART_FULL  = "assets/ui/dolukalp.png";

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function setHearts(prefix, value) {
        value = clamp(value, 0, 3);
        for (let i = 0; i < 3; i++) {
            const img = document.getElementById(`h-${prefix}-${i}`);
            if (!img) continue;
            img.src = i < value ? HEART_FULL : HEART_EMPTY;
        }
    }

    async function ensureProfileDefaults() {
        const cat = await window.db.getCat().catch(() => null);
        if (!cat) return;
        if (!cat.adopted_at) {
            await window.db.upsertCat({ id: cat.id, adopted_at: Date.now() }).catch(() => {});
        }
        const patch = {};
        if (cat.happiness   == null) patch.happiness   = 2;
        if (cat.cleanliness == null) patch.cleanliness = 2;
        if (cat.hunger      == null) patch.hunger      = 2;
        if (cat.energy      == null) patch.energy      = 2;
        if (Object.keys(patch).length) {
            await window.db.upsertCat({ id: cat.id, ...patch }).catch(() => {});
        }
    }

    async function renderProfile() {
        await ensureProfileDefaults();
        const cat = await window.db.getCat().catch(() => null);
        if (!cat) return;

        if (el.profileAdopted) {
            const t = cat.adopted_at ? new Date(cat.adopted_at).toLocaleString("tr-TR") : "-";
            el.profileAdopted.textContent = `${t}`;
        }

        setHearts("happiness",   cat.happiness   ?? 2);
        setHearts("cleanliness", cat.cleanliness ?? 2);
        setHearts("hunger",      cat.hunger      ?? 2);
        setHearts("energy",      cat.energy      ?? 2);
    }

    function openProfile() {
        const where = currentSection();
        if (where !== "profile" && where !== "nameModal" && where !== "none") {
            lastNonModalScreen = where;
        }
        renderProfile();
        showOnly(el.profile);
    }

    function closeProfile() {
        const map = {
            splash:   el.splash,
            select:   el.select,
            traits:   el.traits,
            scene2:   el.scene2,
            bathroom: el.bathroom,
            main:     el.main,
        };
        showOnly(map[lastNonModalScreen] || el.main);
    }

    // ===========================
    // CAT ANİMASYON SİSTEMİ
    // ===========================
    // Bu dosyaları assets/main/ klasörüne koyman lazım:
    //   cat_idle.gif   → zaten var
    //   cat_dance.gif  → kedi dans etme GIF'in
    //   cat_eat.gif    → serum yeme GIF'in
    //   cat_sleep.gif  → uyuma GIF'in
    //   cat_cry.gif    → ağlama GIF'in
    //   cat_angry.gif  → sinirlenme GIF'in
    //   cat_yawn.gif   → esneme GIF'in
    //   cat_lick.gif   → kendini yalama GIF'in

    const CAT_ANIMS = {
        idle:     "assets/main/cat_idle.gif",
        happy:    "assets/main/cat_dance.gif",
        eating:   "assets/main/cat_eat.gif",
        sleeping: "assets/main/cat_sleep.gif",
        sad:      "assets/main/cat_cry.gif",
        angry:    "assets/main/cat_angry.gif",
        yawn:     "assets/main/cat_yawn.gif",
        lick:     "assets/main/cat_lick.gif",
    };

    let catMoodTimer = null;         // geçici animasyon bittikten sonra normale dönmek için
    let idleBehaviorTimer = null;    // rastgele idle davranışlar için

    // Kediyi belirtilen animasyona geçir
    // GIF'in baştan başlaması için src'ye timestamp ekliyoruz
    function setCatAnim(state) {
        if (!el.mainCat) return;
        const src = CAT_ANIMS[state] || CAT_ANIMS.idle;
        el.mainCat.src = src + "?t=" + Date.now();
    }

    // Statlara bakarak kedinin şu anki "ruh halini" hesapla
    function computeMood(cat) {
        const h = cat.happiness   ?? 2;
        const c = cat.cleanliness ?? 2;
        const n = cat.hunger      ?? 2;
        const e = cat.energy      ?? 2;

        if (e <= 0) return "sleeping";   // enerjisi bitti → uyuyor
        if (n <= 0) return "sad";        // aç → üzgün
        if (c <= 0) return "angry";      // kirli → sinirli
        if (h <= 0) return "sad";        // mutsuz → ağlıyor

        const allMax = (h >= 3 && c >= 3 && n >= 3 && e >= 3);
        if (allMax) return "happy";      // her şey tam → dans

        return "idle";
    }

    // Statlara göre kedi animasyonunu güncelle
    async function updateCatMood() {
        const cat = await window.db.getCat().catch(() => null);
        if (!cat) return;
        const mood = computeMood(cat);
        setCatAnim(mood);
        renderStatBar(cat);           // ana ekrandaki küçük stat çubuklarını güncelle
    }

    // Geçici bir animasyon oynat, bitince normale dön
    function playTempAnim(animKey, durationMs) {
        clearTimeout(catMoodTimer);
        clearTimeout(idleBehaviorTimer);
        setCatAnim(animKey);
        catMoodTimer = setTimeout(() => {
            updateCatMood();
            scheduleIdleBehavior();
        }, durationMs);
    }

    // Rastgele idle davranış: ara ara esner veya kendini yalar
    function scheduleIdleBehavior() {
        clearTimeout(idleBehaviorTimer);
        // 30 ile 90 saniye arası rastgele bir süre sonra çalışır
        const delay = (30 + Math.random() * 60) * 1000;
        idleBehaviorTimer = setTimeout(async () => {
            const cat = await window.db.getCat().catch(() => null);
            if (!cat) return;
            if (currentSection() !== "main") return;

            // Eğer kedi zaten özel bir durumda değilse idle davranış yap
            const mood = computeMood(cat);
            if (mood !== "idle" && mood !== "happy") return;

            // Esneme mi yoksa kendini yalama mı? Rastgele seç
            const behavior = Math.random() < 0.5 ? "yawn" : "lick";
            playTempAnim(behavior, 3000);
        }, delay);
    }

    // ===========================
    // AKSİYON FONKSİYONLARI
    // ===========================

    // Besle butonu
    async function doFeed() {
        const cat = await window.db.getCat().catch(() => null);
        if (!cat) return;

        const newHunger    = Math.min(3, (cat.hunger    ?? 2) + 2);
        const newHappiness = Math.min(3, (cat.happiness ?? 2) + 1);

        await window.db.upsertCat({ id: cat.id, hunger: newHunger, happiness: newHappiness });

        Snd.playSfx("meow");
        playTempAnim("eating", 3000);   // 3 saniye yeme animasyonu, sonra normale dön

        flashActionBtn(el.btnFeed);
    }

    // Oyna butonu
    async function doPlay() {
        const cat = await window.db.getCat().catch(() => null);
        if (!cat) return;

        const newHappiness = Math.min(3, (cat.happiness ?? 2) + 2);
        const newEnergy    = Math.max(0, (cat.energy    ?? 2) - 1);  // oynamak enerji harcar

        await window.db.upsertCat({ id: cat.id, happiness: newHappiness, energy: newEnergy });

        Snd.playSfx("click");
        playTempAnim("happy", 4000);    // 4 saniye dans, sonra normale dön

        flashActionBtn(el.btnPlay);
    }

    // Uyut butonu
    async function doSleep() {
        const cat = await window.db.getCat().catch(() => null);
        if (!cat) return;

        const newEnergy = Math.min(3, (cat.energy ?? 2) + 2);

        await window.db.upsertCat({ id: cat.id, energy: newEnergy });

        Snd.playSfx("click");
        playTempAnim("sleeping", 5000); // 5 saniye uyku animasyonu

        flashActionBtn(el.btnSleep);
    }

    // Yıka butonu (bathroom ekranına götürür)
    function doBath() {
        Snd.playSfx("click");
        showOnly(el.bathroom);
        Snd.playMusic("bathroom");
        setupBathroom();
    }

    // Butona tıklandığında kısa "aktif" görsel efekt
    function flashActionBtn(btn) {
        if (!btn) return;
        btn.classList.add("btn-active");
        setTimeout(() => btn.classList.remove("btn-active"), 300);
    }

    // ===========================
    // STAT BAR (Ana ekrandaki mini gösterge)
    // ===========================
    // Ana ekranda küçük bir stat çubuğu gösterir
    // Çok kritik bir stat varsa uyarı rengi alır
    function renderStatBar(cat) {
        const bar = el.statBar;
        if (!bar) return;

        const stats = {
            "🍖": cat.hunger      ?? 2,
            "⚡": cat.energy      ?? 2,
            "🛁": cat.cleanliness ?? 2,
            "💖": cat.happiness   ?? 2,
        };

        bar.innerHTML = Object.entries(stats).map(([icon, val]) => {
            const level  = val >= 3 ? "full" : val >= 2 ? "ok" : val >= 1 ? "low" : "empty";
            const dots   = ["●","●","●"].map((d, i) => `<span class="dot dot-${i < val ? level : "empty"}">${d}</span>`).join("");
            return `<div class="stat-item"><span class="stat-icon">${icon}</span>${dots}</div>`;
        }).join("");
    }

    // ===========================
    // STAT DÜŞME DÖNGÜSÜ
    // ===========================
    // Her DECAY_TICK_MS ms'de bir tick atar.
    // - hunger    : her tickte -1
    // - energy    : her 2 tickte -1
    // - cleanliness: her 3 tickte -1
    // - happiness : her 4 tickte -1
    //
    // Test için 30 saniye → gerçek için 5*60*1000 (5 dakika) yap

    const DECAY_TICK_MS = 30 * 1000;  // ← bunu değiştirerek hızı ayarlarsın
    let decayTick = 0;

    function startStatDecay() {
        setInterval(async () => {
            decayTick++;

            const cat = await window.db.getCat().catch(() => null);
            if (!cat) return;

            // Sadece main ekranındayken değil, arka planda her zaman çalışır
            const patch = { id: cat.id };

            if (cat.hunger      > 0)                   patch.hunger      = cat.hunger      - 1;
            if (decayTick % 2 === 0 && cat.energy      > 0) patch.energy      = cat.energy      - 1;
            if (decayTick % 3 === 0 && cat.cleanliness > 0) patch.cleanliness = cat.cleanliness - 1;
            if (decayTick % 4 === 0 && cat.happiness   > 0) patch.happiness   = cat.happiness   - 1;

            await window.db.upsertCat(patch);

            // Sadece main ekranındaysa animasyonu güncelle
            if (currentSection() === "main") {
                updateCatMood();
            }

        }, DECAY_TICK_MS);
    }

    // ===========================
    // Keyboard controls
    // ===========================
    document.addEventListener("keydown", async (e) => {
        if (e.shiftKey && e.key.toLowerCase() === "r") {
            e.preventDefault();
            await window.db?.reset?.().catch(() => {});
            location.reload();
            return;
        }

        const where = currentSection();

        if (where === "nameModal") {
            if (e.key === "Enter")  { e.preventDefault(); saveNameAndGoScene2(); }
            if (e.key === "Escape") { e.preventDefault(); hideNameModal(); }
            return;
        }

        if (where === "traits") {
            if (e.key === "ArrowLeft")               { e.preventDefault(); prevTrait(); }
            if (e.key === "ArrowRight")              { e.preventDefault(); nextTrait(); }
            if (e.key === " " || e.key === "Enter")  { e.preventDefault(); confirmTrait(); }
            if (e.key === "Escape")                  { e.preventDefault(); showOnly(el.select); focusIndex(state.index); }
            return;
        }

        if (where === "select") {
            switch (e.key) {
                case " ": case "Enter":
                    e.preventDefault(); selectCat(el.cats[state.index]?.dataset.id); break;
                case "ArrowRight": e.preventDefault(); focusIndex(state.index + 1); break;
                case "ArrowLeft":  e.preventDefault(); focusIndex(state.index - 1); break;
                case "ArrowDown":  e.preventDefault(); focusIndex(state.index + state.cols); break;
                case "ArrowUp":    e.preventDefault(); focusIndex(state.index - state.cols); break;
            }
        }

        // Main ekranında klavye kısayolları
        if (where === "main") {
            if (e.key === "f" || e.key === "F") { e.preventDefault(); doFeed();  }
            if (e.key === "p" || e.key === "P") { e.preventDefault(); doPlay();  }
            if (e.key === "s" || e.key === "S") { e.preventDefault(); doSleep(); }
            if (e.key === "b" || e.key === "B") { e.preventDefault(); doBath();  }
        }
    });

    // ===========================
    // UI events
    // ===========================
    el.traitLeft?.addEventListener("click",  prevTrait);
    el.traitRight?.addEventListener("click", nextTrait);

    el.nameOk?.addEventListener("click",     saveNameAndGoScene2);
    el.nameCancel?.addEventListener("click", hideNameModal);

    el.audioBtn?.addEventListener("click", () => Snd.toggleMute());
    Snd.ensureUnlockedOnce();

    el.btnProfile?.addEventListener("click", () => {
        Snd.playSfx("click");
        openProfile();
    });

    el.profileClose?.addEventListener("click", () => {
        Snd.playSfx("click");
        closeProfile();
    });

    // YENİ: Aksiyon butonları
    el.btnFeed?.addEventListener("click",     doFeed);
    el.btnPlay?.addEventListener("click",     doPlay);
    el.btnSleep?.addEventListener("click",    doSleep);
    el.btnBathMain?.addEventListener("click", doBath);

    // ===========================
    // Boot
    // ===========================
    async function boot() {
        showOnly(el.splash);
        await new Promise((r) => setTimeout(r, 2000));

        const cat = await window.db.getCat().catch(() => null);

        if (!cat) {
            showOnly(el.select);
            setupSelect();
            return;
        }

        if (!cat.personality) {
            showOnly(el.traits);
            state.traitIndex = 0;
            renderTrait();
            return;
        }

        // Kedi var ve trait seçili → direk main'e git
        showOnly(el.main);
        Snd.playMusic("bg");
        await updateCatMood();
        scheduleIdleBehavior();
        startStatDecay();
    }

    // Main'e her geçişte decay ve mood'u başlat
    // (scene2 ve bathroom'dan gelince de çalışsın diye)
    const _origShowOnly = showOnly;
    // showOnly override: main'e geçince decay + mood başlat
    // (Bu kısım boot() içinde zaten halloluyor, extra guard için)

    setupScene2();
    boot();
});
