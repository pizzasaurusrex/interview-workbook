import {
  averageOfLevels,
  deepestLeavesSum,
  findBottomLeftValue,
  isCousins,
  isEvenOddTree,
  levelOrder,
  maxLevelSum,
  minDepth,
  rightSideView,
  widthOfBinaryTree,
  zigzagLevelOrder,
} from "./bfs_trees";
import { buildTree, TreeNode } from "./tree";

describe("1. levelOrder", () => {
  it("groups values by depth", () => {
    expect(levelOrder(buildTree([3, 9, 20, null, null, 15, 7]))).toEqual([[3], [9, 20], [15, 7]]);
  });

  it("handles a single node", () => {
    expect(levelOrder(buildTree([1]))).toEqual([[1]]);
  });

  it("handles an empty tree", () => {
    expect(levelOrder(null)).toEqual([]);
  });

  it("handles a left-leaning chain", () => {
    expect(levelOrder(buildTree([1, 2, null, 3, null, 4]))).toEqual([[1], [2], [3], [4]]);
  });

  it("keeps left-to-right order across separate subtrees", () => {
    expect(levelOrder(buildTree([1, 2, 3, 4, null, null, 5]))).toEqual([[1], [2, 3], [4, 5]]);
  });
});

describe("2. rightSideView", () => {
  it("returns the last node of each level", () => {
    expect(rightSideView(buildTree([1, 2, 3, null, 5, null, 4]))).toEqual([1, 3, 4]);
  });

  it("sees a left child when the right side is missing", () => {
    expect(rightSideView(buildTree([1, 2]))).toEqual([1, 2]);
  });

  it("handles an empty tree", () => {
    expect(rightSideView(null)).toEqual([]);
  });

  it("sees deeper nodes from the left subtree", () => {
    expect(rightSideView(buildTree([1, 2, 3, 4, null, null, null]))).toEqual([1, 3, 4]);
  });
});

describe("3. zigzagLevelOrder", () => {
  it("alternates direction per level", () => {
    expect(zigzagLevelOrder(buildTree([3, 9, 20, null, null, 15, 7]))).toEqual([
      [3],
      [20, 9],
      [15, 7],
    ]);
  });

  it("reverses the fourth level back again", () => {
    expect(zigzagLevelOrder(buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]))).toEqual([
      [1],
      [3, 2],
      [4, 5, 6, 7],
      [11, 10, 9, 8],
    ]);
  });

  it("handles an empty tree", () => {
    expect(zigzagLevelOrder(null)).toEqual([]);
  });
});

describe("4. averageOfLevels", () => {
  it("averages each level", () => {
    const result = averageOfLevels(buildTree([3, 9, 20, null, null, 15, 7]));
    expect(result).toHaveLength(3);
    result.forEach((value, i) => {
      expect(value).toBeCloseTo([3, 14.5, 11][i], 5);
    });
  });

  it("handles negative values", () => {
    const result = averageOfLevels(buildTree([1, -5, 5]));
    expect(result).toHaveLength(2);
    expect(result[0]).toBeCloseTo(1, 5);
    expect(result[1]).toBeCloseTo(0, 5);
  });

  it("handles an empty tree", () => {
    expect(averageOfLevels(null)).toEqual([]);
  });

  it("does not overflow on large values", () => {
    const big = 2 ** 31 - 1;
    const result = averageOfLevels(buildTree([big, big, big]));
    expect(result[1]).toBeCloseTo(big, 5);
  });
});

describe("5. minDepth", () => {
  it("stops at the shallowest leaf", () => {
    expect(minDepth(buildTree([3, 9, 20, null, null, 15, 7]))).toBe(2);
  });

  it("does not treat a one-child node as a leaf", () => {
    expect(minDepth(buildTree([2, null, 3, null, 4]))).toBe(3);
  });

  it("handles an empty tree", () => {
    expect(minDepth(null)).toBe(0);
  });

  it("handles a single node", () => {
    expect(minDepth(buildTree([1]))).toBe(1);
  });

  it("finds a shallow leaf buried in a deep tree", () => {
    // Left subtree is a long chain; the right side bottoms out at depth 3.
    let deep: TreeNode | null = null;
    for (let i = 0; i < 50; i++) {
      deep = new TreeNode(i, deep, null);
    }
    const root = new TreeNode(0, deep, new TreeNode(1, new TreeNode(2), null));
    expect(minDepth(root)).toBe(3);
  });
});

describe("6. maxLevelSum", () => {
  it("returns the 1-indexed level with the largest sum", () => {
    expect(maxLevelSum(buildTree([1, 7, 0, 7, -8]))).toBe(2);
  });

  it("prefers the shallowest level on a tie", () => {
    expect(maxLevelSum(buildTree([2, 1, 1]))).toBe(1);
  });

  it("handles all-negative trees", () => {
    expect(maxLevelSum(buildTree([-100, -200, -300]))).toBe(1);
  });

  it("handles an empty tree", () => {
    expect(maxLevelSum(null)).toBe(0);
  });

  it("finds a deep winning level", () => {
    expect(maxLevelSum(buildTree([1, 2, 3, 4, 5, 6, 7]))).toBe(3);
  });
});

describe("7. findBottomLeftValue", () => {
  it("returns the only leaf of a three-node tree", () => {
    expect(findBottomLeftValue(buildTree([2, 1, 3]))).toBe(1);
  });

  it("reaches across to the right subtree for the deepest level", () => {
    expect(findBottomLeftValue(buildTree([1, 2, 3, 4, null, 5, 6, null, null, 7]))).toBe(7);
  });

  it("handles a single node", () => {
    expect(findBottomLeftValue(buildTree([1]))).toBe(1);
  });

  it("handles an empty tree", () => {
    expect(findBottomLeftValue(null)).toBe(0);
  });

  it("prefers the leftmost node of the deepest level, not the shallowest leaf", () => {
    expect(findBottomLeftValue(buildTree([1, 2, 3, null, null, 4, 5]))).toBe(4);
  });
});

describe("8. deepestLeavesSum", () => {
  it("sums only the deepest level", () => {
    expect(
      deepestLeavesSum(buildTree([1, 2, 3, 4, 5, null, 6, 7, null, null, null, null, 8])),
    ).toBe(15);
  });

  it("handles a single node", () => {
    expect(deepestLeavesSum(buildTree([1]))).toBe(1);
  });

  it("handles an empty tree", () => {
    expect(deepestLeavesSum(null)).toBe(0);
  });

  it("ignores shallower leaves", () => {
    expect(deepestLeavesSum(buildTree([1, 2, 3, null, null, 4, 5]))).toBe(9);
  });

  it("sums a full bottom row", () => {
    expect(deepestLeavesSum(buildTree([1, 2, 3, 4, 5, 6, 7]))).toBe(22);
  });
});

describe("9. isCousins", () => {
  it("rejects nodes on different levels", () => {
    expect(isCousins(buildTree([1, 2, 3, 4]), 4, 3)).toBe(false);
  });

  it("accepts same level, different parents", () => {
    expect(isCousins(buildTree([1, 2, 3, null, 4, null, 5]), 4, 5)).toBe(true);
  });

  it("rejects siblings", () => {
    expect(isCousins(buildTree([1, 2, 3, null, 4]), 2, 3)).toBe(false);
  });

  it("rejects siblings found deeper in the tree", () => {
    expect(isCousins(buildTree([1, 2, 3, 4, 5, 6, 7]), 4, 5)).toBe(false);
  });

  it("accepts cousins found deeper in the tree", () => {
    expect(isCousins(buildTree([1, 2, 3, 4, 5, 6, 7]), 5, 6)).toBe(true);
  });

  it("is order independent", () => {
    expect(isCousins(buildTree([1, 2, 3, null, 4, null, 5]), 5, 4)).toBe(true);
  });
});

describe.only("10. widthOfBinaryTree", () => {
  it("counts the null gaps inside a level", () => {
    expect(widthOfBinaryTree(buildTree([1, 3, 2, 5, 3, null, 9]))).toBe(4);
  });

  it("measures a level whose ends are far apart", () => {
    expect(widthOfBinaryTree(buildTree([1, 3, 2, 5, null, null, 9, 6, null, 7]))).toBe(7);
  });

  it("ignores missing subtrees outside the end nodes", () => {
    expect(widthOfBinaryTree(buildTree([1, 3, null, 5, 3]))).toBe(2);
  });

  it("handles a single node", () => {
    expect(widthOfBinaryTree(buildTree([1]))).toBe(1);
  });

  it("handles an empty tree", () => {
    expect(widthOfBinaryTree(null)).toBe(0);
  });

  it("stays exact on a deep skewed tree", () => {
    // Indices double every level, so a naive 2i/2i+1 without rebasing loses
    // precision long before the 60th level.
    let node = new TreeNode(0);
    for (let i = 0; i < 60; i++) {
      node = new TreeNode(i, null, node);
    }
    expect(widthOfBinaryTree(node)).toBe(1);
  });
});

describe("11. isEvenOddTree", () => {
  it("accepts a tree that satisfies both rules", () => {
    expect(isEvenOddTree(buildTree([1, 10, 4, 3, null, 7, 9, 12, 8, 6, null, null, 2]))).toBe(true);
  });

  it("rejects a level that is not strictly increasing", () => {
    expect(isEvenOddTree(buildTree([5, 4, 2, 3, 3, 7]))).toBe(false);
  });

  it("rejects an odd value on an odd level", () => {
    expect(isEvenOddTree(buildTree([1, 2, 3]))).toBe(false);
  });

  it("rejects an even value at the root", () => {
    expect(isEvenOddTree(buildTree([2]))).toBe(false);
  });

  it("accepts a single odd root", () => {
    expect(isEvenOddTree(buildTree([1]))).toBe(true);
  });

  it("rejects an odd level that increases instead of decreases", () => {
    expect(isEvenOddTree(buildTree([1, 2, 4]))).toBe(false);
  });

  it("handles an empty tree", () => {
    expect(isEvenOddTree(null)).toBe(true);
  });
});
