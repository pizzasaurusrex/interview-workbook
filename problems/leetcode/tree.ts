/**
 * Shared binary tree types and helpers for the LeetCode-style problems.
 * Nothing here needs to change — implement the problem files instead.
 */

export class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;

  constructor(val: number, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

/**
 * Builds a tree from LeetCode's level-order array form, where `null` marks a
 * missing child. Example: [3, 9, 20, null, null, 15, 7]
 *
 *       3
 *      / \
 *     9  20
 *       /  \
 *      15   7
 */
export function buildTree(values: ReadonlyArray<number | null>): TreeNode | null {
  if (values.length === 0 || values[0] === null) {
    return null;
  }

  const root = new TreeNode(values[0] as number);
  const queue: TreeNode[] = [root];
  let i = 1;

  while (queue.length > 0 && i < values.length) {
    const node = queue.shift() as TreeNode;

    const leftVal = values[i++];
    if (leftVal !== null && leftVal !== undefined) {
      node.left = new TreeNode(leftVal);
      queue.push(node.left);
    }

    const rightVal = values[i++];
    if (rightVal !== null && rightVal !== undefined) {
      node.right = new TreeNode(rightVal);
      queue.push(node.right);
    }
  }

  return root;
}
