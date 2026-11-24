# KaMoRaLe

KaMoRaLe is a Micronesian community social network. The repository currently preserves the original GitHub Pages landing site at the root and adds a shared Expo / React Native application foundation.

## Shared application

- `App.tsx` — Expo app entry, responsive Facebook-inspired feed UI, Supabase Auth and public-post feed.
- `app.json` — iOS, Android and web app configuration.
- `package.json` — Expo, React Native, React Native Web and Supabase dependencies.
- `.env.example` — required public Supabase client configuration.

## Run locally

1. Install Node.js LTS.
2. Copy `.env.example` to `.env`.
3. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to the project's Supabase URL and publishable key. Never put a service-role key in a client app.
4. Install and start:

```sh
npm install
npx expo install
npm run start
```

Use `npm run web`, `npm run android`, or `npm run ios` for the relevant target. iOS builds require macOS/Xcode or an Expo EAS build.

## Important deployment note

The existing GitHub Pages site remains the current public website. Expo web is a separate app build and needs a build/deployment workflow before it can replace or be published alongside that site. Do not point GitHub Pages at the Expo source files directly.

## Current implementation scope

The shared app foundation includes email/password sign-up and login, a home feed, a post composer, public-post loading, and the initial reaction action. Stories, media uploads, full comments and sharing, friend workflows, realtime messaging, notifications, groups, moderation and the admin dashboard remain planned implementation work.
