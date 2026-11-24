# Samurai

A side-scrolling samurai platformer built with Phaser 4, TypeScript, and Vite.

**Play it:** https://samurai-phaser.bankolek1.workers.dev

Reach the shrine at the end of the forest. Cut down the ronin on the way.

## Controls

| Key | Action |
| --- | --- |
| ← → / A D | Move |
| Shift | Run |
| ↑ / W / Space | Jump (hold for a higher jump) |
| J / X | Slash |
| M | Sound on / off |

On phones and tablets the game plays in landscape. On Android, tap **Play in landscape** and the screen turns by itself; on iPhone, turn the phone sideways. On-screen buttons appear: ◀ ▶ to move, RUN to toggle running, JUMP, and SLASH. On iPhone, use Share → Add to Home Screen to play fullscreen.

## Sound and vibration

All sound effects are made in code with the Web Audio API, so there are no audio files. Listen for the ronin's blade glint: it means a strike is coming.

Phones vibrate on hits, damage, stars, falls, and wins. Android gets the full set. iPhone (iOS 18 and later) gets a short tick on each button tap only, because Safari allows haptics only during a tap. Use the SOUND and VIBRATE switches on the menu or in the top-right corner during play. The game remembers your choice.

## Run locally

```sh
bun install
bun run dev
```

## Deploy

The game is a static site on Cloudflare Workers.

```sh
bun run build
CLOUDFLARE_ACCOUNT_ID=<account-id> cf deploy ./dist
```
