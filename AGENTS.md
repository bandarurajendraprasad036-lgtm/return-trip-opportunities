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
- Point 8 job identity is captured before asynchronous submission and tab changes are disabled while sending, so persisted job kind cannot drift.
- Free-membership rewards use locked SQL RPCs and an owner-readable ledger; private sharing evidence requires server-verified admin approval, and wallets have no client write grant.
- Notification preferences are account-owned records; delivery eligibility and quota reset use their validated IANA timezone, while bell sound-only mute never removes the inbox subscription.
- Bell controls share one device preference and synchronization event; browser permission status never implies background delivery, preventing conflicting controls and false delivery claims.
- Vehicle position display formats only the actual timestamp through a pure timezone-aware helper; never synthesize location data or a current-time substitute.
- Homepage listings reuse active posts and PostCard bells; local-trip classification requires identical endpoints, while separate local-area search matches named endpoint/address terms only and never implies proximity or confirmed local travel.
- The large devotional bell is the sole home bell trigger; date-based bundled engraved variants preserve gold artwork without a separate portrait overlay.
- Firebase messaging uses a separate non-caching worker scope, owner-scoped device registration and a service-only durable delivery queue dispatched by a managed authenticated schedule; pushes contain no private job/message data and provider acceptance is never a delivery receipt.
- Homepage keyless Google Maps iframe and external search follow the latest submitted vehicle endpoints, local area or job area, defaulting to India when cleared; listing filters remain independent and map output never establishes booking or verified route geometry.
- Vehicle contact surfaces reuse the shared responsibility notice; compact bells show it before interest submission without implying a confirmed booking.
- Search examples are separate presentation-only objects without post or user IDs; their bells never call interest or booking APIs.
- Membership prices share one frontend source; SQL validates new plans while retaining historical amounts, and locked admin review grants group time atomically to four distinct registered accounts.
- Paid individual job allowances use an append-only payment-linked ledger and profile-row locking; deletion never refunds usage, and expiry is derived from stored timestamps without polling.
- Sharing evidence uses owner-checked server hashing with atomic digest registration, admin-only short-lived signing and existing managed dispatch cleanup; review decisions notify the owner transactionally.
