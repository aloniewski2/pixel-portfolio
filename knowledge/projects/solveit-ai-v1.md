# Project: solveit-ai-v1
Summary: SolveIT AI — describe a problem or upload a photo and get a diagnosis, repair steps, costs and safety notes. React + Supabase Edge Functions, Qwen 3 on Groq.
Code: https://github.com/aloniewski2/solveit-ai-v1
Live: https://aloniewski2.github.io/solveit-ai-v1/
Languages: TypeScript
Last updated: 2026-09-14

# Solve Anything 🔧

An AI-powered problem-solving app that diagnoses real-world issues from photos or text descriptions. Get step-by-step solutions, visual guides, cost estimates, safety warnings, and connect with local professionals.

## ✨ Features

### Core Diagnosis Engine
- AI Vision Analysis - Upload photos or describe problems in text for instant diagnosis
- Multi-Category Support - Handles repairs, cooking, gardening, DIY projects, health & wellness, and learning how-tos
- Confidence Scoring - Get fix probability percentages, time estimates, and difficulty ratings
- Smart Follow-Up Questions - Dynamic questions when more context is needed for accurate diagnosis

### Rich Diagnosis Output
- Step-by-Step Instructions - Clear, actionable repair/solution steps
- Cost Estimates - DIY vs professional cost comparisons
- Safety Warnings - Critical safety information when applicable
- Tools Required - Complete list of necessary tools and materials

### External Resources
- Real Web Content - Crawled tutorials and guides from Reddit, YouTube, StackExchange, iFixit via Firecrawl
- Video Tutorials - Curated YouTube video recommendations
- Device Manuals - Automatic brand/model detection with links to official documentation
- Recall & Warranty Checker - Automatic search for active recalls and warranty information

### Mobile-First Features
- Native Camera Integration - One-tap photo capture using Capacitor
- Progress Tracker - Check off completed steps with celebration confetti
- Find a Pro Near Me - Location-based local professional discovery
- Expandable Images - Lightbox view for detailed visual instructions

### AI Chatbot
- Context-Aware Assistant - Follow-up questions specific to your diagnosis
- Floating Chat Interface - Accessible from any diagnosis result

### Monetization
- Lead Generation - Connect users with local repair professionals
- Shopping Lists - Affiliate links to Amazon, Home Depot, Lowe's for tools and parts

## 🏗️ Architecture

### Tech Stack

| Layer | Technology |

| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| State Management | TanStack Query |
| Backend | Supabase (Edge Functions + Postgres) |
| AI/ML | Qwen 3.8 27B via Groq (vision + text) |
| Web Crawling | Firecrawl |
| Mobile | Capacitor (iOS/Android) |
| Maps | OpenStreetMap Nominatim |

## 📱 Mobile Development

### Building for iOS/Android

## 📁 Project Structure

## 🗄️ Database Schema

### Tables

- diagnoses - Stores diagnosis results with steps, costs, tools, and metadata
- leads - Lead generation data for professional referrals
- profiles - User profiles with subscription status

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- User data is protected and isolated
- API keys stored securely as Supabase secrets
