# Ivan demo: end-to-end run

The story in one line: a coffee company runs on one overworked developer. We
install Ivan, and the commercial team starts shipping fixes to production on
their own, safely, while the developer goes outside.

The demo app is the Northbound Coffee store in this repo (storefront at `/`,
back office at `/admin`). The planted production issue is real and lives in the
code: the newsletter signup blocks for ~4.5s because the welcome email is sent
synchronously on the request path (`src/lib/email.ts`, called from
`src/app/actions.ts`). That is the thing we fix on stage.

Target length: 4 minutes. There is a 2-minute cut at the bottom.

---

## Cast

- Narrator: the developer (Victor). Tired. Owns the whole stack. Lives in a van.
- Commercial person (Adrien, or whoever): cannot log into a VPS, wants changes.
- On screen: the store, a Slack channel, a terminal, the in-browser Van agent.

## What is live vs pre-baked

Be honest with ourselves so it does not fall over on stage.

- Pre-baked: the first-time migration ("van init" churning for hours). Show it
  as a sped-up recording and land on the finished, vanified repo. Aiven
  services (Postgres + Kafka) are provisioned before we walk on stage. The
  production fork is pre-warmed so it opens instantly.
- Live: the slow newsletter submit (genuinely 4.5s in this repo), the agent
  finding and fixing it, the instant preview after the fix, and the PR.
- Backup: a screen recording of the agent run, in case the live model is slow
  or the wifi is the wifi. If the live run stalls past ~20s, cut to the tape and
  keep talking.

---

## The run

### 0:00 — Cold open: this is fine

- Screen: the Northbound store, live, looking decent.
- Say: "This is Northbound. We sell coffee. It is live, it takes real orders,
  and it is held together by one developer. Me. Who would rather be here."
- Cut to: photo of Victor in the van, touching grass.

### 0:20 — The pain

- Screen: a Slack channel stacked with commercial requests. "make the hero
  bigger", "add a discount banner", "the newsletter is so slow people drop off".
- Say: "Five commercial people, one of me. Every request is a context switch.
  And I cannot safely test anything, because there is one database, it is
  production, and the whole thing only runs on my laptop."
- Show the problem for real: open the store, submit the newsletter, count it out
  loud. "One. Two. Three. Four. Five." It finally goes through.
- Say: "Five seconds to collect an email. They have been asking me to fix this
  for a month."

### 0:50 — Install Ivan

- Screen: terminal.

```
curl -fsSL van.life | sh
van init
```

- Van detects the stack, then Claude Code takes over: it reads the repo, stands
  up Aiven Postgres and Kafka through the Aiven MCP, moves the one random
  database onto managed Postgres, and wraps the React app in `<VanProvider>`.
- Roll the sped-up recording of the churn. Land on: `✓ Vanified.`
- Laugh line: "It found my logged-in Claude Pro and just used it. Did not ask."
- Note on screen: powered by Claude, running on Aiven.

### 1:40 — Developer forks production

- Screen: terminal.

```
van fork prod
```

- Say: "This is a full copy of production. Same schema, same data, its own
  isolated Postgres and Kafka. It gave me a shareable URL. No localhost, no
  setup. Nothing I do in here can touch the real store."
- Copy the URL. "I am going to hand this to commercial and go for a walk."

### 2:20 — Commercial fixes the slow newsletter (the hero beat)

- Screen: the commercial person opens the forked store URL. Bottom-right, the
  in-browser Van agent (a chat box).
- They talk to it (ElevenLabs voice note is a nice touch): "When someone submits
  their email, it takes five seconds. Find out why and fix it."
- The agent works, narrated by what shows on screen:
  - forks the database for itself so it can poke safely,
  - introspects the schema and reads the code through the Aiven MCP,
  - finds it: the welcome email is awaited inline on the request path in
    `sendWelcomeEmail`.
  - the fix: push the email onto an Aiven Kafka topic and return immediately; a
    worker consumes the topic and sends it.
- Laugh line as the Kafka service spins up: "Our newsletter now scales to one
  trillion emails per second. In case everyone on earth signs up at once. A
  thousand times."
- Preview updates live. Commercial submits the form again. It returns instantly.
  The fix is real and on screen.

### 3:40 — Ship it without touching a machine

- Commercial hits "Submit changes" in the agent. Van opens a PR with the diff,
  with the before/after preview links attached, and an ElevenLabs voice note:
  "hey, fixed the newsletter, please review."
- Screen: the developer gets the PR on their phone, glances at it, merges.
- Say: "Commercial just shipped a production fix. They never opened an editor. I
  never opened my laptop."

### 4:10 — Close

- Screen: Victor in the van, grass, the works.
- Say: "Your commercial team ships. Your one developer touches grass. Every fork
  is real, isolated Aiven infrastructure, and the agent runs on the Aiven MCP.
  That is Ivan."

---

## Optional second beat: add a feature live

If we have time or want a B-roll variant, swap the fix for an addition:

- Commercial: "Add a discount banner to the top of the store for the weekend."
- Agent adds it on the fork, previews instantly, commercial tweaks the copy in
  place, ships the PR. Same shape, different verb: not just fixing, building.
- The richer version is the headless CMS for the blog, which needs a real
  database and is a clean reason the fork has to provision new infrastructure.

---

## Laugh-line budget

Use two or three, not all of them.

- Kafka for the newsletter, one trillion TPS. Stan asked for Kafka.
- "It found my Claude Pro login and just used it."
- Why was it on GCP in the first place: the admin got hit by a bus, then we ran
  out of credits, and AWS waved some at us. Wink at the sponsors.
- The book-a-demo button is an ElevenLabs voice agent that opens with "would you
  like some coffee?"
- Victor touching grass.

---

## Maps to this repo

- The slow submit is already here: `src/lib/email.ts` (`sendWelcomeEmail`,
  ~4.5s) awaited in `src/app/actions.ts`. That is exactly the scene-4 target.
  Do not fix it before the demo.
- The store, products, and back office that show "this is a real business" are
  at `/` and `/admin`. The back office is what commercial would otherwise be
  pestering the developer to change.
- Data is an in-memory module shaped like a DB layer (`src/lib/store.ts`), so we
  can rehearse the whole flow with just `pnpm dev`. When we want the migration
  story to be real, swap those function bodies for Aiven Postgres queries and
  the email path for an Aiven Kafka producer; the UI does not change.

## Pre-demo checklist

- [ ] Aiven Postgres + Kafka provisioned and reachable.
- [ ] Production fork pre-warmed; URL in the clipboard.
- [ ] Sped-up "van init" recording cut and ready.
- [ ] Backup recording of the agent finding and fixing the slow submit.
- [ ] Slack screenshot of commercial requests staged.
- [ ] Van photo and the touch-grass shot.
- [ ] ElevenLabs voice note recorded (optional).
- [ ] Confirm the live slow submit still takes ~4.5s (`pnpm dev`, submit at the
      footer, count it).
