<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Phone login uses a synthetic email derived from the 10-digit phone (`phoneToEmail` in src/lib/match.ts) with password auth and auto-confirm — avoids SMS provider setup.
- Matching runs in the `match_post` DB trigger (inserts notifications for both sides); `isMatch` in src/lib/match.ts mirrors it for UI badges — change both together.
- First user to sign up becomes admin (handle_new_user trigger); roles live in user_roles.
- Use the shared Brand component for the bilingual wordmark so headers stay consistent.
- Keep the synthetic phone-email domain unchanged during rebrands because existing account credentials depend on it.
- Job drafting composes structured seeker inputs into the existing authenticated drafting call; preserve one inference path and do not invent missing facts.
- Phone installation uses generateSW through vite-plugin-pwa for the explicitly requested offline public pages; register only through the guarded wrapper and never cache private data or OAuth.
- Google is the only visible sign-in flow; preserve existing accounts and password credentials internally, never require a password reset during this change.
- Post inserts require a valid profile mobile through a database trigger; the same rule is checked in the form.
- Membership submissions reuse the existing review_membership RPC; the WhatsApp button opens a manual send, never claims verified receipt or automatic delivery.
- Shareable services use an opt-in service_profiles record separate from private profiles; photos stay in private storage and are signed only after checking publication, while reviewer and viewer identities remain private.
- Homepage devotional selection rotates bundled portraits by the Asia/Kolkata calendar day; the persistent generic sharing artwork links to the separate authenticated profile editor, never exposes private account details.
- Admin devotional schedules use date-keyed app_settings and private devotional-images storage; public artwork signing resolves only today's validated path, with bundled rotation as fallback.
- Private profiles are readable only by their owner or an admin; chats show only opted-in service display names, and support targeting resolves an admin UUID without phone lookup to prevent private-data leakage.
- Contextual interest uses authenticated ring_post to write an alert and post-linked message; replies group by post_id, while individual conversations stay participant-private.
- Welcome audio is a pre-generated reusable asset, played once per Indian calendar day after successful playback; browser autoplay rejection offers an explicit play control.
- Job-entry suggestions are local advisory options with a grapheme-aware minimum; unlisted work uses the existing skill/category payload, and client word feedback supplements rather than replaces authenticated moderation and the database guard.
- Keep requirement-map.md synchronized with requirement-related source and tests; use only user-supplied master numbers and explicitly distinguish implementation from end-to-end verification.
