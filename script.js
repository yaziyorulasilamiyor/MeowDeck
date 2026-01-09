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
        splash: document.getElementById("splash"),
        select: document.getElementById("select"),
        traits: document.getElementById("traits"),
        nameModal: document.getElementById("name-modal"),
        scene2: document.getElementById("scene2"),
        bathroom: document.getElementById("bathroom"),
        main: document.getElementById("main"),
        profile: document.getElementById("profile"),

        // select
        grid: document.getElementById("cat-grid"),
        cursor: document.getElementById("cursor"),
        cats: Array.from(document.querySelectorAll(".cat")),

        // traits
        traitPreview: document.getElementById("trait-preview"),
        traitName: document.querySelector("#traits .trait-name"),
        traitDesc: document.querySelector("#traits .trait-desc"),
        traitLeft: document.querySelector("#traits .trait-nav.left"),
        traitRight: document.querySelector("#traits .trait-nav.right"),

        // name modal
        nameInput: document.getElementById("name-input"),
        nameOk: document.getElementById("name-ok"),
        nameCancel: document.getElementById("name-cancel"),

        // scene2
        scene2Cat: document.getElementById("scene2-cat"),
        scene2Label: document.querySelector(".scene2-label"),
        msg1: document.querySelector(".scene2-msg1"),
        msg2: document.querySelector(".scene2-msg2"),
        bathBtn: document.getElementById("btn-bath"),

        // bathroom
        bathCat: document.getElementById("bath-cat"),
        bathTitle: document.getElementById("bath-title"),
        btnTryPlaying: document.getElementById("btn-try-playing"),

        // audio
        audioBtn: document.getElementById("btn-audio"),

        // main/profile buttons
        btnProfile: document.getElementById("btn-profile"),
        profileClose: document.getElementById("btn-profile-close"),
        profileAdopted: document.getElementById("profile-adopted"),
    };

    // ===========================
    // UI Scale (fit 1024x1024)
    // ===========================
    function applyScale() {
        const BASE_W = 1024,
            BASE_H = 1024;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const scale = Math.min(vw / BASE_W, vh / BASE_H);
        const clamped = Math.min(1, scale); // don't upscale beyond 1
        document.documentElement.style.setProperty("--ui-scale", String(clamped));
    }
    applyScale();
    window.addEventListener("resize", applyScale);

    // ===========================
    // Data
    // ===========================
    const TRAITS = [
        { id: "shy", title: "shy", desc: "utangaç kedi", src: "assets/traits/shy.gif" },
        { id: "meowy", title: "meowy", desc: "çok miyav, çığırtkan", src: "assets/traits/meowy.gif" },
        { id: "excity", title: "excity", desc: "hiperaktif / heyecanlı", src: "assets/traits/excity.gif" },
        { id: "lazy", title: "lazy", desc: "uykulu / tembel", src: "assets/traits/lazy.gif" },
        { id: "angry", title: "angry", desc: "gergin / sinirli", src: "assets/traits/angry.gif" },
        { id: "careless", title: "careless", desc: "not give a meow at all", src: "assets/traits/careless.gif" },
        { id: "attention", title: "attention addict", desc: "pick-me", src: "assets/traits/attention.gif" },
        { id: "fragile", title: "fragile", desc: "ağlak / hassas", src: "assets/traits/fragile.gif" },
        { id: "fatty", title: "fat", desc: "tombik", src: "assets/traits/fatty.gif" },
    ];

    const state = {
        cols: 5,
        index: 0,
        traitIndex: 0,
        angry: false,
    };

    // which screen to return when closing profile
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
        if (el.profile && !el.profile.classList.contains("hidden")) return "profile";
        if (el.main && !el.main.classList.contains("hidden")) return "main";
        if (el.bathroom && !el.bathroom.classList.contains("hidden")) return "bathroom";
        if (el.scene2 && !el.scene2.classList.contains("hidden")) return "scene2";
        if (el.traits && !el.traits.classList.contains("hidden")) return "traits";
        if (el.select && !el.select.classList.contains("hidden")) return "select";
        if (el.splash && !el.splash.classList.contains("hidden")) return "splash";
        return "none";
    }

    // ===========================
    // Cursor / select navigation
    // ===========================
    function moveCursorTo(btn) {
        if (!btn || !el.cursor) return;
        el.cursor.style.left = btn.offsetLeft - 5 + "px";
        el.cursor.style.top = btn.offsetTop - 5 + "px";
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
                bg: "assets/audio/music_bg.mp3",
                scene2: "assets/audio/music_scene2.mp3",
                bathroom: "assets/audio/music_bathroom.mp3",
            },
            sfx: {
                click: "assets/audio/click.wav",
                meow: "assets/audio/meow.wav",
                scream: "assets/audio/scream.wav",
            },
        },

        ensureUnlockedOnce() {
            if (this._unlocked) return;
            const unlock = () => {
                this._unlocked = true;
                document.removeEventListener("click", unlock, true);
                document.removeEventListener("keydown", unlock, true);
            };
            document.addEventListener("click", unlock, true);
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

            if (this.music) {
                this.music.pause();
                this.music = null;
            }

            const a = new Audio(url);
            a.dataset.name = name;
            a.loop = true;
            a.volume = this.volumes.music;
            a.muted = this.muted;
            a.play().catch(() => { });
            this.music = a;
        },

        playSfx(name) {
            const url = this.files.sfx[name];
            if (!url) return;
            const a = new Audio(url);
            a.volume = this.muted ? 0 : this.volumes.sfx;
            a.play().catch(() => { });
        },
    };

    // Start bg music on first user interaction
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
        if (el.traitName) el.traitName.textContent = t.title;
        if (el.traitDesc) el.traitDesc.textContent = t.desc;
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
        await window.db.upsertCat({ id: current?.id, name: val, avatar: "white" }).catch(() => { });

        hideNameModal();
        showOnly(el.scene2);
        Snd.playMusic("scene2");
    }

    // ===========================
    // Scene2
    // ===========================
    function setupScene2() {
        if (!el.scene2Cat) return;

        el.scene2Cat.addEventListener(
            "click",
            () => {
                el.scene2Cat.src = "./assets/scene2/dirtycat.png";
                el.scene2Cat.style.width = "86px";
                el.scene2Cat.style.height = "79px";
                el.scene2Cat.style.transformOrigin = "left top";
                el.scene2Cat.style.transform = "scale(1.2)";
                el.scene2Cat.style.left = "152px";

                Snd.playSfx("meow");

                el.scene2Label?.classList.add("hidden");
                el.msg1?.classList.remove("hidden");
                el.msg2?.classList.remove("hidden");
                el.bathBtn?.classList.remove("hidden");
            },
            { once: true }
        );

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
        const bathCat = el.bathCat;
        const bathTitle = el.bathTitle;
        const btnTry = el.btnTryPlaying;
        if (!bathCat || !bathTitle || !btnTry) return;

        state.angry = false;
        btnTry.classList.add("hidden");

        bathCat.src = "./assets/bathroom/idlecat2.png";
        bathCat.style.left = "476px";
        bathCat.style.top = "655px";
        bathCat.style.width = "110px";
        bathCat.style.height = "207px";

        bathTitle.innerHTML = "Lets wash our cat!";
        bathTitle.style.left = "251px";
        bathTitle.style.top = "238px";

        bathCat.onmouseenter = () => {
            if (state.angry) return;
            bathCat.src = "./assets/bathroom/cathappy.png";
            bathCat.style.width = "112px";
            bathCat.style.height = "212px";
        };

        bathCat.onmouseleave = () => {
            if (state.angry) return;
            bathCat.src = "./assets/bathroom/idlecat2.png";
            bathCat.style.width = "110px";
            bathCat.style.height = "207px";
        };

        bathCat.onclick = () => {
            if (state.angry) return;
            state.angry = true;

            bathCat.src = "./assets/bathroom/catangry.png";
            bathCat.style.left = "456px";
            bathCat.style.top = "647px";
            bathCat.style.width = "127px";
            bathCat.style.height = "211px";

            Snd.playSfx("scream");

            bathTitle.innerHTML = 'Lets <span class="not">NOT</span> wash our cat!';
            bathTitle.style.left = "176px";
            bathTitle.style.top = "245px";

            setTimeout(() => {
                bathTitle.textContent = "Okay okay… let’s try playing.";
                btnTry.classList.remove("hidden");
            }, 700);
        };

        btnTry.onclick = () => {
            Snd.playSfx("click");
            showOnly(el.main);
            Snd.playMusic("bg");
        };
    }

    // ===========================
    // Select screen
    // ===========================
    function selectCat(id) {
        if (id === "white") {
            goToTraits();
        }
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
    const HEART_FULL = "assets/ui/dolukalp.png";

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

        // adopted_at default
        if (!cat.adopted_at) {
            await window.db.upsertCat({ id: cat.id, adopted_at: Date.now() }).catch(() => { });
        }

        // stat defaults
        const patch = {};
        if (cat.happiness == null) patch.happiness = 2;
        if (cat.cleanliness == null) patch.cleanliness = 2;
        if (cat.hunger == null) patch.hunger = 2;
        if (cat.energy == null) patch.energy = 2;

        if (Object.keys(patch).length) {
            await window.db.upsertCat({ id: cat.id, ...patch }).catch(() => { });
        }
    }

    async function renderProfile() {
        await ensureProfileDefaults();
        const cat = await window.db.getCat().catch(() => null);
        if (!cat) return;

        // IMPORTANT: only write the datetime (no "Adopted on:" text)
        if (el.profileAdopted) {
            const t = cat.adopted_at ? new Date(cat.adopted_at).toLocaleString("tr-TR") : "-";
            el.profileAdopted.textContent = `${t}`;
        }

        setHearts("happiness", cat.happiness ?? 2);
        setHearts("cleanliness", cat.cleanliness ?? 2);
        setHearts("hunger", cat.hunger ?? 2);
        setHearts("energy", cat.energy ?? 2);
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
            splash: el.splash,
            select: el.select,
            traits: el.traits,
            scene2: el.scene2,
            bathroom: el.bathroom,
            main: el.main,
        };
        showOnly(map[lastNonModalScreen] || el.main);
    }

    // ===========================
    // Keyboard controls
    // ===========================
    document.addEventListener("keydown", async (e) => {
        // Global reset: Shift+R
        if (e.shiftKey && e.key.toLowerCase() === "r") {
            e.preventDefault();
            await window.db?.reset?.().catch(() => { });
            location.reload();
            return;
        }

        const where = currentSection();

        // Name modal
        if (where === "nameModal") {
            if (e.key === "Enter") { e.preventDefault(); saveNameAndGoScene2(); }
            if (e.key === "Escape") { e.preventDefault(); hideNameModal(); }
            return;
        }

        // Traits
        if (where === "traits") {
            if (e.key === "ArrowLeft") { e.preventDefault(); prevTrait(); }
            if (e.key === "ArrowRight") { e.preventDefault(); nextTrait(); }
            if (e.key === " " || e.key === "Enter") { e.preventDefault(); confirmTrait(); }
            if (e.key === "Escape") { e.preventDefault(); showOnly(el.select); focusIndex(state.index); }
            return;
        }

        // Select grid navigation
        if (where === "select") {
            switch (e.key) {
                case " ":
                case "Enter":
                    e.preventDefault();
                    selectCat(el.cats[state.index]?.dataset.id);
                    break;
                case "ArrowRight": e.preventDefault(); focusIndex(state.index + 1); break;
                case "ArrowLeft": e.preventDefault(); focusIndex(state.index - 1); break;
                case "ArrowDown": e.preventDefault(); focusIndex(state.index + state.cols); break;
                case "ArrowUp": e.preventDefault(); focusIndex(state.index - state.cols); break;
            }
        }
    });

    // ===========================
    // UI events
    // ===========================
    el.traitLeft?.addEventListener("click", prevTrait);
    el.traitRight?.addEventListener("click", nextTrait);

    el.nameOk?.addEventListener("click", saveNameAndGoScene2);
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

    // ===========================
    // Boot
    // ===========================
    async function boot() {
        // show splash for 2s
        showOnly(el.splash);
        await new Promise((r) => setTimeout(r, 2000));

        const cat = await window.db.getCat().catch(() => null);

        // first run -> go select
        if (!cat) {
            showOnly(el.select);
            setupSelect();
            return;
        }

        // has cat but no trait -> go traits
        if (!cat.personality) {
            showOnly(el.traits);
            state.traitIndex = 0;
            renderTrait();
            return;
        }

        // otherwise -> go scene2
        showOnly(el.scene2);
        Snd.playMusic("scene2");
    }

    setupScene2();
    boot();
});
