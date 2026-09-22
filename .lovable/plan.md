# Scroll-controlled famUS video

## Build
- Add the supplied video as the full-screen visual backdrop for the existing famUS page.
- Pin the video while visitors move through a taller scroll scene.
- Map page scroll position directly to video playback progress, without autoplay or audio.
- Keep the counter, form, claim confirmation, and sharing flow readable above the footage.
- Preserve reduced-motion support by showing a stable frame instead of scrubbing.

## Technical details
- Store the uploaded video through the project asset flow and reference its CDN pointer.
- Use the video duration and scroll position to update `currentTime` efficiently.
- Validate desktop and mobile framing, scroll behavior, and page health.
