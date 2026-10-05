#!/usr/bin/env node
// Runs api/chat.js locally, without Vercel, at http://localhost:3000/api/chat.
//
//   LLM_BASE_URL=https://api.groq.com/openai/v1 LLM_MODEL=llama-3.3-70b-versatile \
//   LLM_API_KEY=... node scripts/serve-chat.mjs
//
// With no env vars it talks to Ollama on this machine. Pair it with
// `npm run eval:chat` to score answers before deploying.

import { createServer } from "node:http";
import { Readable } from "node:stream";

const { default: handler } = await import("../api/chat.js");
const PORT = Number(process.env.PORT) || 3000;

createServer(async (req, res) => {
  if (!req.url.startsWith("/api/chat")) {
    res.writeHead(404).end();
    return;
  }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const request = new Request(`http://localhost:${PORT}${req.url}`, {
    method: req.method,
    headers: Object.entries(req.headers).filter(([, v]) => typeof v === "string"),
    body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks),
  });
  const response = await handler(request);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  if (response.body) Readable.fromWeb(response.body).pipe(res);
  else res.end();
}).listen(PORT, () => console.log(`chat endpoint on http://localhost:${PORT}/api/chat`));
