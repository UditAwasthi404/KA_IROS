# Kairos

Kairos is a personal memory app. You capture notes, files, images, and voice, and Kairos keeps them searchable. Ask questions in plain language, or turn on Recall to use screen memory across what you have already saved.

Recall is included for every signed-in user when `RECALL_ENABLED=true` on the API. There is no subscription / RevenueCat integration in this build.

## Repository

| Path | What it is |
| --- | --- |
| `apps/mobile` | Expo / React Native app (`com.kairos.mobile`) |
| `backend` | NestJS API, Prisma, Postgres |
| `docs/PRODUCT.md` | Product overview |
| `docs/PRD.md` | Product requirements |
| `docs/TRD.md` | Technical requirements |
| `docs/ARCHITECTURE.md` | System, data flows, and trust boundaries |

## Run the backend

Requires Node 20.

```bash
npm install
cp backend/.env.example backend/.env
```

Fill `backend/.env` with Postgres (`DATABASE_URL`, `DIRECT_URL`) and `CLERK_SECRET_KEY`. Then:

```bash
npm run prisma:migrate --prefix backend
npm run backend
```

The API listens on `PORT` (default 3000).

## Run with Docker

```bash
cp backend/.env.example backend/.env
cp .env.example .env
```

Fill `CLERK_SECRET_KEY` in both files, and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in the root `.env`. Add `AI_API_KEY` to `backend/.env` when you want Ask, capture analysis, and embeddings. Then:

```bash
docker compose up --build
```

## Run the mobile app

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Set at least:

- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_API_URL` (Android emulator: `http://10.0.2.2:3000` if the API is on your machine)

```bash
npm install --prefix apps/mobile
npm run mobile:android
```

Release APK (from `apps/mobile`):

```bash
eas build --platform android --profile preview
```
