# Viscera - React Version

A modern React implementation of the Viscera application.

## Setup and Running

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation
1. Clone the repository
2. Navigate to the react_version directory:
   ```bash
   cd react_version
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application
1. Start the development server:
   ```bash
   npm start
   ```
   Note: Make sure you are in the `react_version` directory when running this command.

2. If port 3000 is already in use:
   - The application will prompt you to use a different port
   - Press 'Y' to accept the alternative port
   - Or kill the existing process:
     ```bash
     lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
     ```

3. The application will open in your default browser at http://localhost:3000

## Development

### Project Structure
- `src/` - Source code
  - `components/` - React components
  - `types/` - TypeScript type definitions
  - `utils/` - Utility functions
  - `App.tsx` - Main application component
  - `index.tsx` - Application entry point

### Available Scripts
- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App

## Known Issues
1. Molecule creation/editing state management issues
   - Creating a new molecule may show data from existing molecules
   - Editing a molecule may show incorrect data
   - These issues are being actively worked on

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 