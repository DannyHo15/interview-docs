# 05 — Intervals & Greedy

> Các bài toán về khoảng thờ gian, lập lịch, và chọn lựa tối ưu cục bộ.

---

## 1. Intervals

### Khi nào dùng?
- Bài toán có **khoảng [start, end]**.
- Merge, overlap, scheduling.

### Pattern cơ bản
1. **Sort** theo start time (hoặc end time).
2. Duyệt và so sánh với interval trước đó.

### Câu hỏi kinh điển
- **Merge Intervals**
- **Insert Interval**
- **Meeting Rooms**
- **Meeting Rooms II**
- **Non-overlapping Intervals**

### Template: Merge Intervals
```typescript
function merge(intervals: number[][]): number[][] {
  if (intervals.length <= 1) return intervals;
  intervals.sort((a, b) => a[0] - b[0]);
  const result: number[][] = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const last = result[result.length - 1];
    const curr = intervals[i];
    if (curr[0] <= last[1]) {
      last[1] = Math.max(last[1], curr[1]);
    } else {
      result.push(curr);
    }
  }
  return result;
}
```

---

## 2. Greedy

### Ý tưởng
- Ở mỗi bước, chọn **lựa chọn tốt nhất cục bộ** hy vọng dẫn đến global optimal.
- Không phải lúc nào cũng đúng — phải chứng minh.

### Khi nào dùng?
- "Maximum number of", "minimum interval", "schedule tasks".
- Có **optimal substructure** nhưng không cần thử tất cả subproblems.

### Câu hỏi kinh điển
- **Jump Game**
- **Best Time to Buy and Sell Stock**
- **Assign Cookies**
- **Task Scheduler**
- **Minimum Number of Arrows to Burst Balloons**

### Template: Activity Selection (by end time)
```typescript
function maxActivities(activities: number[][]): number {
  activities.sort((a, b) => a[1] - b[1]);
  let count = 1;
  let lastEnd = activities[0][1];
  for (let i = 1; i < activities.length; i++) {
    if (activities[i][0] >= lastEnd) {
      count++;
      lastEnd = activities[i][1];
    }
  }
  return count;
}
```

---

## 📝 Checklist tự đánh giá

- [ ] Sort intervals theo start hoặc end tùy bài.
- [ ] Merge intervals viết trong 5 phút.
- [ ] Nhận diện khi nào greedy áp dụng được.
- [ ] Meeting Rooms II → dùng min-heap hoặc sweep line.
