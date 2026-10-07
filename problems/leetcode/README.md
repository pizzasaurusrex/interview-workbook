# LeetCode-style practice

One file per topic. Each file holds the problem statements as comments above an
empty function signature; the matching `*.test.ts` file is the spec.

Run a topic:

```
npx jest problems/leetcode/bfs_trees
```

`tree.ts` is shared scaffolding — a `TreeNode` class plus `buildTree`, which
takes LeetCode's level-order array form (`[3, 9, 20, null, null, 15, 7]`) and
returns the root. You don't need to touch it.

## Topics

| File | Problems |
| --- | --- |
| `bfs_trees.ts` | level order, right side view, zigzag, level averages, min depth, max level sum, bottom left value, deepest leaves sum, cousins, max width, even-odd tree |
| `dfs_trees.ts` | in-order traversal, max depth, path sum, validate BST, diameter, root-to-leaf paths |
