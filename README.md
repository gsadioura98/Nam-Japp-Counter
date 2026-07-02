# Nam Japp Counter 🙏

A simple, distraction-free devotional counter for Nam Japp meditation.

## Deploy in 3 steps (free)

### 1. Push to GitHub
1. Create a free account at github.com if you don't have one
2. Create a new repository (e.g. `nam-japp-counter`)
3. Upload every file in this folder to that repository (drag and drop works fine on github.com — click "uploading an existing file")

### 2. Deploy with Vercel
1. Go to vercel.com and sign up using your GitHub account
2. Click "Add New Project" → select your `nam-japp-counter` repo
3. Leave all settings as default → click "Deploy"
4. Wait ~60 seconds — you'll get a live link like `nam-japp-counter.vercel.app`

### 3. Share it
Send the link anywhere — WhatsApp, Instagram bio, gurdwara group. People just open it and tap.
They can also tap "Add to Home Screen" in their mobile browser menu to install it like an app.

## Running locally (optional)
If you want to preview changes before deploying:
```
npm install
npm run dev
```
Then open the local address it prints in your terminal.

## What's inside
- `src/App.jsx` — the whole app
- `public/manifest.json` + `public/sw.js` — makes it installable and usable offline
- Progress (count + malas) is saved automatically in the visitor's own browser
