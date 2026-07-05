# 03 — Design a Collaborative Editor (Google Docs-like) 📝 (tự luyện)

> **Loại:** Hard · **Tần suất:** 🔥🔥 (hay gặp ở productivity/collaboration tools).

---

## 📌 Đề bài
Design một rich text editor cho phép nhiều user chỉnh sửa cùng lúc, thấy cursor và presence của nhau.

## ❓ Clarifying questions
- Chỉ plain text hay rich text (bold, lists, images)?
- Cần offline editing + sync sau không?
- Cần lịch sử revision / undo không?
- Số lượng concurrent users tối đa?

## 🎯 Trọng tâm / keywords
- **Operational Transform (OT)** hoặc **CRDT** (Yjs, Automerge).
- **WebSocket** cho real-time sync.
- **Presence**: cursor position, user selection, online users.
- **Conflict resolution**: concurrent edits cùng vị trí.
- **Undo/redo**: cần đảm bảo consistent giữa clients.
- **Storage**: snapshot + operation log.

## ✅ Checklist

- [ ] Chọn OT hay CRDT và giải thích trade-off.
- [ ] Real-time sync qua WebSocket.
- [ ] Presence service (cursor, selection, user list).
- [ ] Conflict resolution strategy.
- [ ] Persistence: document snapshot + operation log.
- [ ] Offline support (optional but impressive).
