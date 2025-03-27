# Molecule Creator

A React application for creating and managing collections of files called "molecules". Each molecule can have a title, cover image, and multiple content files.

## Features

- Create and manage molecules with titles and cover images
- Upload multiple files to each molecule
- Drag and drop file upload support
- File previews for images
- File type icons for non-image files
- Storage management with IndexedDB (falls back to localStorage)
- Storage usage tracking
- Responsive grid layout

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

### Development

To start the development server:

```bash
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

To create a production build:

```bash
npm run build
```

The build output will be in the `build` directory.

## Usage

1. Click "Create Molecule" to create a new molecule
2. Enter a title and select a cover image
3. Add content files by dragging and dropping or clicking the upload area
4. Click "Save" to create the molecule
5. Click on any molecule to view or edit it
6. Use the "Clear Storage" button to remove all molecules

## Storage

The application uses IndexedDB for storage with a fallback to localStorage. The storage limit is:
- IndexedDB: ~1GB
- localStorage: ~5MB

## Technologies Used

- React
- TypeScript
- Material-UI
- IndexedDB
- localStorage
