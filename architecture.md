# Friend Finder Farcaster Mini App Architecture

## Overview

This Farcaster Mini App helps users manage and grow their network by:

1. Identifying one-way follows (you follow them, they don’t follow you — and vice versa).
2. Recommending warm connections based on mutual follows (2nd-degree connections).

Built using:

* **Next.js** (frontend)
* **Supabase** (user data & auth persistence)
* **Neynar API** (Farcaster social graph)
* **OnchainKit + Base MiniKit** (onchain identity / wallet / Base integrations)

---

## File + Folder Structure

```
/friend-finder
├── app/
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home (warm recs) screen
│   ├── one-way/                 
│   │   └── page.tsx              # One-way follows screen
│   └── api/
│       └── recs/route.ts        # Server route for warm recommendations
├── components/
│   ├── OneWayList.tsx           # Renders 1-way follow UI
│   ├── WarmRecsList.tsx         # Renders warm recs UI
│   └── Nav.tsx                  # Top navigation bar
├── lib/
│   ├── neynar.ts                # Neynar client wrapper
│   ├── farcaster.ts             # Custom Farcaster helpers
│   └── supabase.ts              # Supabase client config
├── public/
│   └── favicon.ico              # App favicon
├── styles/
│   └── globals.css              # CRT-style CSS (green on black)
├── utils/
│   ├── sort.ts                  # Sorting utilities
│   └── profileCache.ts          # Local profile fetch + cache
├── .env.local                   # Neynar + Supabase keys
├── onchainkit.config.json       # Base integration config
├── miniapp.config.json          # Farcaster Mini App metadata
├── vercel.json                  # For Mini App deployment
├── package.json
└── README.md
```

---

## What Each Part Does

### `app/`

* `page.tsx`: Home screen — warm recommendations (based on 2nd-degree mutual follows).
* `one-way/page.tsx`: Separate screen showing two lists:

  * "You follow them, they don’t follow you" (with Unfollow button)
  * "They follow you, you don’t follow back" (with Follow button)
* `api/recs/route.ts`: Optional server-side handler that computes warm recs from Supabase cache or live API.

### `components/`

* `OneWayList.tsx`: UI component for rendering each of the two 1-way follow lists with buttons.
* `WarmRecsList.tsx`: Scrollable list that shows ranked warm recommendations.
* `Nav.tsx`: Basic top nav bar between views.

### `lib/`

* `neynar.ts`: Sets up Neynar client instance, centralizes auth token usage.
* `farcaster.ts`: Wraps Neynar APIs with domain-specific helpers like `getMutuals()`, `getWarmRecs()`.
* `supabase.ts`: Configures Supabase client. Used for tracking user logins and optional caching.

### `utils/`

* `sort.ts`: Sort helpers for sorting recs by mutual count, follower count, etc.
* `profileCache.ts`: Fetches and caches profile info (handle, avatar, follower count).

---

## Where State Lives

### Client State

* `React.useState`/`useEffect` manages UI loading, profile data, scroll state.
* Cursor-based pagination handled in state (`cursorYF`, `cursorTF`, `cursorRecs`).
* Profiles stored in a local dictionary (`profiles[handle] = {...}`) to avoid refetching.

### Server State

* **Supabase** stores user auth sessions (email or wallet-based login).
* Optional: store user’s cached following/follower list in Supabase to speed up 2nd visits.

---

## How Services Connect

### Neynar API (Social Graph + Actions)

* Fetch following/follower lists
* Fetch profile metadata (avatar, follower count, etc.)
* `followUser()` / `unfollowUser()` to manage follow/unfollow actions

### Supabase (User Session + Optional Caching)

* Stores auth sessions (email/wallet)
* Optional: store cached `followers`/`following` arrays
* Optional: store usage stats, rec logs, referral IDs

### OnchainKit + MiniKit (Farcaster & Base)

* Allows onchain identity & login (via Farcaster or wallet)
* Required for official Mini App deployment on `*.limo`

---

## Deployment

* Deploy via **Vercel** (with `vercel.json` for Mini App config)
* Needs `miniapp.config.json` for metadata (name, icon, path, description)
* Should be `frame:true` and `fullscreen:true` for best experience

---

## Final Notes

This architecture is:

* Modular (split by screen + component)
* Extendable (easy to add clusters, leaderboard, token gating later)
* Optimized (use pagination + profile caching to avoid rate limits)

Once the base is built, expanding into viral features (like Follow-for-Follow ladders or Token Gated Groups) is straightforward.
