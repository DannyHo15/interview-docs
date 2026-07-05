# 01 — Design a News Feed (Twitter/Facebook-like)

> **Loại:** Medium · **Tần suất:** 🔥🔥🔥 (rất phổ biến cho frontend system design).

---

## Bước 1 — Requirements

### Functional
- User xem danh sách post từ ngườì họ follow.
- Create post (text + media).
- Like, comment, share post.
- Pull-to-refresh / infinite scroll.

### Non-functional
- **Performance**: load nhanh, scroll mượt (60fps).
- **Accessibility**: screen reader, keyboard navigation.
- **Real-time**: like/comment mới cập nhật nhanh.

### Scope
- MVP: xem feed + like + create text post.
- Later: comments, media upload, share, notifications.

---

## Bước 2 — API & Data Model

```typescript
// GET /api/feed?cursor=xxx&limit=20
interface FeedResponse {
  posts: PostSummary[];
  nextCursor: string | null;
}

interface PostSummary {
  id: string;
  author: { id: string; name: string; avatar: string };
  content: string;
  media: { url: string; type: 'image' | 'video'; width: number; height: number }[];
  stats: { likes: number; comments: number; shares: number };
  createdAt: string;
  hasLiked: boolean;
}
```

- Pagination dùng **cursor-based** để tránh duplicate khi có post mới.

---

## Bước 3 — Component Architecture

```
<FeedPage>
  <CreatePost />
  <FeedList>
    {posts.map(post => <PostCard key={post.id} post={post} />)}
    <LoadingTrigger />
  </FeedList>
</FeedPage>
```

### PostCard
```
<PostCard>
  <AuthorHeader />
  <PostContent />
  <MediaGallery />
  <ActionBar like comment share />
  <LikeCount />
  <CommentPreview />
</PostCard>
```

---

## Bước 4 — State Management

- **Server state**: feed posts → React Query (`useInfiniteQuery`).
- **Local state**: like loading, create post form.
- **Global state**: current user, theme.

### Infinite scroll với React Query
```typescript
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['feed'],
  queryFn: ({ pageParam }) => fetchFeed(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  initialPageParam: null as string | null,
});
```

---

## Bước 5 — Performance

1. **Virtualization**: nếu feed có hàng nghìn post, dùng `@tanstack/react-virtual`.
2. **Image optimization**:
   - Lazy load (`loading="lazy"`).
   - Placeholder/low-quality preview.
   - CDN + WebP.
3. **Code splitting**: lazy load `CreatePostModal`, `CommentThread`.
4. **Memoization**: `PostCard` dùng `React.memo` để tránh re-render khi parent cập nhật.

---

## Bước 6 — Real-time

- **SSE** cho notifications "có post mới" → hiển thị badge "New posts".
- **Optimistic update** cho like: cập nhật UI trước, rollback nếu fail.
- Không cần WebSocket toàn bộ feed; SSE đủ nhẹ.

---

## ✅ Checklist

- [ ] Cursor pagination cho infinite scroll.
- [ ] React Query/SWR cho server state.
- [ ] Virtualization cho list dài.
- [ ] Optimistic updates cho like/comment.
- [ ] Image lazy loading + CDN.
