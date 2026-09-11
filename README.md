# Birthday-game

A lightweight browser birthday game built with plain HTML, CSS, and JavaScript. The game is themed as a respectful birthday rally celebration for a Modi fan and ends with the exact message `Happy Birthday Handu`.

## Local run

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local server:
   ```bash
   npm start
   ```
3. Open `http://localhost:3000` in your browser.

## Gameplay

- Press `Space`, `Arrow Up`, or tap the game area to jump.
- Collect lotus badges to increase your score.
- Avoid road barricades.
- Reach the celebration goal to win.
- Use the **Restart** button after a win or game over.

## Heroku deployment

1. Work from this cloned Git repository (or another initialized Git repo with at least one commit), because `heroku create` adds the `heroku` Git remote used by the deploy push.
2. Install and log in to the Heroku CLI:
   ```bash
   heroku login
   ```
3. Create a Heroku app from inside the repository:
   ```bash
   heroku create
   ```
4. If you created the project from scratch, commit your files before deployment:
   ```bash
   git add .
   git commit -m "Prepare birthday game for Heroku"
   ```
5. Push the repository to Heroku:
   ```bash
   git push heroku HEAD:main
   ```
6. Open the deployed app:
   ```bash
   heroku open
   ```

The app uses:
- `server.js` for static hosting
- `package.json` with the `start` script and Node app metadata
- `Procfile` with `web: node server.js`

No runtime dependencies are required; the app is served by Node's built-in HTTP modules.

## QA report

Independent QA scoring cycles are documented in [`QA_REPORT.md`](QA_REPORT.md).
