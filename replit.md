# Stones & Spices — Cloud Kitchen Website

## Overview

A single-page React application for "Stones & Spices", an Indian cloud kitchen brand. The site features a landing page with hero section, brand story, philosophy pillars, and customer reviews, plus a full interactive menu page with cart and checkout flow.

## Architecture

- **Framework**: React 18 + Vite 5
- **Styling**: Inline styles (no CSS framework)
- **Fonts**: Google Fonts (Outfit, Lora)

## Project Structure

```
/
├── stones-final.jsx      # Main React component (all UI + data)
├── src/
│   └── main.jsx          # Entry point — renders the app
├── index.html            # HTML shell with Google Fonts
├── vite.config.js        # Vite config (host 0.0.0.0, port 5000, allowedHosts: true)
└── package.json
```

## Dev Server

- Runs on `0.0.0.0:5000` via `npm run dev`
- `allowedHosts: true` configured for Replit proxy compatibility

## Deployment

- Target: static
- Build command: `npm run build`
- Public directory: `dist`
