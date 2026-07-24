# Pixel Kingdom: Survival RPG

A top-down browser-based survival RPG built with React and Phaser 3.

## About

Pixel Kingdom is a pixel-art survival RPG where players explore a procedurally enriched world, fight waves of enemies, collect loot, upgrade abilities, and defeat bosses. Designed for both desktop and mobile browsers.

## Features

- Player movement (WASD + Arrow Keys)
- Combat system with melee attacks
- Enemy waves and boss battles
- Weapons and equipment
- Skill tree and leveling
- Inventory system
- Achievements
- Mini map
- Day/night cycle and weather
- Mobile touch controls

## Tech Stack

- **Frontend:** React, Phaser 3, Vite
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

## Project Structure

```
pixel-kingdom-survival-rpg/
├── client/                 # React + Phaser frontend
│   ├── src/
│   │   ├── game/           # Phaser game code
│   │   │   ├── config.js   # Game configuration
│   │   │   ├── entities/   # Player, enemies, NPCs
│   │   │   ├── scenes/     # Game scenes
│   │   │   └── world/      # World generation
│   │   ├── assets/         # Sprites, maps, sounds
│   │   ├── App.jsx         # React-Phaser bridge
│   │   └── main.jsx        # Entry point
│   └── public/             # Static assets
├── server/                 # Backend (planned)
├── shared/                 # Shared utilities (planned)
├── docs/                   # Documentation
└── assets/                 # Raw game assets
```

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
