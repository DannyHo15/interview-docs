# 03 — Trees & Graphs

> Phần này đòi hỏi nhận diện pattern nhanh: tree → recursion, graph → DFS/BFS/topological sort.

---

## 1. Binary Tree

### Các loại traversal
- **DFS**: preorder (root-left-right), inorder (left-root-right), postorder (left-right-root).
- **BFS**: level-order.

### Câu hỏi kinh điển
- **Maximum Depth of Binary Tree**
- **Same Tree / Symmetric Tree**
- **Invert Binary Tree**
- **Binary Tree Level Order Traversal**
- **Subtree of Another Tree**

### Template: DFS recursion
```typescript
function maxDepth(root: TreeNode | null): number {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

### Template: BFS level-order
```typescript
function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return [];
  const result: number[][] = [];
  const queue = [root];
  while (queue.length) {
    const level: number[] = [];
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift()!;
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}
```

---

## 2. Binary Search Tree (BST)

### Tính chất
- Left < Node < Right.
- Inorder traversal cho **sorted sequence**.

### Câu hỏi kinh điển
- **Validate Binary Search Tree**
- **Lowest Common Ancestor of BST**
- **Kth Smallest Element in a BST**
- **Insert / Delete into a BST**

### Template: Validate BST
```typescript
function isValidBST(root: TreeNode | null): boolean {
  function validate(node: TreeNode | null, min: number, max: number): boolean {
    if (!node) return true;
    if (node.val <= min || node.val >= max) return false;
    return validate(node.left, min, node.val) && validate(node.right, node.val, max);
  }
  return validate(root, -Infinity, Infinity);
}
```

---

## 3. Graph

### Biểu diễn
- **Adjacency list**: `Map<number, number[]>` hoặc `number[][]` — phổ biến nhất.
- **Adjacency matrix**: `boolean[][]` — khi graph dense.

### DFS recursion template
```typescript
function dfs(graph: Map<number, number[]>, node: number, visited: Set<number>): void {
  if (visited.has(node)) return;
  visited.add(node);
  for (const neighbor of graph.get(node) || []) {
    dfs(graph, neighbor, visited);
  }
}
```

### BFS template
```typescript
function bfs(graph: Map<number, number[]>, start: number): number[] {
  const visited = new Set<number>([start]);
  const queue = [start];
  const result: number[] = [];
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

### Câu hỏi kinh điển
- **Number of Islands**
- **Clone Graph**
- **Course Schedule** (topological sort)
- **Pacific Atlantic Water Flow**
- **Graph Valid Tree**

---

## 4. Topological Sort

### Khi nào dùng?
- Có **dependencies** giữa các task/node.
- Dấu hiệu: "prerequisites", "ordering", "valid schedule".

### Thuật toán
1. Tính **in-degree** của mỗi node.
2. Bắt đầu từ các node có in-degree = 0.
3. Giảm in-degree của neighbors, đưa vào queue khi = 0.

### Template (Kahn's algorithm)
```typescript
function topologicalSort(numCourses: number, prerequisites: number[][]): number[] {
  const graph: number[][] = Array.from({ length: numCourses }, () => []);
  const inDegree = new Array(numCourses).fill(0);

  for (const [course, prereq] of prerequisites) {
    graph[prereq].push(course);
    inDegree[course]++;
  }

  const queue: number[] = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }

  const result: number[] = [];
  while (queue.length) {
    const node = queue.shift()!;
    result.push(node);
    for (const neighbor of graph[node]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }

  return result.length === numCourses ? result : [];
}
```

---

## 📝 Checklist tự đánh giá

- [ ] 3 loại DFS tree traversal.
- [ ] BFS level-order tree.
- [ ] Validate BST bằng min/max range.
- [ ] DFS/BFS trên adjacency list.
- [ ] Topological sort bằng Kahn's algorithm.
