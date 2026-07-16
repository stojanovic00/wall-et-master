# media/

Static assets for the defense deck.

- `univerzitet-logo.png` / `FTN-Logo.png` - title slide logos.
- `classic_flow.png` - classic two-transaction ERC-20 deposit flow, reused as-is from `thesis/slike/`.
- `eip7702_flow_phase2.png` - cropped to just the "Faza 2 (Depozit)" band of `thesis/slike/eip7702_flow.png`.
  The full three-phase diagram is portrait-shaped and unreadable at slide scale, so only the
  atomic-deposit phase is shown (with the actor header row re-attached above it). Regenerate by
  cropping the header row and the green Faza 2 rect out of the original and stacking them with
  `convert header.png phase2.png -append`.
- The demo slide embeds the recorded demonstration directly from YouTube (no local
  fallback file - see the iframe in `index.html`).

Not currently referenced by `index.html` (kept from earlier deck iterations, not deleted since
they may be reused): `eip7702_flow.png` (full uncropped 3-phase diagram), `1_main_screen.png`,
`19_deposit_2_all_in_one_tx.png`, `22_tx_review_executed.png`.
