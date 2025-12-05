# pixi-minesweeper

Classic Minesweeper created with PixiJS.

[Play the game](https://minesweeper.page)

## Getting Started

### Installation

```bash
npm install
```

## Build Commands

### Development

- **`npm start`** - Start the development server with modern settings (alias for `npm run serve-modern`)
- **`npm run serve`** - Start webpack development server
- **`npm run serve-modern`** - Start development server with modern browser optimizations
- **`npm run serve-prod`** - Start development server in production mode

### Production Build

- **`npm run build`** - Build the project for production (optimized bundle)
- **`npm run build-dev`** - Build the project in development mode (unoptimized)

### Testing

- **`npm test`** - Run the test suite
- **`npm run test-watch`** - Run tests in watch mode (automatically re-runs on file changes)

### Code Quality

- **`npm run lint`** - Check code for linting errors using ESLint
- **`npm run lint:fix`** - Automatically fix linting errors where possible
- **`npm run prettier`** - Check TypeScript source files formatting
- **`npm run prettier:fix`** - Format TypeScript source files

### Utilities

- **`npm run midi`** - Run the MIDI converter utility

## Development Server

When running the development server, the application will be available at:
- **URL:** `http://localhost:3000`
- The server runs on all network interfaces (`0.0.0.0`), making it accessible from other devices on your local network

## Build Output

Production builds are output to the `build/` directory and include:
- Optimized JavaScript bundle
- Source maps for debugging
- All static assets from the `static/` folder
- Generated `index.html`

## Technology Stack

- **PixiJS** - WebGL rendering engine
- **TypeScript** - Type-safe JavaScript
- **Webpack** - Module bundler and development server
- **Jest** - Testing framework
- **Spine** - 2D skeletal animation
- **Tone.js** - Web Audio framework for interactive music and sound
