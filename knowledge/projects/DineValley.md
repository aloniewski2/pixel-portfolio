# Project: DineValley
Summary: Restaurant recommendation web app for the Lehigh Valley — React, TypeScript and Tailwind, with location and preference filters over the Google Places API.
Code: https://github.com/aloniewski2/DineValley
Live: https://dinevalley-frontend.onrender.com
Languages: TypeScript, JavaScript
Last updated: 2026-08-31

# DineValley

A modern restaurant recommendation web app built with TypeScript, React, and Tailwind CSS.

## Project Structure

## Restaurant data

Restaurant data comes from OpenStreetMap. There is no API key, no quota
and no per-request cost. Two layers:

- Home region — baked into `backend/data/places.json` at build time via the
  free Overpass API (https://wiki.openstreetmap.org/wiki/Overpass_API), and
  answered from memory.
- Everywhere else — every US restaurant, pre-baked into half-degree tiles
  and published as static files at
  aloniewski2/dinevalley-data (https://github.com/aloniewski2/dinevalley-data).
  A ZIP search fetches the few tiles it touches (sub-second, from a CDN), so any
  ZIP in the country works without a live query. Overpass is only asked if the
  tile host cannot be reached. Rebuild the tiles from Geofabrik state extracts:

Re-run it whenever you want fresher data; OSM coverage in the Lehigh Valley is
actively maintained. Data is © OpenStreetMap contributors, licensed ODbL —
keep the attribution string that ships in every API response visible in the UI.

What OSM provides: name, address, coordinates, cuisine, opening hours
(parsed into real weekday ranges, which powers the *open now* filter), phone,
website, dietary tags, takeaway/delivery.

What it doesn't: star ratings, review text and photos. Cards therefore show
`rating: 0` and an empty `reviews` array, and each place gets a generated SVG
cover keyed to its cuisine instead of a photo.

## Technology Stack
- React (frontend framework)
- TypeScript (type-safe JavaScript)
- Tailwind CSS (styling)
- Vite (build tool)
- Express + OpenStreetMap/Overpass (backend and data)
- Groq (AI assistant)
- GitHub Actions (CI/CD)
