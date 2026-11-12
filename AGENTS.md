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
- `isMatch` mirrors database area/route matching; post-linked notifications pass a central bell-only guard, with owner-authorized exact matching and recipient interest as the only dispatch paths, preventing automatic post triggers from sending.
- First user to sign up becomes admin (handle_new_user trigger); roles live in user_roles.
- Use the shared Brand component for the bilingual wordmark so headers stay consistent.
- Keep the synthetic phone-email domain unchanged during rebrands because existing account credentials depend on it.
- Job drafting composes structured seeker inputs into the existing authenticated drafting call; preserve one inference path and do not invent missing facts.
- Phone installation uses generateSW through vite-plugin-pwa for the explicitly requested offline public pages; register only through the guarded wrapper and never cache private data or OAuth.
- Google is the only visible sign-in flow; preserve existing accounts and password credentials internally, never require a password reset during this change.
- Post inserts require a valid profile mobile through a database trigger; the same rule is checked in the form.
- Membership submissions reuse the existing review_membership RPC; the WhatsApp button opens a manual send, never claims verified receipt or automatic delivery.
- Shareable services use an opt-in service_profiles record separate from private profiles; photos stay in private storage and are signed only after checking publication, while reviewer and viewer identities remain private.
- Service discovery uses the published-only public_service_directory RPC projecting service/town/category; owner-consented account completion saves an anonymous service listing without copying private identity or changing existing public media.
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
- AppShell mounts message-only phone notices without a permission prompt; the home bell owns permission requests to avoid duplicate onboarding.
- Vehicle position display formats only the actual timestamp through a pure timezone-aware helper; never synthesize location data or a current-time substitute.
- Homepage listings reuse active posts and PostCard bells; local-trip classification requires identical endpoints, while separate local-area search matches named endpoint/address terms only and never implies proximity or confirmed local travel.
- Home categories share submitted route/area filters and car catalog; advance feed stays. Saved routes are owner-only preferences, not bookings/travel.
- Each submitted home search clears the vehicle selection; only an explicit category choice renders vehicles, with disjoint local-goods/return-goods/car partitions to avoid mixed results.
- Approximate radius alerts use owner-private user-selected endpoint coordinates and a bounded durable SQL queue; label straight-line estimates, recheck eligibility/visibility/quotas at dispatch, and never infer bookings or road geometry.
- Availability subscriptions are private explicit requests, not bookings; only owner-declared availability dispatches them, while follow-route reuses consented private saved routes and never fabricates travel history.
- The devotional bell uses explicit owner-device token registration without changing account phone; incomplete profiles receive a private completion request, never a mobile-verification or delivery claim.
- India autocomplete uses attributed static GeoNames prefix shards, not paid geocoding or public Nominatim; Leaflet imports only after opening the endpoint picker to preserve SSR safety.
- The large devotional bell is the sole home bell trigger; date-based bundled engraved variants preserve gold artwork without a separate portrait overlay.
- Firebase messaging uses a separate non-caching worker scope, owner-scoped device registration and a service-only durable delivery queue dispatched by a managed authenticated schedule; pushes contain no private job/message data and provider acceptance is never a delivery receipt.
- Homepage uses one submitted From/To search for all vehicle and job sections, without map or directions controls; actual location may prefill an unedited From field, never replace manual entry or infer proximity.
- Vehicle contact surfaces reuse the shared responsibility notice; compact bells show it before interest submission without implying a confirmed booking.
- Search examples are separate presentation-only objects without post or user IDs; their bells never call interest or booking APIs.
- Historical payment records remain read/review compatible; new direct-referral receipts use an admin-authorized atomic cash-prize ledger to prevent client awards and duplicate receipts.
- Current membership and extra-post submissions use the existing receipt table with separate purpose/payable fields; preserve legacy amount/history while server review alone grants access.
- Sharing evidence uses owner-checked server hashing with atomic digest registration, admin-only short-lived signing and existing managed dispatch cleanup; review decisions notify the owner transactionally.
- Chat attachments use authenticated server validation, private storage and participant-checked short-lived signing; post conversations require bell-created pair rows, backfilled only for historical owner/member conversations to preserve privacy.
- Listing cards/details stay anonymous with safe-column grants; paid bell/chat authorization is separate from free detail viewing to prevent identity disclosure.
- Direct-referral campaign ranks count only new campaign join edges, enforce one inviter and no cycles, and expose only owner-scoped stats; cash awards never imply payout.
- Confirmed receipts atomically credit only the eligible direct inviter; historical invitee ledgers remain read-only evidence, new accounts keep unique codes, and remaining-slot reads expose aggregates only.
- Paid alert eligibility is enforced by receipt-linked periods at database insertion/read and every screen/device delivery path, never by editable profile flags; post usage persists separately from deletable posts to prevent quota bypass.
- Daily competition notices reuse the managed dispatcher and an atomic per-user/day ledger; public photo signing accepts only publication-and-competition-consent-checked paths to prevent private image disclosure.
- Vehicle choices open one public category-aware listing route with date and endpoint filtering; requests remain unconfirmed until a genuine booking workflow exists.
- Personalized sharing artwork renders existing owner referral identity and same-origin product links through canvas; private profile photos never enter it, and published photos require explicit owner consent after the configured trial.
- Provider contact batches stay owner/admin private; authenticated atomic submission and admin review determine the discounted price rather than client assertions.
- Posts and new service publication share a locked durable usage ledger; extra-post receipt consumption survives deletions to prevent quota bypass.
- Service bells create private participant pairs through an authenticated paid RPC; public directories expose service/town/category only.
- Referral joins count only via confirm_referral_join (code + own mobile + OK); weekly winners come from select_weekly_winners (SQL cron Sunday night IST) requiring 70% paid joins and a consented published photo.
