# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MIRA ("See Yourself Clearly") is an AI companion web app built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS v4. It uses Supabase for database/auth and Anthropic Claude for AI conversations.

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm start` — Run production server

No test framework is configured.

## Architecture

**Next.js App Router** — All pages and API routes live under `app/`.

**API Routes** (`app/api/`):
- `chat/route.ts` — Claude-powered conversation (claude-sonnet-4-20250514, max 300 tokens)
- `speak/route.ts` — Text-to-speech via ElevenLabs API
- `dreams/route.ts` — Dream analysis via Claude, returns JSON with themes and interpretation

**Key Pages**:
- `/` — Main chatbot interface with voice input (Web Speech API) and TTS output
- `/reflect` — Journaling: mood tracking, moment captures, dream journal
- `/reveal` — Personal analytics: message stats, mood trends, topic/people analysis
- `/look-back` — Historical analysis, "on this day" memories, monthly/yearly wraps
- `/settings` — Profile and voice preferences

**Data Layer**:
- `lib/supabase.ts` — Supabase client initialization and auth utilities
- `app/supabase.ts` — Additional Supabase client and auth helpers
- Supabase tables: `messages`, `moods`, `dreams`, `moments`

**Auth Flow**: Supabase Auth with email/password. Pages at `/login`, `/signup`, `/reset-password`, `/onboarding`. Client-side auth checks redirect unauthenticated users to `/login`.

**Styling**: Tailwind CSS v4 via `@tailwindcss/postcss`. Dark theme (background #020617). Predominantly inline styles with some Tailwind utility classes.

**State Management**: React hooks only (useState, useEffect). No external state library.

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase
- `ANTHROPIC_API_KEY` — Claude API
- `ELEVEN_API_KEY`, `ELEVEN_VOICE_ID` — ElevenLabs TTS
