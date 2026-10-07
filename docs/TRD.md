# Kairos — Technical requirements

**System:** Kairos mobile client, NestJS API, Postgres  
**Companion:** Next.js web shell (not the demo client)

## 1. Stack

| Layer | Choice |
| --- | --- |
| Mobile | Expo / React Native, Expo Router, `com.kairos.mobile` |
| Auth | Clerk session on the client. NestJS verifies the token and maps `clerkUserId` to an internal user. |
| API | NestJS on Node 20. Default port 3000. |
| Data | PostgreSQL with pgvector, accessed through Prisma. Neon in hosted setups. Postgres 16 with pgvector in Docker. |
| Files | S3 or Cloudflare R2 in production. Local disk only outside production. |
| Models | Gemini by default for analysis, Ask, OCR, and transcription. An OpenAI-compatible provider can be selected with `AI_PROVIDER`. Embeddings default to Gemini. `EMBEDDING_PROVIDER=local` is for tests and is refused in production. |
| Billing | RevenueCat. Entitlement id `recall`. Mobile SDK: `react-native-purchases`. |
| Push | Expo push tokens stored per device. |
| Web | Next.js. Clerk on the server. Routes exist for Today, Library, Capture, Ask, and You. Those pages are placeholders. |

## 2. Functional requirements

### 2.1 Identity

- Every protected route requires a valid Clerk token.
- `GET /auth/me` resolves the current user.
- The API creates the internal user on first use. Resource queries always include that internal `userId`.
- Cross-user access to a conversation or observation returns the same not-found response as a missing id.

### 2.2 Capture and processing

Accepted inputs:

| Input | API |
| --- | --- |
| File or image | `POST /observations/upload` or `POST /capture/upload` |
| Note | `POST /observations/from-text` or `POST /capture` |
| URL | `POST /observations/from-url` |
| Voice | Upload as audio. The pipeline transcribes it. |
| Recall event | `POST /recall/events` after an entitlement check |

Processing requirements:

1. Persist the object before the observation row is committed. If the database insert fails, delete the object.
2. Enqueue durable work on `observation_jobs`. A worker claims jobs with `SKIP LOCKED`. Restarts must not leave captures pending forever.
3. Two workers must not extract the same observation. Claiming is a compare-and-set on status.
4. Pipeline stages are `EXTRACTING`, `NORMALIZING`, `CHUNKING`, `ANALYZING`, `EMBEDDING`, then `COMPLETED` or `FAILED`.
5. Extraction covers documents, PDFs, images (OCR when configured), plain text, and audio transcription.
6. URL fetch must reject private and link-local addresses, including IPv4-mapped IPv6 forms, and must cap the body size while streaming.
7. Chunks are replaced on reprocess. Embeddings are stored in a pgvector column on `observation_chunks`.
8. Summary, topics, and entities are best-effort. If analysis fails, extracted text and chunks still remain.
9. Reprocess from edited text (`POST /observations/:id/reprocess`) must not re-extract the original file over the user’s edit.
10. A client capture id is unique per user so retries do not duplicate the observation.

### 2.3 Retrieval and Ask

- `POST /search` accepts a query plus optional topic, entity, project, type, and date filters.
- Only observations with `processingStatus = COMPLETED` are retrievable.
- Default retrieval is semantic: embed the query, cosine-search pgvector, cap how many chunks may come from one observation, then hydrate metadata.
- Hybrid search (semantic plus lexical, fused) is enabled with `SEARCH_HYBRID_ENABLED`.
- `POST /ask` and `POST /conversations/:id/ask` build a grounded prompt from retrieved chunks.
- The model returns citation indexes. The server drops any index that was not in the retrieved set.
- Stored citations are `{ observationId, chunkId, title, snippet, createdAt }`.
- When the library cannot support an answer, the response sets `insufficientEvidence`.
- A repeated `clientRequestId` returns the completed turn. A failed turn is not replayed as success.
- Search and Ask scope filters must resolve to objects the caller owns.

### 2.4 Recall and billing

- `GET /recall/entitlement` returns the server’s view of `recall`.
- `POST /recall/events` rejects the batch when the entitlement is inactive, expired, or revoked.
- Each event has a client id. A duplicate id is `deduped`, not a second observation. A soft fingerprint window collapses near-identical events.
- Recall is rate-limited in Postgres so a second API instance does not multiply the quota. Overflow events are rejected in order. The request does not fail the whole batch after partial work.
- `POST /billing/sync` loads `GET /v1/subscribers/{app_user_id}` with `REVENUECAT_SECRET_API_KEY` and writes `entitlements`.
- `POST /webhooks/revenuecat` requires `REVENUECAT_WEBHOOK_AUTHORIZATION`. Events older than `lastEventAt` are ignored.
- The entitlement row stores `isPro`, `status`, `store`, `productId`, `validUntil`, and `source`. Recall re-checks `validUntil` on read.
- `POST /billing/checkout` returns the configured RevenueCat web purchase link when a store package is unavailable. The app does not send `isPro`.
- Development builds (`__DEV__`) use the Test Store public SDK key on both platforms. Release builds use the platform public SDK keys. Secret keys stay on the server.
- A production process must refuse a configuration that grants Recall to every user.

### 2.5 Library management

- List, get, patch, download, and delete observations. Download URLs and file responses stay scoped to the owner.
- List topics and entities. Detail views are bounded (they do not load every linked observation).
- Projects support create, rename, delete, and add or remove observations, including a bulk add.
- `DELETE /users/me/data` deletes the user’s Kairos data. `DELETE /recall/data` deletes Recall-sourced observations.
- `PUT /devices/push-token` and `DELETE /devices/push-token` register the current device for processing notifications.

## 3. Security requirements

- Production refuses to boot without Clerk, database, object storage, and a non-local embedding provider (`assertProductionConfig`).
- Browser CORS is an allowlist (`CORS_ORIGINS`). Mobile clients, which send no browser `Origin`, remain allowed.
- API errors do not include stack traces, SQL, prompts, or secrets.
- File download headers strip control characters from filenames.
- AI output is validated before it is stored. Analysis and answers that fail validation do not get written as success.
- Webhook authorization is a server-side shared secret, not a client header the app can forge into Pro.

## 4. Non-functional requirements

| Area | Requirement |
| --- | --- |
| Durability | Observation jobs and entitlement rows survive process restarts. |
| Idempotency | Capture ids, Ask `clientRequestId`, Recall `clientEventId`, and progression event keys are unique where retries happen. |
| Isolation | All reads and writes for memories, search, Ask, and Recall filter by the authenticated user. |
| Scale shape | One stateless API can run as multiple instances. Locks for jobs and rate limits live in Postgres, not in process memory. |
| Cost control | Embedding and chat calls go through a configured provider. Missing keys fail the relevant stage instead of writing fake production vectors. |
| Privacy default | New progression rows are not on the public leaderboard. |

## 5. Environments

| Environment | Expectations |
| --- | --- |
| Local / Docker | Postgres with pgvector, API on port 3000, optional web shell on 3001, local file volume. |
| Device demo | Development build pointed at the API. `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY` is the Test Store public key. Expo Go cannot load the purchases SDK. |
| Production | S3 or R2, real embedding provider, CORS allowlist, RevenueCat webhook, no stub that grants Recall to everyone. |

## 6. Interfaces that must stay stable

- Entitlement id: `recall`.
- Pro is read from RevenueCat on the server, then from `entitlements`.
- Ask citations refer to real observation chunks.
- Observation processing reaches `COMPLETED` before the memory is searchable.
