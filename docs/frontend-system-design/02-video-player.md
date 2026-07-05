# 02 — Design a Video Player (YouTube/Netflix-like) 📝 (tự luyện)

> **Loại:** Medium · **Tần suất:** 🔥🔥 (hay gặp ở media/entertainment companies).

---

## 📌 Đề bài
Design một video player web hỗ trợ play/pause, seek, volume, fullscreen, captions, và adaptive bitrate.

## ❓ Clarifying questions
- Chỉ web hay cả mobile?
- Cần hỗ trợ live streaming (HLS/DASH) hay VOD?
- Có yêu cầu DRM không?
- Cần analytics (watch time, buffering events)?

## 🎯 Trọng tâm / keywords
- **`<video>` element** vs custom controls.
- **HLS / DASH**: streaming protocol, m3u8 playlist, segmented files.
- **Adaptive bitrate**: chọn quality dựa trên bandwidth.
- **Buffering strategy**: prebuffer, stall detection.
- **Keyboard shortcuts**: space play/pause, arrows seek/volume, f fullscreen.
- **Accessibility**: ARIA labels, keyboard traps, focus management.

## ✅ Checklist

- [ ] Chọn `<video>` native hoặc wrapper (hls.js, video.js, shaka-player).
- [ ] Adaptive bitrate selection logic.
- [ ] Custom controls componentization.
- [ ] Fullscreen API + Picture-in-Picture.
- [ ] Caption/subtitle rendering.
- [ ] Error handling: network error, format unsupported.
