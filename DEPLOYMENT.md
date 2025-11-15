# Heroku Deployment Guide

This guide explains how to deploy the Mortgage Calculator app to Heroku.

## Prerequisites

1. A Heroku account (sign up at https://www.heroku.com)
2. Heroku CLI installed (https://devcenter.heroku.com/articles/heroku-cli)
3. Git installed

## Deployment Steps

### 1. Install Dependencies

Make sure all dependencies are installed:

```bash
npm install
```

### 2. Login to Heroku

```bash
heroku login
```

### 3. Create a Heroku App

```bash
heroku create your-app-name
```

Or let Heroku generate a name:

```bash
heroku create
```

### 4. Deploy to Heroku

```bash
git add .
git commit -m "Prepare for Heroku deployment"
git push heroku main
```

If your default branch is `master` instead of `main`:

```bash
git push heroku master
```

### 5. Open Your App

```bash
heroku open
```

## How It Works

- **Build Process**: Heroku runs `npm run build` which compiles TypeScript and builds the React app
- **Server**: The `server.js` file serves the static files from the `dist` directory
- **Procfile**: Tells Heroku to run `node server.js` as a web process
- **Port**: Heroku sets the `PORT` environment variable, which the server uses

## Troubleshooting

### View Logs

```bash
heroku logs --tail
```

### Check Build Status

```bash
heroku logs --tail --source app
```

### Common Issues

1. **Build fails**: Check that all dependencies are in `package.json` and TypeScript compiles without errors
2. **App crashes**: Check logs with `heroku logs --tail`
3. **Static files not found**: Ensure `dist` folder is created during build (check `.gitignore` doesn't exclude it)

## Files Added for Heroku

- `server.js`: Express server to serve the React app
- `Procfile`: Tells Heroku how to run the app
- Updated `package.json`: Added `express` dependency and `start` script

