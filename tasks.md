# 🛠️ MVP Build Plan: Friend Finder

Each task is atomic, testable, and focused on one concern.

---

## 🧱 Project Setup

1. **Initialize the Next.js App**  
   - `npx create-next-app friend-finder --app --ts`  
   - ✅ Ends with a clean starter project.

2. **Install dependencies**  
   - Install: `@neynar/nodejs-sdk`, `@supabase/supabase-js`, `onchainkit`, `clsx`  
   - ✅ Confirm all deps are added in `package.json`.

3. **Add `miniapp.config.json` and `vercel.json`**  
   - Configure metadata (title, path, etc.).  
   - ✅ App loads correctly in `/miniapps`.

---

## 🔐 Auth & API Connections

4. **Set up Supabase project + .env**  
   - Add Supabase keys to `.env.local`.  
   - ✅ `lib/supabase.ts` connects without error.

5. **Create Neynar API wrapper**  
   - `lib/neynar.ts` with initialized client.  
   - ✅ Can call `getUserByFid()` or `getFollowing()`.

6. **Add `lib/farcaster.ts` helpers**  
   - Add `getFollowers(fid)`, `getFollowing(fid)`, etc.  
   - ✅ Test data comes back for your own FID.

---

## 🧠 Core Logic + Data Flow

7. **Add `utils/profileCache.ts`**  
   - Caches profile metadata in memory.  
   - ✅ Can fetch Farcaster profile once and reuse it.

8. **Build `utils/sort.ts`**  
   - Add `sortByMutuals()`, `sortByFollowerCount()`.  
   - ✅ Sample array sorts correctly.

9. **Create server route `/api/recs/route.ts`**  
   - Accepts user FID, returns ranked mutuals.  
   - ✅ Hit endpoint and get mock data.

---

## 📱 UI: Warm Recommendations

10. **Create `components/WarmRecsList.tsx`**  
    - Takes list of recs, renders cards.  
    - ✅ Sample props display profiles.

11. **Wire up `app/page.tsx`**  
    - Calls Neynar, shows top warm recs.  
    - ✅ Scrollable list appears in-app.

---

## 🔄 UI: One-Way Lists

12. **Create `components/OneWayList.tsx`**  
    - Accepts props for "follow" or "unfollow" actions.  
    - ✅ Shows 2 columns: one-way out, one-way in.

13. **Build `app/one-way/page.tsx`**  
    - Calls Neynar: `followers`, `following`  
    - ✅ Displays buttons to follow/unfollow.

---

## 🧭 Navigation + Layout

14. **Create `components/Nav.tsx`**  
    - Simple top nav: “🏠 Recs” | “↔️ One-Way”  
    - ✅ Allows screen switching between pages.

15. **Set up `app/layout.tsx`**  
    - Imports global CSS, wraps `Nav.tsx`  
    - ✅ UI consistent across pages.

---

## 💄 Styling & UX Polish

16. **Create `styles/globals.css`**  
    - CRT theme: green text, black bg, dotted borders.  
    - ✅ Entire app uses this style.

17. **Add fallback loading states**  
    - Skeletons or `Loading...` for both screens.  
    - ✅ Visible during fetch delay.

---

## 🚀 Finalization & Deployment

18. **Verify `miniapp.config.json`**  
    - Add `frame: true`, icon, description.  
    - ✅ Appears in Mini App browser.

19. **Push to GitHub + Deploy to Vercel**  
    - Link to repo, connect Vercel project.  
    - ✅ Visit `*.limo` link and test auth + calls.
