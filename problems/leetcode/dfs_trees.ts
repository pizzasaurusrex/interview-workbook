import type { TreeNode } from "./tree";

/**
 * Depth-first tree traversal set.
 *
 * Where BFS peels off rows with a queue, DFS follows one path to the bottom
 * before backing up. The recursion stack is the data structure. What varies
 * between these problems is *when* a node does its work relative to its
 * children — before them (pre-order), between them (in-order), or after them
 * (post-order) — and what information travels down the tree versus back up it.
 *
 * Fill in the bodies; run `npx jest problems/leetcode/dfs_trees`.
 */

/**
 * 1. In-order Traversal
 *
 * Return every value, visiting the left subtree, then the node itself, then
 * the right subtree.
 *
 *   buildTree([1, null, 2, 3]) -> [1, 3, 2]
 *   buildTree([])              -> []
 *
 * Constraints: 0 <= node count <= 100.
 */
export function inorderTraversal(root: TreeNode | null): number[] {
  throw new Error("Not implemented");
}

/**
 * 2. Maximum Depth
 *
 * Return the number of nodes on the longest path from the root down to a leaf.
 * An empty tree has depth 0.
 *
 * Compare this with `minDepth` in bfs_trees.ts: the maximum has to inspect
 * every node, so the early exit BFS bought you there is worth nothing here.
 *
 *   buildTree([3, 9, 20, null, null, 15, 7]) -> 3
 *   buildTree([1, null, 2])                  -> 2
 *
 * Constraints: 0 <= node count <= 10^4.
 */
export function maxDepth(root: TreeNode | null): number {
  throw new Error("Not implemented");
}

/**
 * 3. Path Sum
 *
 * Return true if some root-to-leaf path has values summing to exactly
 * `targetSum`. A leaf is a node with no children — a path that stops partway
 * down does not count, even if it hits the target.
 *
 * Values may be negative, so you cannot prune a branch just because the
 * running total has already passed the target.
 *
 *   hasPathSum(buildTree([5, 4, 8, 11, null, 13, 4, 7, 2]), 22) -> true
 *   hasPathSum(buildTree([1, 2, 3]), 5)                         -> false
 *   hasPathSum(null, 0)                                         -> false
 *
 * Constraints: 0 <= node count <= 5000.
 */
export function hasPathSum(root: TreeNode | null, targetSum: number): boolean {
  throw new Error("Not implemented");
}

/**
 * 4. Validate Binary Search Tree
 *
 * Return true if the tree is a valid BST: every value in a node's left subtree
 * is strictly less than the node, every value in its right subtree is strictly
 * greater, and both subtrees are themselves valid BSTs.
 *
 * Note that "greater than my parent" is not enough — a node must respect every
 * ancestor it hangs below, not just the nearest one.
 *
 *   buildTree([2, 1, 3])                      -> true
 *   buildTree([5, 1, 4, null, null, 3, 6])    -> false
 *
 * Constraints: 1 <= node count <= 10^4, values are distinct.
 */
export function isValidBST(root: TreeNode | null): boolean {
  throw new Error("Not implemented");
}

/**
 * 5. Diameter of a Binary Tree
 *
 * Return the length of the longest path between any two nodes, measured in
 * edges. The path need not pass through the root.
 *
 * Each node can answer two different questions — "how tall am I?" and "what is
 * the longest path bending at me?" — and only one of those is what your parent
 * needs to hear.
 *
 *   buildTree([1, 2, 3, 4, 5]) -> 3    (4 -> 2 -> 1 -> 3, or 5 -> 2 -> 1 -> 3)
 *   buildTree([1, 2])          -> 1
 *   buildTree([])              -> 0
 *
 * Constraints: 0 <= node count <= 10^4.
 */
export function diameterOfBinaryTree(root: TreeNode | null): number {
  throw new Error("Not implemented");
}

/**
 * 6. Binary Tree Paths
 *
 * Return every root-to-leaf path as a string joined by "->", ordered by a
 * left-first traversal.
 *
 * Whatever you use to remember the path so far has to be correct on the way
 * back up as well as on the way down.
 *
 *   buildTree([1, 2, 3, null, 5]) -> ["1->2->5", "1->3"]
 *   buildTree([1])                -> ["1"]
 *   buildTree([])                 -> []
 *
 * Constraints: 0 <= node count <= 100.
 */
export function binaryTreePaths(root: TreeNode | null): string[] {
  throw new Error("Not implemented");
}
