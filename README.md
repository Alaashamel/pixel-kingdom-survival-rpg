# Pixel Kingdom: Survival RPG

A top-down browser-based survival RPG built with React and Phaser 3. Features procedurally generated worlds, real-time combat, enemy AI, inventory system, and mobile touch controls.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

### Core Gameplay
- **Movement:** WASD + Arrow Keys, mobile virtual joystick
- **Combat:** Melee attacks with critical hits, knockback, damage numbers
- **Enemy AI:** Chase behavior, attack patterns, health bars, loot drops
- **Leveling:** XP system with stat upgrades on level up

### World
- **4000x4000** procedurally generated world
- **Water features:** River with sine-wave path, pond
- **Village area** with houses and signage
- **Dungeon entrance** with glowing marker
- **Environment:** Trees, rocks, flowers, bushes, stumps
- **Dirt paths** connecting key locations

### UI/UX
- **HUD:** Health, Mana, Stamina, XP bars
- **Minimap** with real-time world view
- **Inventory panel** (press I)
- **Level-up notifications** with camera flash
- **Pause menu** (press ESC)

### Visual Effects
- **Day/night cycle** with lighting overlay
- **Rain weather** with animated droplets
- **Ambient dust particles**
- **Camera effects:** Fade transitions, screen shake on crits

### Mobile Support
- **Virtual joystick** for movement
- **Attack button** for combat
- **Responsive canvas** scaling
- **Touch-friendly UI**

## Tech Stack

- **Frontend:** React 19, Phaser 3, Vite 8
- **Backend (planned):** Node.js, Express, PostgreSQL, Prisma
- **Multiplayer (planned):** Socket.IO

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/Alaashamel/pixel-kingdom-survival-rpg.git
cd pixel-kingdom-survival-rpg/client
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Controls

| Action | Desktop | Mobile |
|--------|---------|--------|
| Move | WASD / Arrow Keys | Virtual Joystick |
| Attack | Space | Attack Button |
| Sprint | Shift | - |
| Inventory | I | - |
| Pause | ESC | - |

## Project Structure

```
pixel-kingdom-survival-rpg/
├── client/                     # React + Phaser frontend
│   ├── src/
│   │   ├── game/
│   │   │   ├── assets/         # Asset generation (AssetGenerator.js)
│   │   │   ├── entities/       # Player, Enemy classes
│   │   │   ├── scenes/         # Boot, Preload, Menu, Game scenes
│   │   │   ├── systems/        # Combat, Weather systems
│   │   │   ├── ui/             # Minimap, Inventory, MobileControls
│   │   │   ├── world/          # World generation
│   │   │   ├── config.js       # Phaser configuration
│   │   │   └── constants.js    # Game constants
│   │   ├── App.jsx             # React-Phaser bridge
│   │   └── main.jsx            # Entry point
│   └── public/                 # Static assets
├── server/                     # Backend (planned)
├── shared/                     # Shared utilities (planned)
├── docs/                       # Documentation
│   └── GAME_DESIGN.md          # Game design document
└── assets/                     # Raw game assets
```

## Architecture

### Scene Flow
```
BootScene → PreloadScene → MenuScene → GameScene
```

### Key Systems
- **CombatSystem:** Attack effects, damage numbers, knockback
- **WeatherSystem:** Day/night cycle, rain, ambient particles
- **AssetGenerator:** Programmatic pixel art texture generation
- **MobileControls:** Touch joystick and attack button

## Development Workflow

This project follows professional Git workflow:

- Feature branches (`feature/`, `fix/`, `refactor/`)
- Semantic commit messages
- Pull request reviews
- GitHub Issues for task tracking

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
