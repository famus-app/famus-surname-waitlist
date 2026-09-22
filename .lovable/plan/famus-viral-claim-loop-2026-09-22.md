# famUS viral claim loop

## Goal
Turn the existing surname claim into a compact social-proof loop: visitors see live activity and scarcity, claim immediately, then receive a polished identity card worth sharing.

## Experience
1. **Live urgency above the form**
   - Keep the main inventory as **“30,000,000 left”**.
   - Animate number changes without distracting from the minimal black, orange, beige, and glass presentation.
   - Refresh the total while the page is open so claims made by other visitors appear without reloading.

2. **Popular surnames already taken**
   - Add a restrained **“Already claimed”** strip near the form.
   - Show only curated popular surnames that are genuinely present in the claim records; never fabricate a taken name.
   - Expose surname display text only—emails and other claim details remain private.
   - Hide the strip when none of the curated popular names have been claimed.

3. **Claim result and family number**
   - Preserve the current surname and email claim flow.
   - Assign each successful claim a stable sequential family number so the confirmation can say, for example, **“The Guptas are family #2,003.”**
   - Keep the existing **“@surname is yours”** success signal and display both pieces together.

4. **Downloadable share card**
   - Replace the simple confirmation area with a share-card preview using the existing famUS visual language.
   - Include the surname, `@handle`, family number, famUS mark, and a short scarcity line.
   - Generate a crisp portrait image in the browser for Instagram and WhatsApp Status.
   - Provide an orange share action using the device share sheet when supported, plus a download fallback.

5. **Founder badge teaser**
   - Add a clearly marked **“Coming soon”** challenge after a claim: **“Invite 3 family members to unlock your Founder badge.”**
   - Do not create referral links or count invites yet.

## Data and privacy
- Add a generated, unique claim number to each surname claim and return it safely after a successful submission.
- Move anonymous claiming through a narrowly scoped database function that validates the surname and email, inserts the claim, and returns only safe confirmation fields.
- Keep direct public reads of claim records blocked.
- Add a privacy-safe function for checking only the curated popular surnames.
- Continue exposing only the aggregate count publicly; email addresses remain inaccessible.

## Technical details
- Extend the existing database with a sequence-backed claim number, including required access grants and row-level protections.
- Add typed client calls for claiming and popular-name status, updating generated database types consistently.
- Poll the aggregate counter at a modest interval and animate transitions; clean up timers when the page closes.
- Render the card to a fixed portrait canvas for consistent downloaded output without uploading user data or images.
- Keep motion reduced when the visitor requests reduced motion.

## Verification
- Confirm a real claim decreases “left,” increases “families claimed,” and returns the correct stable family number.
- Verify duplicate surnames still show the friendly taken message.
- Verify popular names appear only after a matching real claim and no email is publicly readable.
- Test card preview, native share capability detection, image download, mobile layout, and desktop layout.
- Remove any verification claim afterward so testing does not consume a surname or alter the launch count.
