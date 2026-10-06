# Project: MealMatch
Summary: MealMatch is a full-stack recipe finder that merges TheMealDB and Spoonacular results, scores them by how closely they match your pantry, and augments the details with USDA nutrition data. Search by ingredients, filter by cuisine…
Code: https://github.com/aloniewski2/MealMatch
Languages: JavaScript
Last updated: 2025-11-19

# MealMatch

MealMatch is a pantry-aware recipe finder that merges TheMealDB and Spoonacular catalogs, surfaces the recipes that best match the ingredients you already own, and enriches each result with USDA nutrition data. The project ships as a small Express backend plus a Vite + React SPA that keeps pantry items, favorites, and shopping lists in sync locally or through Supabase Auth.

## Highlights

- Search TheMealDB and Spoonacular simultaneously, then sort by best match, fewest missing ingredients, shortest prep time, and more.
- Pantry manager that can autofill your ingredient search, look up USDA nutrition facts for pantry items, and persist data locally or in Supabase.
- Diet/cuisine filters, random recipe discovery, ingredient auto-complete, and substitution suggestions for common staples.
- Recipe detail screen with scaled ingredient lists, cooking modes, share actions, favorites, and a shopping list fed by the ingredients you are missing.
- Optional OpenAI Sora integration that turns any recipe into a ready-to-run video prompt.

## Tech Stack

| Layer     | Tech                                                                                                    |

| Frontend  | React 19, React Router, Vite, TailwindCSS, Supabase Auth, localStorage fallbacks                        |
| Backend   | Node.js (native fetch), Express 5, CORS, Dotenv, @supabase/supabase-js, OpenAI SDK                      |
| APIs      | TheMealDB, Spoonacular, USDA FoodData Central, OpenAI Sora (optional)                                   |

## API Overview

| Method | Path                              | Description                                                                                  |

| GET    | `/api/recipes`                    | Search Spoonacular + TheMealDB by comma-separated ingredients, with optional diet filters.   |
| GET    | `/api/recipes/:id`                | Fetch a recipe detail from either provider.                                                  |
| GET    | `/api/cuisines`                   | List all cuisines available from TheMealDB.                                                  |
| GET    | `/api/recipes/area/:area`         | Filter TheMealDB results by area/cuisine.                                                    |
| GET    | `/api/random`                     | Pull one random recipe from the selected source(s).                                          |
| GET    | `/api/spoonacular/autocomplete`   | Proxy to Spoonacular’s recipe auto-complete endpoint.                                        |
| GET    | `/api/spoonacular/search`         | Proxy to the richer Spoonacular complex search API.                                          |
| GET    | `/api/usda/search`                | Fetch nutrition data for pantry items from USDA FoodData Central.                            |
| POST   | `/api/video`                      | Build (and optionally submit) an OpenAI Sora video prompt for the given recipe.              |

All responses surface source-specific errors so the UI can degrade gracefully if one API quota is exhausted.

## Supabase Setup (Optional, but recommended)

Create two tables in your Supabase project to sync favorites and pantry items. The definitions below assume `uuid_generate_v4()` is available; adjust to your project defaults.

Expose both tables to the Supabase anon key (Row Level Security policies that match the authenticated `user_id` are recommended).
