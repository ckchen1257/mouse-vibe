# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## API Configuration

The client uses Vite proxy with same-origin path `/api` by default.

- Browser request: `/api/weatherforecast`
- Vite dev server proxies to: `http://localhost:8080/weatherforecast`

This avoids cross-origin CORS issues in local dev and Codespaces.

You can still override with `VITE_API_BASE_URL` when needed.

Create or update `.env.development`:

```env
# Optional override
# VITE_API_BASE_URL=http://localhost:8080

# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
# Optional
VITE_FIREBASE_MEASUREMENT_ID=
```

## Run Client + Server

1. Start API container from `mouse-vibe-server`:

   ```bash
   docker compose up --build
   ```

2. Start client from `mouse-vibe-client`:

   ```bash
   npm install
   npm run dev
   ```

3. Open the Vite URL and verify forecast data loads from `/api/weatherforecast`.

## Firebase Google Sign-In

### 1. Enable Google provider

1. Go to [Firebase Console](https://console.firebase.google.com/) → your project → **Authentication → Sign-in method**.
2. Enable **Google** and save.

### 2. Authorized domains

Add every domain that will host the app to **Authentication → Settings → Authorized domains**:

| Environment | Domain |
| --- | --- |
| Local dev | `localhost` (added by default) |
| Codespaces | `*.app.github.dev` |
| Production | your custom domain |

> If a domain is missing you'll get `auth/unauthorized-domain` when the popup opens.

### 3. Environment variables

Copy `.env.example` → `.env.development` and fill in your Firebase project values.
All `VITE_FIREBASE_*` keys are required except `VITE_FIREBASE_MEASUREMENT_ID` (optional).

### Troubleshooting

| Symptom | Fix |
| --- | --- |
| Popup blocked | Allow popups for the dev URL, or switch to `signInWithRedirect` |
| `auth/unauthorized-domain` | Add the current domain in Firebase Console → Authorized domains |
| `auth/configuration-not-found` | Double-check `.env.development` values match your Firebase project |

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
