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

- Use the same transparent logo asset for the page header and generated claim-card canvas, so both representations stay visually consistent.
- Keep the share-card image export aligned with the visible front/back card artwork, so either side can be shared as seen.
- Render card PNG exports at 2160 × 3840 from the fixed logical card layout, explicitly loading fonts and original assets before drawing; this preserves sharp text and layout parity on both sides.
- Keep the waitlist claim behind the validated database function, with optional preferences saved on the claim row; this avoids exposing private registrations directly.
- Social icons are intentionally removed from the header until the user supplies real accounts; if they return, restore them as a dedicated header component with sample-ID previews.
- Background footage uses a fixed scenery plate with bounded reaction overlays and matching posters; update every playback source together so browsers cannot select an older unstabilized format.
