# War Room 3.1 - Netlify Deployment

Political campaign management platform built with React, TypeScript, and Vite.

## Quick Start

```bash
npm install
npm run dev
```

## Deployment

Configured for Netlify deployment with:
- Context-aware environment variables
- SPA routing with API proxying
- Encore backend integration

## Environment Variables

Copy `.env.example` to `.env` and configure your credentials:
- Encore backend URL
- Supabase authentication
- Mentionlytics API token
- Feature flags

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Encore deployment via Leap.new
- **Deployment**: Netlify with environment contexts
- **Styling**: Tailwind CSS with custom theme