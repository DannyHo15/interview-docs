# 13 — Design Dropbox / Google Drive 📝 (tự luyện)

> **Loại:** Medium–Hard · Nặng về **file sync + conflict resolution**.
> Áp dụng [khung 6 bước](../00-solving-framework.md).

## 📌 Đề bài
Lưu file đám mây, đồng bộ (sync) giữa các thiết bị. Chỉnh sửa trên máy A → máy B nhận bản mới. Hỗ trợ share, version history.

## ❓ Clarifying questions nên hỏi
- Kích thước file tối đa? Đa số file lớn hay nhỏ?
- **Quota** per user?
- Cần **real-time sync** hay manual?
- Cần **collaborative edit** (nhiều người sửa 1 file)?
- Hỗ trợ platform nào (desktop/mobile/web)?

## 📐 Estimation hints
- Storage khổng lồ nhưng **dedup** tiết kiệm nhiều (nhiều user trùng file).
- Đa số thay đổi nhỏ → **block-level sync** thay vì cả file.

## 🎯 Trọng tâm / keywords
- **Block storage:** chia file thành **chunks/blocks** (~4MB), mỗi block có **hash** → dedup.
- Chỉ upload block thay đổi (delta sync) → tiết kiệm bandwidth.
- **Metadata service** (DB): file → list of block hashes; metadata nhẹ vs content nặng.
- **Object storage (S3)** cho block content; DB cho namespace/metadata.
- **Sync flow:** client notify change → server diff block → upload changed blocks → notify other clients.
- **Conflict resolution:** timestamp / **Operational Transform / CRDT** (đặc biệt khi collaborative).
- **Notification** tới other clients qua **WebSocket**/long-poll.
- **Versioning** = snapshot của block list.
- **Quota**, encryption at rest, share (permission).

## ✅ Checklist tự đánh giá
- [ ] Đã tách metadata (DB) vs block content (S3)?
- [ ] Đã dùng chunking + dedup + delta sync?
- [ ] Đã xử lý conflict khi đồng thời sửa?
- [ ] Đã nói versioning?

---
🔗 [README](../index.md) · [Khung 6 bước](../00-solving-framework.md)
