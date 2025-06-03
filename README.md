# FocalFlow

Transform a series of photographs containing a recurring object into captivating animated sequences where the focal point remains perfectly still.

## Overview

FocalFlow is a browser-based creative tool that empowers artists and photographers to create unique animations from photo series. By keeping a recurring element (like a neon sign, landmark, or any consistent object) stationary across frames, FocalFlow creates mesmerizing animations where the world moves around your chosen focal point.

## Features

- **Expandable Canvas** - Work on a large grid where images can be positioned freely around your focal point
- **Smart Alignment** - Experimental automatic detection or easy manual marking with grid locks
- **Flexible Image Handling** - Support for any resolution, up to 50 images
- **Interactive Controls** - Zoom, pan, and precisely position each image
- **Animation Modes** - Quick mode for fast results, Precision mode for pixel-perfect alignment
- **Motion Trails** - Add ghosted versions of previous frames for artistic effect
- **Perspective Correction** - Auto-fix tilted shots
- **Export Options** - Create GIFs or MP4 videos of your animations

## Tech Stack

- **React** with **TypeScript** for type-safe component development
- **Vite** for fast builds and hot module replacement
- **TailwindCSS** for modern, responsive styling
- **Canvas API** for image manipulation

## Project Structure

```
src/
├── components/     # UI components
├── core/          # Image processing and alignment engine
├── utils/         # Helper functions
└── types/         # TypeScript interfaces
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd FocalFlow
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Core Components

- **ImageUploader** - Handles file uploads and image loading
- **ImageCanvas** - Displays images with zoom/pan capabilities
- **AlignmentEngine** - Core logic for image registration
- **FeatureDetector** - Detects and matches features between images

## Future Enhancements

- [ ] Multiple alignment algorithms (SIFT, ORB, etc.)
- [ ] Manual control point selection
- [ ] Batch processing capabilities
- [ ] Export in multiple formats
- [ ] Alignment history and undo/redo

## License

MIT