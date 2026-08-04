# Agar.io

A single-player, browser-based `.io` game inspired by Agar.io, built from scratch with vanilla JavaScript and the HTML5 Canvas API. No frameworks, no external game engine, no build tools, just a game loop and math.

Grow your blob by eating food and smaller bots, avoid bigger bots, and climb the leaderboard.

## Features

- Smooth movement with delta-time based physics (frame-rate independent)
- Large explorable world (3000x3000) with a camera that follows the player
- Dynamic camera zoom-out as your blob grows
- 200 food particles randomly spawned across the world
- AI-controlled bots that:
    - Hunt the nearest food when small
    - Actively chase the player when big enough and in range
    - Can be eaten by the player (and eat each other)
- Mass-based speed: bigger blobs move slower, smaller blobs are faster
- Real-time leaderboard (top 5 by size, player highlighted)
- Procedural sound effects (Web Audio API, no audio files) for eating and death
- Death screen with final score and restart option
- World border visualization so you always know where the map ends

## Tech Stack

- HTML5 Canvas (2D rendering)
- Vanilla JavaScript (no frameworks, no libraries)
- Web Audio API for sound
- Plain CSS for UI overlays (score, leaderboard, death screen)

## Controls

- Move your mouse: the blob follows the cursor
- Eat food and smaller bots to grow
- Avoid bots that are noticeably bigger than you

## Running Locally

No build step required. Clone the repo and open `index.html` directly in a browser, or serve it with any static server:

```bash
git clone https://github.com/user-synax/Agar.io
cd Agar.io
```

Then just open `index.html` in your browser, or run a local server:


## Project Structure

```
.
├── index.html      # Markup and UI overlay elements
├── style.css        # Styling for canvas, HUD, and death screen
└── script.js        # Game loop, physics, AI, rendering, audio
```

## How It Works (High Level)

- A fixed-timestep-independent game loop runs via `requestAnimationFrame`, using delta time so movement speed stays consistent across different refresh rates.
- The world is larger than the viewport; a camera object tracks an offset (and zoom level) relative to the player, and all rendering subtracts this offset to simulate the player staying centered while the world moves around them.
- Bots run simple AI: find nearest food or chase the player if big enough and within range, otherwise wander toward food.
- Collision detection uses basic distance checks between circle centers compared against combined radii, with a size-ratio threshold (10%) to decide if one entity can eat another.

## Roadmap

- [ ] Splitting mechanic (space bar to split blob)
- [ ] Particle effects on eating
- [ ] Multiplayer support via WebSockets with an authoritative server
- [ ] Persistent accounts and global leaderboard

## Author

Built by [user-synax](https://github.com/user-synax) as a hobby project to explore game development fundamentals outside of typical full-stack web work.

## License

MIT
