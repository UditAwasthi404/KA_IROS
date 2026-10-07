# Kairos — Product requirements

**Product:** Kairos  
**Primary client:** iOS and Android (Expo)  
**Status:** Mobile product for the RevenueCat Shipaton Next Gen demo

## 1. Problem

Saved notes, screenshots, files, and voice memos are easy to collect and hard to recover. Keyword search fails when the person does not remember the exact wording. A general chatbot cannot see that private library, and it cannot point back to the note that justified the answer.

## 2. Product goal

Give one person a private library they can capture into, browse, and question. Keep screen memory (Recall) as a paid capability whose purchase is verified by the server.

## 3. Users

| User | Need |
| --- | --- |
| Signed-in owner | Capture something now and find it later without remembering the filename. |
| Returning owner | Ask a question and see which saved item the answer came from. |
| Prospective Pro user | Understand that Recall is the paid feature, buy it, and have it unlock without reinstalling. |

There is no shared workspace. Projects are personal collections, not team spaces.

## 4. Jobs to be done

1. Save a thought, file, image, link, or voice memo in a few taps.
2. See recent and related memories without constructing a query.
3. Ask a question and trust that the answer came from my own library.
4. Turn on screen memory only after a real subscription check.
5. Delete a memory, or delete all of my Kairos data.

## 5. Scope

### 5.1 In this release

| ID | Requirement | Priority |
| --- | --- | --- |
| P1 | Sign in and sign up with Clerk. The server maps the Clerk identity to one Kairos user. | Must |
| P2 | Capture a text note, a web link, a photo or file (image, PDF, document), or a voice memo. | Must |
| P3 | Show processing status. A failed capture can be retried. | Must |
| P4 | Library lists the user’s memories. Search can be semantic, lexical, or hybrid, and can filter by topic, entity, project, type, and date. | Must |
| P5 | Ask answers from the user’s completed memories, shows citations, and can continue in a conversation. | Must |
| P6 | Topics and entities are extracted from captures. Projects are user-managed collections. | Must |
| P7 | Today surfaces saved and resurfaced memories. Insights include a dashboard, predictions, and a brief. | Should |
| P8 | Recall ingests screen-memory events only when the `recall` entitlement is active. | Must |
| P9 | The Recall paywall sells Kairos Pro through RevenueCat. Restore purchases works. | Must |
| P10 | The user can delete one observation or all of their Kairos data. Recall data can be deleted separately. | Must |
| P11 | Progress tracks captures, asks, and Recall use (experience, streak, optional leaderboard). Leaderboard visibility defaults to private. | Should |

### 5.2 Free and Pro

| Capability | Free | Kairos Pro (`recall`) |
| --- | --- | --- |
| Capture, library, search, topics, entities, projects | Yes | Yes |
| Ask with citations | Yes | Yes |
| Today, insights, progress | Yes | Yes |
| Recall / screen memory | Paywall | Yes, while the entitlement is active |

The client must not decide Pro status. Purchase, restore, and webhook events update a server row. Recall reads that row.

### 5.3 Out of scope

- A public App Store or Play listing for this demo. Test Store is the purchase path.
- Multi-user libraries, comments, or sharing a memory with another account.
- Peer discovery. The progression peer API accepts an internal user id and does not search for people.
- Using Ask as an open web chatbot with no library behind it.
- Treating the web app as a second full client. `apps/web` is a signed-in shell; the mobile app is the product.

## 6. Primary flows

### Capture

1. From Capture, choose note, voice, photo or file, or link.
2. The app uploads the item. The API stores the file and creates an observation owned by the signed-in user.
3. A background job extracts text, chunks it, summarizes it, links topics and entities, and embeds the chunks.
4. The item appears in Library and can be cited by Ask once processing completes.

### Ask

1. The user types a question, optionally inside an existing conversation, and optionally scoped to a topic, entity, or project.
2. The API embeds the question, retrieves the user’s chunks, and asks the model to answer only from that context.
3. The app shows the answer and the citations. A citation opens the source memory.

### Recall purchase

1. The user opens Recall without an active entitlement. The paywall is the whole screen.
2. **Start Kairos Pro** completes a RevenueCat Test Store purchase. **Restore Purchases** is available.
3. The app calls `POST /billing/sync`. The API reads the subscriber from RevenueCat and writes Pro.
4. Recall unlocks. Later webhook events keep the same row current. An older event cannot overwrite a newer one.

## 7. Experience rules

- Errors from processing stay readable. The app does not pretend a failed capture succeeded.
- Ask says when evidence is insufficient instead of inventing a source.
- Screen memory is labeled as Recall and is gated. It is not mixed into free search.
- Empty states tell the user what will appear after the first capture.

## 8. Success for the demo

A judge can, on a development build:

1. Sign in and see Today.
2. Save a note and find it in the library.
3. Ask one question and see an answer tied to a saved memory.
4. Open Recall, buy Kairos Pro on the Test Store, and see Recall unlock after the server sync.

## 9. Privacy product rules

- Ownership comes from the authenticated user. A client-supplied user id is never trusted.
- One user cannot read another user’s observations, conversations, or Recall events.
- Deleting an observation removes it from that user’s library and from future Ask context.
- Deleting all Kairos data removes the account’s stored memories. Deleting Recall data removes screen-memory observations without requiring a full account wipe.
