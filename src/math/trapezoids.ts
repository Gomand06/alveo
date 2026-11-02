import { FullNumericalSolution } from './numericalMethods';

export function trapezoidContributions(s: FullNumericalSolution, level: number) {
  if (!s.isValid) return [];
  const partition = s.trapezoidalLevels[Math.max(0, Math.min(level, s.levels - 1))];
  return partition.nodes.slice(0, -1).map((left, i) => {
    const right = partition.nodes[i + 1];
    const width = right.xi - left.xi;
    return { i, leftX: left.xi, rightX: right.xi, leftHeight: left.fxi, rightHeight: right.fxi, width, area: width * (left.fxi + right.fxi) / 2 };
  });
}
