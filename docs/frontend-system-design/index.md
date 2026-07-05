# 🎨 Frontend System Design

> Phỏng vấn **frontend system design** khác với backend system design: focus vào **component architecture**, **state management**, **performance UI**, **API integration**, **real-time updates**, và **developer experience**.

---

## 📂 Cấu trúc thư mục

```
frontend-system-design/
├── index.md                ← bạn đang ở đây
├── 00-framework.md         ← khung trả lờí frontend system design
├── 01-news-feed.md         ← Design a News Feed
├── 02-video-player.md      ← Design a Video Player
├── 03-collaborative-editor.md ← Design Google Docs-like editor
├── 04-dashboard.md         ← Design Real-time Dashboard
└── 05-component-library.md ← Design a Component Library / Design System
```

---

## 📋 Catalog câu hỏi

| Câu hỏi | Trọng tâm | File |
|---------|-----------|------|
| **Design a News Feed** (Twitter/Facebook-like) | Infinite scroll, pagination, optimistic updates | `01-news-feed.md` |
| **Design a Video Player** (YouTube/Netflix-like) | Streaming, controls, buffering, captions | `02-video-player.md` |
| **Design a Collaborative Editor** (Google Docs) | CRDT/OT, presence, cursors | `03-collaborative-editor.md` |
| **Design a Real-time Dashboard** | WebSocket/SSE, data fetching, charts | `04-dashboard.md` |
| **Design a Component Library** | API design, theming, a11y, composition | `05-component-library.md` |

---

## 🧩 Khung trả lờí chung

1. **Clarify requirements**
   - Functional: user làm được gì?
   - Non-functional: performance, accessibility, offline support?
   - Scope: MVP hay full-featured?

2. **Define data model & API**
   - REST/GraphQL endpoints cần thiết.
   - Schema shape.

3. **Component hierarchy**
   - Vẽ cây component.
   - Phân biệt container vs presentational components.

4. **State management**
   - Local state (`useState`) vs global state (Zustand/Redux).
   - Server state (React Query/SWR).
   - URL state.

5. **Performance considerations**
   - Virtualization, lazy loading, code splitting.
   - Memoization, debounce/throttle.
   - Image/video optimization.

6. **Real-time & sync** (nếu cần)
   - WebSocket / SSE / polling.
   - Optimistic updates.

7. **Testing & DX**
   - Unit tests, integration tests, Storybook.

---

## ✍️ Mẹo trả lờí

- Luôn vẽ component tree hoặc data flow.
- Nêu trade-off giữa các giải pháp (vd virtualized list vs simple list).
- Kết nối với kinh nghiệm thực tế nếu có.
- Đừng quên accessibility và responsive design.
