# 02 — Linked Lists, Stacks & Queues

> Các cấu trúc dữ liệu tuyến tính. Thường xuất hiện ở dạng **concept + implementation** hoặc kết hợp với array.

---

## 1. Linked List

### Định nghĩa nhanh
```typescript
class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val: number, next?: ListNode | null) {
    this.val = val;
    this.next = next ?? null;
  }
}
```

### Câu hỏi kinh điển
- **Reverse Linked List**
- **Merge Two Sorted Lists**
- **Linked List Cycle** (Floyd's Tortoise & Hare)
- **Middle of the Linked List**
- **Remove Nth Node From End of List**
- **Reorder List**

### Template: Reverse
```typescript
function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let curr = head;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}
```

### Template: Detect cycle
```typescript
function hasCycle(head: ListNode | null): boolean {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}
```

### Gotcha
- Luôn check `node?.next` trước khi truy cập.
- Dummy node (`new ListNode(0, head)`) rất hữu ích khi cần xoá node ở đầu.

---

## 2. Stack

### Khi nào dùng?
- **LIFO**: undo, backtracking, matching brackets.
- **Monotonic stack**: next greater/smaller element.

### Câu hỏi kinh điển
- **Valid Parentheses**
- **Min Stack**
- **Evaluate Reverse Polish Notation**
- **Daily Temperatures** (monotonic stack)
- **Next Greater Element**

### Template: Monotonic decreasing stack
```typescript
function nextGreaterElement(nums: number[]): number[] {
  const result = new Array(nums.length).fill(-1);
  const stack: number[] = []; // lưu index
  for (let i = 0; i < nums.length; i++) {
    while (stack.length && nums[stack[stack.length - 1]] < nums[i]) {
      const idx = stack.pop()!;
      result[idx] = nums[i];
    }
    stack.push(i);
  }
  return result;
}
```

---

## 3. Queue

### Khi nào dùng?
- **FIFO**: BFS, task scheduling, stream processing.
- Có thể dùng array hoặc linked list implementation.

### Câu hỏi kinh điển
- **Implement Queue using Stacks**
- **Number of Islands** (BFS)
- **Sliding Window Maximum** (monotonic deque)

### Template: BFS
```typescript
function bfs(graph: Map<number, number[]>, start: number): number[] {
  const visited = new Set<number>();
  const queue = [start];
  const result: number[] = [];
  visited.add(start);

  while (queue.length) {
    const node = queue.shift()!;
    result.push(node);
    for (const neighbor of graph.get(node) || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return result;
}
```

> Trong JS, `shift()` từ array là O(n). Với large queue, dùng linked-list queue hoặc two-pointer queue.

---

## 4. Deque (Double-ended queue)

### Khi nào dùng?
- Cần push/pop ở **cả 2 đầu**.
- **Sliding window maximum** — deque lưu index theo thứ tự giảm dần.

### Câu hỏi kinh điển
- **Sliding Window Maximum**
- **Design Circular Deque**

---

## 📝 Checklist tự đánh giá

- [ ] Reverse linked list viết thuần thục.
- [ ] Detect cycle bằng slow/fast pointer.
- [ ] Valid parentheses bằng stack.
- [ ] Monotonic stack: next greater element.
- [ ] BFS template bằng queue.
