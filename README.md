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

On phones and tablets, hold the device sideways. On-screen buttons appear: ◀ ▶ to move, RUN to toggle running, JUMP, and SLASH. On Android, the game goes fullscreen when you tap to begin. On iPhone, use Share → Add to Home Screen to play fullscreen.

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
