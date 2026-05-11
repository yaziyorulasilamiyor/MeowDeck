# MeowDeck - Virtual Cat Companion

MeowDeck is a cozy pixel-art virtual pet prototype built with plain HTML, CSS,
and JavaScript. The player adopts a cat, chooses a personality, names it, and
cares for it through a small persistent gameplay loop.

The demo runs as a static web app: open `index.html` directly or serve the
folder with a local server such as Live Server.

## Current Prototype

- Responsive 960x720 game canvas that fits normal desktop browser zoom.
- Warm morning main room using `assets/main/lightbgmain.png`.
- Evening/night mode using `assets/main/DarkBg.png`, with an in-game toggle.
- Persistent cat stats from `0` to `3`: happiness, fullness, cleanliness, and
  energy.
- Main actions: Feed, Play, Bath, and Sleep.
- Mood system for Hungry, Tired, Dirty, Sad, Happy, and Calm states.
- Slow stat decay while the main room or playroom is active.
- Profile screen with name, trait, adoption date/time, current mood, and stat
  hearts.
- Playroom mini-game using `PinkBall.gif` and `Mouse.gif`.
- Bathroom flow using `catbath.gif`.
- Settings modal for audio, lighting, and save reset.
- Credits modal with project and technology notes.

## Controls

- Mouse: click care actions, navigation buttons, and playroom toys.
- Keyboard on main room: `F` feed, `P` play, `B` bath, `S` sleep.
- Reset demo data: `Shift + R`.

## Project Structure

- `index.html` - screen markup, game panels, and modals.
- `style.css` - responsive pixel UI, warm palette, layout, and animation.
- `script.js` - state management, LocalStorage persistence, gameplay loop,
  mood rendering, mini-game, and screen flow.
- `assets/` - pixel-art sprites, backgrounds, UI images, and audio.
- `docs/` - screenshots and planned-feature mockups.

## Notes

MeowDeck is web-first and does not require Electron. The original Electron files
remain in the repository, but the portfolio demo is designed to run locally as
a lightweight browser game.
