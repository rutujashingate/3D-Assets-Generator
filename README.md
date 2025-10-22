# AI 3D Asset Builder

A professional AI-powered 3D asset builder built with Next.js, Three.js, and React. Generate, customize, and export 3D models using natural language prompts or manual controls.

![AI 3D Asset Builder](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)
![Three.js](https://img.shields.io/badge/Three.js-0.180-blue?style=flat-square&logo=three.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)

## Features

- **AI-Powered Generation**: Describe 3D assets in natural language and watch them come to life
- **Interactive 3D Viewport**: Rotate, zoom, and inspect your models in real-time
- **Comprehensive Controls**: Fine-tune materials, lighting, colors, and effects
- **Multiple Export Formats**: Export as PNG, JPEG, or SVG
- **Preset System**: Save and load your favorite configurations
- **Professional UI**: Modern, responsive interface with smooth animations

## Supported 3D Shapes

- Sphere
- Cube
- Cylinder
- Torus
- Cone
- Torus Knot

## Material Types

- Standard (PBR)
- Physical (Advanced PBR with clearcoat)
- Phong (Classic lighting model)

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, or pnpm package manager

### Installation

1. Clone the repository:
\`\`\`bash
git clone <your-repo-url>
cd ai-3d-asset-builder
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
# or
yarn install
# or
pnpm install
\`\`\`

3. Run the development server:
\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Usage

### AI Generation

1. Click the "AI Panel" button in the header
2. Type a description like "shiny gold sphere with glow"
3. Press Enter or click the send button
4. Watch your 3D asset generate instantly

### Manual Controls

1. Click the "Controls" button to open the control panel
2. Select a shape from the grid
3. Adjust material properties:
   - Metalness
   - Roughness
   - Opacity
   - Clearcoat (Physical material only)
4. Customize lighting:
   - Ambient light intensity
   - Directional light intensity
5. Add effects:
   - Wireframe mode
   - Glow effect

### Exporting

1. Configure export settings in the Controls panel:
   - Format: PNG, JPEG, or SVG
   - Size: 256px to 2048px
2. Click the "Export" button in the header
3. Your asset will download automatically

### Presets

1. Create your desired asset configuration
2. Click "Save Preset" in the Controls panel
3. Access saved presets from the "Presets" panel
4. Load or delete presets as needed

## Project Structure

```
ai-3d-asset-builder/
├── app/
│   ├── globals.css          # Global styles and Tailwind config
│   ├── layout.tsx            # Root layout component
│   └── page.tsx              # Main page component
├── components/
│   ├── asset-builder.tsx     # Main 3D asset builder component
│   └── ui/                   # Reusable UI components
├── public/                   # Static assets
├── next.config.mjs           # Next.js configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Project dependencies
```

## Technologies Used

- **Next.js 15.5**: React framework with App Router
- **Three.js 0.180**: 3D graphics library
- **React 19**: UI library
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Radix UI**: Accessible component primitives

## Key Components

### AssetBuilderEngine

The core Three.js engine that handles:
- Scene setup and rendering
- Camera controls
- Lighting management
- 3D object creation and manipulation
- Export functionality

### AIAssetParser

Natural language processing for:
- Shape detection
- Color extraction
- Material property inference
- Effect detection









