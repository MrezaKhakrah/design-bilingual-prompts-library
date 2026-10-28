# Bilingual Prompt Library

A bilingual prompt library web app designed to help you organize, manage, and reuse AI prompts. It supports Progressive Web App (PWA) installation and offline functionality.

## Features

- **Bilingual Interface** — Support for Persian and English.
- **Installable PWA** — Install the app on supported desktop and mobile devices.
- **Offline Support** — Access the app offline after the required resources have been cached.
- **Responsive Design** — Designed for different screen sizes.
- **Local Development** — Built with React, TypeScript, and Vite.

## Requirements

Before getting started, make sure you have:

- [Node.js](https://nodejs.org/) 18 or later
- npm (included with Node.js)

## Getting Started

### 1. Install Dependencies

Open a terminal in the project root directory and run:

```bash
npm install
```

Wait for the installation to complete before proceeding.

### 2. Start the Development Server

```bash
npm run dev
```

Open the URL displayed in your terminal, usually:

**http://localhost:5173**

The development server supports hot module replacement (HMR), allowing changes to appear in the browser as you edit the code.

## Production Build

To create an optimized production build, run:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

Vite will display the local preview URL in the terminal.

## Install as a PWA

1. Open the deployed application in a supported browser, or use a local production preview for testing.
2. Look for the **Install App** option in the app's sidebar or the browser's install icon.
3. Follow the browser's installation instructions.
4. Launch the app from your device's home screen or application list.

**Note:** PWA installation and offline functionality depend on browser support, a valid web deployment, the web app manifest, and a correctly configured service worker. Service workers generally require HTTPS, except on localhost.

## Project Structure

```text
project-root/
├── public/
│   ├── icons/
│   ├── manifest.webmanifest
│   └── sw.js
├── src/
│   ├── components/
│   ├── lib/
│   ├── state/
│   ├── utils/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts
```

*The exact structure may vary as the project evolves.*

## Troubleshooting

### Check Your Node.js Version

```bash
node -v
npm -v
```

Make sure Node.js meets the project's requirements.

### Reinstall Dependencies

If dependency installation fails or the existing installation becomes corrupted, try a clean reinstall.

**Windows CMD:**

```cmd
rmdir /s /q node_modules
del package-lock.json
npm install
```

**Important:** Deleting `package-lock.json` allows npm to resolve dependency versions again. If you want to preserve the project's locked dependency versions, keep the lockfile and remove only `node_modules` before running `npm install`.

### Common Issues

- **`npm` is not recognized:** Install Node.js and reopen your terminal.
- **Port 5173 is already in use:** Use the alternative URL provided by Vite.
- **PWA installation is unavailable:** Verify that the manifest and service worker are configured correctly and that the app is served over HTTPS or localhost.
- **Offline mode does not work:** Ensure the service worker has registered successfully and the required resources have been cached.

## Tech Stack

- React
- TypeScript
- Vite
- Progressive Web App (PWA) technologies

## License

No license has been specified yet. Add a `LICENSE` file if you intend to distribute this project under an open-source license.
