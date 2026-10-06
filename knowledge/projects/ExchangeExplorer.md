# Project: ExchangeExplorer
Summary: Cryptocurrency exchange simulation and end-to-end testing framework — a visual, real-time demonstration of trading operations. React, TypeScript and Supabase.
Code: https://github.com/aloniewski2/ExchangeExplorer
Languages: TypeScript
Last updated: 2026-08-17

# Exchange Testing Platform

A comprehensive cryptocurrency exchange simulation and end-to-end testing framework built with React, TypeScript, and Supabase. This platform provides a visual, real-time demonstration of trading operations with an automated test suite for validating exchange correctness, security, and performance.

## 🎯 Overview

This project simulates a real-world cryptocurrency exchange environment with:
- Live Order Book with real-time bid/ask visualization
- Trade Execution Engine with market and limit orders
- Position Management with PnL tracking
- Automated Testing Framework with visual simulation

## ✨ Features

### Exchange Simulation
- Order Book Visualization: Real-time display of bids and asks with depth indicators
- Market Data: Live price feeds with WebSocket support (Gemini API integration)
- Balance Management: Track USD and crypto balances with locked/available amounts
- Position Tracking: Monitor open positions with live PnL calculations
- Trade History: Complete audit trail of all executed trades

### Security Features
- HMAC Authentication: Cryptographic request signing for API security
- Nonce Validation: Replay attack prevention
- Rate Limiting: Configurable request throttling
- Audit Logging: Immutable, hash-chained event log

### Testing Framework

#### Test Suites
| Suite | Description |

| Correctness | Validates order execution, balance updates, and position management |
| Idempotency | Ensures duplicate requests are handled correctly |
| Rate Limiting | Tests request throttling and burst handling |
| Performance | Measures latency percentiles (P50, P95, P99) and throughput |
| Failure Injection | Simulates network failures, price gaps, and order rejections |
| Edge Cases | Tests boundary conditions and error handling |
| State Recovery | Validates system behavior after failures |

#### Visual Test Simulation
- Real-time State Visualization: Watch balances, positions, and order book update live during tests
- Animated Trade Execution: See orders flow through the system with visual feedback
- Event Log: Color-coded activity log with icons for each event type
- Step-by-Step Execution: Slower test execution for observing state changes

### Invariant Checks
Automated verification of system invariants:
- Non-negative balances
- Balance consistency (available + locked = total)
- Valid position quantities
- Order book integrity

## 📁 Project Structure

## 🛠️ Technology Stack

| Category | Technology |

| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| State Management | React hooks, Zustand |
| Backend | Supabase (Edge Functions, PostgreSQL) |
| Data Fetching | TanStack Query |
| Charts | Recharts |
| Animations | Tailwind CSS animations, Framer Motion patterns |

## 📝 API Endpoints (Edge Functions)

| Endpoint | Method | Description |

| `/orders` | POST | Submit new orders |
| `/positions` | GET | Retrieve current positions |
| `/audit` | GET/POST | Access audit log |
| `/test-seed` | POST | Seed test data |
| `/test-reset` | POST | Reset test state |
| `/test-snapshot` | GET | Capture state snapshot |
| `/test-report` | GET | Generate test report |
