import { evalPolynomial, FullNumericalSolution } from './numericalMethods';

/** Critical points split a polynomial into monotone intervals. Root isolation on
 * those intervals also finds repeated roots at a critical point. */
function rootsInInterval(coeffs: number[], a: number, b: number): number[] {
  const c = [...coeffs];
  while (c.length > 1 && c.at(-1) === 0) c.pop();
  if (c.length < 2) return [];
  if (c.length === 2) {
    const x = -c[0] / c[1];
    return x >= a && x <= b ? [x] : [];
  }
  const critical = rootsInInterval(c.slice(1).map((v, i) => v * (i + 1)), a, b);
  const edges = [a, ...critical, b].sort((x, y) => x - y);
  const closeToZero = (x: number) => {
    const magnitude = c.reduce((sum, v, i) => sum + Math.abs(v) * Math.abs(x) ** i, 0);
    return Math.abs(evalPolynomial(c, x)) <= Number.EPSILON * 64 * Math.max(1, magnitude);
  };
  const roots = edges.filter(closeToZero);
  for (let i = 0; i < edges.length - 1; i++) {
    let lo = edges[i], hi = edges[i + 1], flo = evalPolynomial(c, lo);
    const fhi = evalPolynomial(c, hi);
    if (Math.sign(flo) === Math.sign(fhi) || flo === 0 || fhi === 0) continue;
    for (let n = 0; n < 64; n++) {
      const mid = lo + (hi - lo) / 2;
      if (mid === lo || mid === hi) break;
      const fm = evalPolynomial(c, mid);
      if (fm === 0) { lo = hi = mid; break; }
      if (Math.sign(fm) === Math.sign(flo)) { lo = mid; flo = fm; } else hi = mid;
    }
    roots.push(lo + (hi - lo) / 2);
  }
  return roots;
}

export type FlowAssessment = {
  state: 'invalid' | 'consistent' | 'extrapolated' | 'nonphysical';
  label: string;
  reasons: string[];
  queryExtrapolated: boolean;
  queryNegative: boolean;
};

export function assessFlow(s: FullNumericalSolution): FlowAssessment {
  if (!s.isValid) return { state: 'invalid', label: 'Revisa los datos', reasons: [s.errorMessage || 'Entradas inválidas.'], queryExtrapolated: false, queryNegative: false };
  const first = s.points[0].x, last = s.points.at(-1)!.x;
  const derivative = s.polyCoeffs.slice(1).map((v, i) => v * (i + 1));
  const positions = [s.a, s.b, ...rootsInInterval(derivative, s.a, s.b)];
  const minimum = Math.min(...positions.map(s.evaluateP));
  const tolerance = 1e-9 * Math.max(1, ...s.points.map(p => Math.abs(p.y)));
  const negativeDepth = minimum < -tolerance;
  const negativeArea = s.rombergFinalValue < -tolerance;
  const negative = negativeDepth || negativeArea;
  const outside = s.a < first || s.b > last;
  const reasons: string[] = [];
  if (negativeDepth) reasons.push('El perfil tiene profundidades negativas en el intervalo integrado.');
  if (negativeArea) reasons.push('El área calculada es negativa.');
  if (outside) reasons.push('Parte del área se calcula fuera del intervalo medido.');
  return {
    state: negative ? 'nonphysical' : outside ? 'extrapolated' : 'consistent',
    label: negative ? 'Sin interpretación física' : outside ? 'Revisar extrapolación' : 'Sin alertas del modelo',
    reasons,
    queryExtrapolated: s.targetX < first || s.targetX > last,
    queryNegative: s.targetY < -tolerance,
  };
}

export function convergenceLevels(s: FullNumericalSolution) {
  if (!s.isValid) return [];
  // With N=2^k the best available estimate is A_{k,0}, not column A0.
  return s.trapezoidalLevels.map((trap, k) => {
    const cell = s.rombergColumns[k][0];
    return { k, N: trap.N, h: trap.h, trapezoidal: trap.areaValue, romberg: cell.value, error: Math.abs(cell.value - s.exactIntegralValue), cellId: cell.id };
  });
}

/** Keep very small nonzero errors visible instead of rounding them to zero. */
export function preciseLatex(value: number): string {
  if (value === 0) return '0';
  if (Math.abs(value) < 0.0001 || Math.abs(value) >= 1e7) {
    const [mantissa, exponent] = value.toExponential(2).split('e');
    return `${Number(mantissa)}\\times10^{${Number(exponent)}}`;
  }
  return String(Number(value.toFixed(6)));
}
