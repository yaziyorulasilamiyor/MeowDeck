# MeowDeck - Virtual Cat Companion

MeowDeck is a lightweight pixel-art virtual pet prototype built with plain
HTML, CSS, and JavaScript. The player adopts a cat, chooses a personality,
names it, and then manages a small care loop from the main room.

The project is intentionally simple to run: open `index.html` in a browser or
serve the folder with Live Server.

## Current Prototype

- Adoption flow: splash, cat select, trait selection, naming, unboxing, bath,
  and main room.
- Persistent cat profile saved in LocalStorage.
- Four care stats, each clamped from `0` to `3`: happiness, fullness,
  cleanliness, and energy.
- Care actions: Feed, Play, Bath, and Sleep.
- Slow stat decay while the player is on the main room.
- Mood computation based on current needs, with safe image fallbacks.
- Profile screen with cat name, adoption date/time, personality, and stat
  hearts.
- Playroom, Settings, Credits, and Exit are no longer dead routes; unfinished
  areas show a clear planned-feature state or a simple prototype interaction.

## Controls

- Mouse: click care actions and navigation buttons.
- Keyboard on main room: `F` feed, `P` play, `B` bath, `S` sleep.
- Reset demo data: `Shift + R`.

## Project Structure

- `index.html` - screen markup and modals.
- `style.css` - pixel UI layout, transitions, feedback, and responsive scale.
- `script.js` - state management, LocalStorage persistence, care loop,
  navigation, and rendering.
- `assets/` - pixel-art sprites, backgrounds, UI images, and music.
- `docs/` - screenshots and planned-feature mockups.

## Notes

MeowDeck remains a web-first prototype. The Electron files from the original
project are still present, but the playable demo does not require Electron and
continues to work as a local static web app.
