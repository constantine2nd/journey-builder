import { prerequisitesOf, type GraphIndex } from "./graphIndex";

/**
 * Dependency traversal over the DAG. Edges point from prerequisite to
 * dependant, so "what does D depend on" walks prerequisites upstream.
 *
 * - direct: one edge away (Form D → Form B)
 * - ancestors: everything reachable upstream, nearest first (D → B, A)
 * - transitive: ancestors that are not direct (D → A)
 *
 * All nodes take part in a walk, whatever their type (decision D8), and a
 * visited set makes the walk safe on a diamond or even a cycle.
 */

export function directDependencyIds(index: GraphIndex, nodeId: string): string[] {
  return prerequisitesOf(index, nodeId);
}

/** Breadth-first, so nearer forms come before farther ones; each id once; never the node itself. */
export function ancestorIds(index: GraphIndex, nodeId: string): string[] {
  const visited = new Set<string>([nodeId]);
  const order: string[] = [];
  const queue = [nodeId];

  // The queue grows while it is walked; `order` is the queue minus the start.
  for (const current of queue) {
    for (const prerequisite of prerequisitesOf(index, current)) {
      if (visited.has(prerequisite)) continue;
      visited.add(prerequisite);
      order.push(prerequisite);
      queue.push(prerequisite);
    }
  }

  return order;
}

/** Ancestors minus direct dependencies. A node reachable both ways counts as direct. */
export function transitiveDependencyIds(index: GraphIndex, nodeId: string): string[] {
  const direct = new Set(directDependencyIds(index, nodeId));
  return ancestorIds(index, nodeId).filter((id) => !direct.has(id));
}
