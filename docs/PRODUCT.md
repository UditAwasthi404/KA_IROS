# Kairos — Product overview

Kairos is a personal memory app. You capture notes, files, images, links, and voice. Kairos turns them into something you can browse and ask. Recall, the screen-memory feature, is Kairos Pro.

People already save screenshots, voice memos, and files. Finding one detail later still means remembering the exact words. Kairos keeps the original, extracts the text, and answers in ordinary language with a citation back to the source.

## Who it is for

Someone who captures things across a day and needs them back later: a student, a founder, anyone whose notes are scattered. The account is personal. Each library belongs to one signed-in user.

## What you can do

| Surface | What it is |
| --- | --- |
| **Today** | A home for what you saved and what is worth opening now. |
| **Capture** | Text note, voice memo, photo or file, or a web link. |
| **Library** | Browse and search what you saved, including topics, entities, and projects. |
| **Ask** | A question in plain language. The answer is grounded in your memories and cites the source. |
| **You** | Account, progress, privacy, and settings. |
| **Recall** | Screen memory while you work. This is Kairos Pro. |

Capture, library, and Ask are free. Recall stays behind the RevenueCat entitlement `recall`.

## Why it is not a chatbot

Ask does not answer from a blank model. Retrieval runs over the user’s own chunks. The model must cite those chunks. Citations that do not match retrieved evidence are dropped. If the library does not support an answer, the response says the evidence is insufficient.

Recall is a specific capability, not a cosmetic upgrade. The phone never tells the server that the user is Pro. After a purchase or restore, the app calls the API, and the API reads the subscriber from RevenueCat.

## How Pro works in the demo

Development builds purchase Kairos Pro through the RevenueCat Test Store. Opening Recall without an active `recall` entitlement shows the paywall. **Start Kairos Pro** buys the Test Store package. **Restore Purchases** recovers an existing one. The server then records Pro in Postgres.

App Store and Play products can use the same entitlement later. They are not required for this demo.

## What to look at

1. [Product requirements](PRD.md) — who it serves, what is in scope, and what is free versus Pro.
2. [Technical requirements](TRD.md) — stack, pipeline, security, and the rules the system must hold.
3. [Architecture](ARCHITECTURE.md) — how the phone, API, database, and RevenueCat fit together.
4. [RevenueCat subscriptions](REVENUECAT_SUBSCRIPTIONS.md) — Test Store, webhooks, and the `recall` entitlement.
5. [Shipaton demo script](SHIPATON_NEXT_GEN.md) — the two-minute walkthrough.

The product judges should run is the Expo app in `apps/mobile` (`com.kairos.mobile`). The Next.js app in `apps/web` is a companion shell. The API in `backend` is what both talk to.
