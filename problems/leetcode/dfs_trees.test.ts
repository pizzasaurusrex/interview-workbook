import {
  binaryTreePaths,
  diameterOfBinaryTree,
  hasPathSum,
  inorderTraversal,
  isValidBST,
  maxDepth,
} from "./dfs_trees";
import { buildTree, TreeNode } from "./tree";

describe("1. inorderTraversal", () => {
  it("visits left, node, right", () => {
    expect(inorderTraversal(buildTree([1, null, 2, 3]))).toEqual([1, 3, 2]);
  });

  it("returns a BST in sorted order", () => {
    expect(inorderTraversal(buildTree([4, 2, 6, 1, 3, 5, 7]))).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("handles a single node", () => {
    expect(inorderTraversal(buildTree([1]))).toEqual([1]);
  });

  it("handles an empty tree", () => {
    expect(inorderTraversal(null)).toEqual([]);
  });

  it("handles a left-leaning chain", () => {
    expect(inorderTraversal(buildTree([3, 2, null, 1]))).toEqual([1, 2, 3]);
  });
});

describe("2. maxDepth", () => {
  it("measures the longest root-to-leaf path", () => {
    expect(maxDepth(buildTree([3, 9, 20, null, null, 15, 7]))).toBe(3);
  });

  it("counts a one-sided chain", () => {
    expect(maxDepth(buildTree([1, null, 2]))).toBe(2);
  });

  it("handles a single node", () => {
    expect(maxDepth(buildTree([1]))).toBe(1);
  });

  it("handles an empty tree", () => {
    expect(maxDepth(null)).toBe(0);
  });

  it("takes the deeper side, not the shallower one", () => {
    // Right side bottoms out at depth 2; the left chain runs to depth 4.
    expect(maxDepth(buildTree([1, 2, 3, 4, null, null, null, 5]))).toBe(4);
  });
});

describe("3. hasPathSum", () => {
  it("finds a matching root-to-leaf path", () => {
    expect(hasPathSum(buildTree([5, 4, 8, 11, null, 13, 4, 7, 2]), 22)).toBe(true);
  });

  it("returns false when no path matches", () => {
    expect(hasPathSum(buildTree([1, 2, 3]), 5)).toBe(false);
  });

  it("rejects a sum that only matches partway down", () => {
    // 1 hits the target, but 1 is not a leaf.
    expect(hasPathSum(buildTree([1, 2]), 1)).toBe(false);
  });

  it("handles an empty tree", () => {
    expect(hasPathSum(null, 0)).toBe(false);
  });

  it("handles negative values that dip below the target and recover", () => {
    expect(hasPathSum(buildTree([1, -2, 3, 4]), 3)).toBe(true);
  });

  it("matches a single node", () => {
    expect(hasPathSum(buildTree([7]), 7)).toBe(true);
  });
});

describe("4. isValidBST", () => {
  it("accepts a valid tree", () => {
    expect(isValidBST(buildTree([2, 1, 3]))).toBe(true);
  });

  it("rejects a right child smaller than the root", () => {
    expect(isValidBST(buildTree([5, 1, 4, null, null, 3, 6]))).toBe(false);
  });

  it("rejects a node that beats its parent but not its grandparent", () => {
    // 6 is less than its parent 15, but it hangs in 10's RIGHT subtree,
    // so it must also exceed 10.
    expect(isValidBST(buildTree([10, 5, 15, null, null, 6, 20]))).toBe(false);
  });

  it("accepts a single node", () => {
    expect(isValidBST(buildTree([1]))).toBe(true);
  });

  it("accepts a valid left-leaning chain", () => {
    expect(isValidBST(buildTree([5, 4, null, 3, null, 2]))).toBe(true);
  });

  it("handles values at the extremes", () => {
    const min = Number.MIN_SAFE_INTEGER;
    expect(isValidBST(buildTree([min, null, min + 1]))).toBe(true);
  });
});

describe("5. diameterOfBinaryTree", () => {
  it("measures a path bending at the root", () => {
    expect(diameterOfBinaryTree(buildTree([1, 2, 3, 4, 5]))).toBe(3);
  });

  it("measures a path that does not touch the root", () => {
    // Root has one child; the whole balanced tree hangs below it, so the
    // longest path (6 -> 4 -> 2 -> 5 -> 8) stays inside that subtree.
    expect(diameterOfBinaryTree(buildTree([1, 2, null, 4, 5, 6, 7, 8, 9]))).toBe(4);
  });

  it("counts edges, not nodes", () => {
    expect(diameterOfBinaryTree(buildTree([1, 2]))).toBe(1);
  });

  it("returns 0 for a single node", () => {
    expect(diameterOfBinaryTree(buildTree([1]))).toBe(0);
  });

  it("handles an empty tree", () => {
    expect(diameterOfBinaryTree(null)).toBe(0);
  });

  it("handles a straight chain", () => {
    let node: TreeNode | null = null;
    for (let i = 0; i < 10; i++) {
      node = new TreeNode(i, node, null);
    }
    expect(diameterOfBinaryTree(node)).toBe(9);
  });
});

describe("6. binaryTreePaths", () => {
  it("returns each root-to-leaf path", () => {
    expect(binaryTreePaths(buildTree([1, 2, 3, null, 5]))).toEqual(["1->2->5", "1->3"]);
  });

  it("returns a single node as one path", () => {
    expect(binaryTreePaths(buildTree([1]))).toEqual(["1"]);
  });

  it("handles an empty tree", () => {
    expect(binaryTreePaths(null)).toEqual([]);
  });

  it("does not leak one branch's nodes into the next", () => {
    // If the path is not unwound on the way back up, 4 and 5 bleed into
    // the sibling paths.
    expect(binaryTreePaths(buildTree([1, 2, 3, 4, 5, 6, 7]))).toEqual([
      "1->2->4",
      "1->2->5",
      "1->3->6",
      "1->3->7",
    ]);
  });

  it("handles negative values", () => {
    expect(binaryTreePaths(buildTree([1, -2, -3]))).toEqual(["1->-2", "1->-3"]);
  });
});
