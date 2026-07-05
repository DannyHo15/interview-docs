# 00 — Khung trả lờí Frontend System Design

> Frontend system design không có công thức duy nhất, nhưng có khung để trả lờí có cấu trúc.

---

## Bước 1 — Requirements (2–3 phút)

### Functional
- User có thể làm những gì?
- Có bao nhiêu loại user/role?
- Có mobile/web/cả hai?

### Non-functional
- **Performance**: TTI, LCP, INP, bundle size.
- **Accessibility**: keyboard navigation, screen reader, color contrast.
- **Reliability**: offline support, error boundaries, retry.
- **Scalability**: số lượng item hiển thị, concurrent users.

### Scope
- MVP là gì? Có thể bỏ qua feature nào ban đầu?

---

## Bước 2 — API & Data Model (3–5 phút)

Ví dụ News Feed:
```typescript
// GET /api/feed?cursor=xxx&limit=20
interface FeedResponse {
  posts: Post[];
  nextCursor: string | null;
}

interface Post {
  id: string;
  author: User;
  content: string;
  media: MediaItem[];
  likes: number;
  commentsCount: number;
  createdAt: string;
}
```

- REST hay GraphQL?
- Pagination: offset vs cursor?
- Real-time: cần WebSocket/SSE không?

---

## Bước 3 — Component Architecture (5–7 phút)

Vẽ component tree:
```
<App>
  <Header />
  <FeedPage>
    <CreatePost />
    <VirtualizedList>
      <PostCard>
        <AuthorInfo />
        <MediaGallery />
        <ActionBar />
        <CommentPreview />
      </PostCard>
    </VirtualizedList>
  </FeedPage>
</App>
```

### Nguyên tắc
- **Single Responsibility**: mỗi component làm 1 việc.
- **Composition over configuration**: dùng `children` và slots.
- **Container vs Presentational**: container quản lý data, presentational chỉ render.

---

## Bước 4 — State Management (3–5 phút)

### Decision tree
| State | Nơi lưu |
|-------|---------|
| Local UI (modal open, form input) | `useState` / `useReducer` |
| Cross-component UI | Context hoặc Zustand |
| Server state | React Query / SWR |
| URL state | Router params/query |
| Global app state | Zustand / Redux Toolkit |

### Ví dụ News Feed
- **Local**: like button loading state.
- **Server**: feed posts, user profile.
- **Global**: auth user, theme.

---

## Bước 5 — Performance (3–5 phút)

### Danh sách dài
- **Virtualization**: `react-window`, `react-virtualized`, `@tanstack/react-virtual`.
- **Windowing**: chỉ render item trong viewport.

### Hình ảnh/media
- Lazy loading với `loading="lazy"`.
- Responsive images (`srcset`, `sizes`).
- CDN + optimized formats (WebP/AVIF).

### Bundle
- Code splitting theo route (`React.lazy` + `Suspense`).
- Tree shaking.
- Dynamic imports cho heavy component (charts, editors).

### Re-render
- `React.memo`, `useMemo`, `useCallback` khi cần.
- Tránh premature optimization.

---

## Bước 6 — Real-time & Sync (nếu cần)

- **Polling**: đơn giản, nhưng tốn tài nguyên.
- **SSE**: server → client one-way, tốt cho notifications.
- **WebSocket**: two-way, tốt cho chat/collaboration.

### Optimistic updates
```typescript
// React Query example
const mutation = useMutation({
  mutationFn: likePost,
  onMutate: async (postId) => {
    await queryClient.cancelQueries({ queryKey: ['post', postId] });
    const previous = queryClient.getQueryData(['post', postId]);
    queryClient.setQueryData(['post', postId], (old) => ({
      ...old,
      likes: old.likes + 1,
      liked: true,
    }));
    return { previous };
  },
  onError: (err, postId, context) => {
    queryClient.setQueryData(['post', postId], context?.previous);
  },
});
```

---

## Bước 7 — Testing & DX (2–3 phút)

- **Unit tests**: Jest + React Testing Library cho components, hooks.
- **Integration tests**: test flow user (login → create post → like).
- **E2E**: Playwright/Cypress cho critical paths.
- **Storybook**: document và test UI components độc lập.
- **TypeScript**: strict mode, shared types.

---

## 🗣️ Script mở đầu mẫu

> "Trước tiên tôi muốn clarify scope: đây là MVP hay full product? Có hỗ trợ mobile không? Tiếp theo tôi sẽ define API/data model, rồi vẽ component tree. Về state, tôi sẽ dùng React Query cho server state và Zustand cho global UI state. Performance sẽ cần virtualization nếu list dài, và lazy loading cho media."
