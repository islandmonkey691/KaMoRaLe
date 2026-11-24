# KaMoRaLe mobile app

This folder is the first Expo / React Native foundation for the shared iOS, Android, and web application.

## Local setup

1. Install Node.js LTS.
2. From this folder run `npm install`.
3. Copy `.env.example` to `.env`.
4. Add the KaMoRaLe Supabase Project URL and publishable key to `.env`.
5. Run `npx expo start`.

## Current scope

The first screen establishes the Facebook-inspired navigation and feed layout with KaMoRaLe branding. The feed currently uses sample content. Authentication, live Supabase queries, image/video uploads, realtime chat, push notifications, and moderation still need implementation and testing before public launch.

Never place a Supabase secret/service-role key in a mobile app or commit real credentials.
