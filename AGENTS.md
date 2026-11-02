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
