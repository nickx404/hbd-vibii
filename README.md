# Mission: Birthday Boy

A static, animated birthday adventure from Adhi. No installation or build step.

## Preview

From this folder, run `python -m http.server 8765 --bind 127.0.0.1` and open http://127.0.0.1:8765.

## Personalize

- Chapter headings and the birthday letter use the self-hosted Audiowide font. Its SIL Open Font License is stored beside it in `assets/fonts`.

- Edit `content.js` for all chapter dialogue, star messages, photo captions, and the birthday letter.
- Add real photos to an `assets` directory and set each photo's `src`, such as `assets/athirapally-01.jpg`. Empty paths show explicitly labelled illustrated placeholders.
- The launch scene provides cartoon and photo-face previews. Choose a local image to compare; it stays in browser memory and disappears on reload. No image is uploaded. Final character likeness requires a supplied reference photo.
- The birthday letter is a draft for Adhi to review. Remove the draft note in `index.html` after she approves it.

## Accessibility

All chapter navigation and discoveries work with keyboard and touch. Modal photos and the letter support Escape to close. Device reduced-motion preferences are respected, and animations pause in hidden tabs. Only the active scene is mounted.

## Delivery

Run `node verify.mjs` after editing content to check that chapters, discoveries, photo captions, the letter, and configured local photo files are complete. Run `node --check app.js` to check JavaScript syntax.

Published with GitHub Pages at https://nickx404.github.io/hbd-vibii/. Changes pushed to `main` are published automatically. The site has no tracking, server, date lock, or external network dependencies; microphone input is processed locally.

## Microphone candles

On Birthday landing, tap the cake, allow microphone access, and blow for about half a second. The live level meter appears below the cake. Input is analysed locally without recording or uploading audio. The microphone stops after the candles go out, when cancelled, when navigating to another chapter, or when the page is hidden. Microphone access is required; tapping the cake only starts the microphone and never extinguishes candles.

Microphone access requires HTTPS when hosted (localhost works for desktop preview). Opening an HTTP LAN address on a phone will not enable microphone access. The detector reuses the reference card's volume threshold, so loud background sounds can also trigger it.
