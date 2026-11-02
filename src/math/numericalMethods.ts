export interface CoordinatePoint {
  id: string;
  x: number;
  y: number;
}

export interface LagrangeTermStep {
  i: number;
  xi: number;
  yi: number;
  numeratorSymbolicLatex: string;
  denominatorSymbolicLatex: string;
  denominatorFactorsLatex: string;
  denominatorValue: number;
  scalarWeight: number; // yi / denominatorValue
  basisCoeffs: number[]; // coefficients of prod_{j != i} (x - xj), index = power of x
  weightedCoeffs: number[]; // coefficients of yi * L_i(x)
  basisExpandedLatex: string;
  weightedPolyLatex: string;
  termSymbolicFractionLatex: string;
  termDataFractionLatex: string;
  // Evaluation at x = targetX
  evalNumeratorFactorsLatex: string;
  evalNumeratorValue: number;
  LiAtTarget: number;
  termAtTarget: number;
  evalFractionDataLatex: string;
}

export interface TrapezoidalNodeRow {
  i: number;
  xi: number;
  fxi: number;
  weight: number; // 1 at endpoints, 2 at interior
  weightedFxi: number;
}

export interface TrapezoidalLevelDetail {
  k: number; // 0, 1, 2, ...
  N: number; // 2^k subdivisions
  h: number; // (b - a) / N
  hFractionLatex: string;
  nodes: TrapezoidalNodeRow[];
  fStart: number;
  fEnd: number;
  interiorSum: number;
  bracketSum: number;
  areaValue: number; // A_{0, k}
  formulaLatex: string;
  substitutionLatex: string;
  resultLatex: string;
}

export interface RombergCellDetail {
  id: string;
  colIndex: number; // m: 0 for A0, 1 for A1, 2 for A2, ...
  rowIndex: number; // k: 0, 1, ..., levels - 1 - m
  label: string; // e.g. "A_{0,1}" or "A_{1,1}"
  colName: string; // "A_0", "A_1", "A_2", ...
  methodType: 'trapezoidal' | 'romberg';
  N: number; // subdivisions associated with this row
  h: number; // step h associated with this row
  value: number;
  errorPercent: number;
  // Parent cell references for Romberg m >= 1
  upperParentId?: string;
  lowerParentId?: string;
  upperParentLabel?: string;
  lowerParentLabel?: string;
  upperParentValue?: number; // I_menor (less accurate, larger h)
  lowerParentValue?: number; // I_mayor (more accurate, smaller h)
  powerOfFour?: number; // 4^m
  denominator?: number; // 4^m - 1
  // Popup View 1: Formula Used (LaTeX)
  popupFormulaTitle: string;
  popupFormulaLatex: string;
  popupFormulaEquivalentLatex?: string;
  popupFormulaExplanationLatex: string;
  // Popup View 2: Data Substitution & Result (LaTeX)
  popupDataTitle: string;
  popupDataGivenLatex: string;
  popupDataSubstitutionLatex: string;
  popupDataEquivalentSubLatex?: string;
  popupResultLatex: string;
}

export interface FullNumericalSolution {
  isValid: boolean;
  errorMessage?: string;
  points: CoordinatePoint[];
  degree: number;
  targetX: number;
  targetY: number;
  a: number;
  b: number;
  levels: number;
  velocity: number; // m/s river velocity
  // Lagrange outputs
  polyCoeffs: number[]; // index = power of x: a_0 + a_1 x + ... + a_n x^n
  lagrangeTerms: LagrangeTermStep[];
  lagrangeStep1TableLatex: string;
  lagrangeStep2ObjectiveLatex: string;
  lagrangeStep3FormulaCompactLatex: string;
  lagrangeStep3FormulaExpandedLatex: string;
  lagrangeStep4SymbolicDataLatex: string;
  lagrangeStep4StandardPolyLatex: string;
  lagrangeStep4EvalDataLatex: string;
  lagrangeStep4EvalSumLatex: string;
  // Romberg & Integral outputs
  integralProblemLatex: string;
  antiderivativeLatex: string;
  exactEvaluationLatex: string;
  exactIntegralValue: number;
  rombergFinalValue: number;
  dischargeQ: number; // Q = Area * velocity
  absoluteError: number;
  relativeErrorPercent: number;
  trapezoidalLevels: TrapezoidalLevelDetail[];
  rombergColumns: RombergCellDetail[][]; // indexed by col m, then row k
  evaluateP: (x: number) => number;
}

/**
 * Formats a number cleanly for LaTeX output.
 */
export function fmt(val: number, maxDecimals = 6): string {
  if (!Number.isFinite(val)) return '0';
  if (Math.abs(val) < 1e-12) return '0';
  const rounded = Number(val.toFixed(maxDecimals));
  return rounded.toString();
}

/**
 * Formats a number wrapping negative numbers in parentheses for clean LaTeX subtraction/multiplication.
 */
export function fmtParen(val: number, maxDecimals = 6): string {
  const s = fmt(val, maxDecimals);
  return val < -1e-12 ? `(${s})` : s;
}

/**
 * Formats a subtraction (a - b) in LaTeX so negative b shows as (a - (-b)).
 */
export function fmtSub(aStr: string, bVal: number, maxDecimals = 6): string {
  if (Math.abs(bVal) < 1e-12) return `(${aStr} - 0)`;
  if (bVal < 0) {
    return `(${aStr} - (${fmt(bVal, maxDecimals)}))`;
  }
  return `(${aStr} - ${fmt(bVal, maxDecimals)})`;
}

/**
 * Multiply two polynomials represented in ascending powers: [c0, c1, c2, ...]
 */
function multiplyPoly(p1: number[], p2: number[]): number[] {
  const res = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      res[i + j] += p1[i] * p2[j];
    }
  }
  return res;
}

/**
 * Formats a polynomial [c0, c1, ..., cn] into standard descending LaTeX: a_n x^n + ... + a_1 x + a_0
 */
export function formatPolynomialLatex(coeffs: number[], maxDecimals = 6): string {
  const n = coeffs.length - 1;
  const parts: string[] = [];

  for (let p = n; p >= 0; p--) {
    const c = coeffs[p];
    if (Math.abs(c) < 1e-10) continue;

    const isFirst = parts.length === 0;
    const absC = Math.abs(c);
    const sign = c < 0 ? (isFirst ? '-' : ' - ') : isFirst ? '' : ' + ';

    let coeffStr = fmt(absC, maxDecimals);
    if (p > 0 && Math.abs(absC - 1) < 1e-10) {
      coeffStr = '';
    }

    let xPart = '';
    if (p === 1) xPart = 'x';
    else if (p > 1) xPart = `x^{${p}}`;

    parts.push(`${sign}${coeffStr}${xPart}`);
  }

  return parts.length > 0 ? parts.join('') : '0';
}

/**
 * Evaluates polynomial [c0, c1, ..., cn] at x using Horner's method.
 */
export function evalPolynomial(coeffs: number[], x: number): number {
  let acc = 0;
  for (let p = coeffs.length - 1; p >= 0; p--) {
    acc = acc * x + coeffs[p];
  }
  return acc;
}

/**
 * Main solver for Lagrange Interpolation + Romberg Integration
 */
export function solveLagrangeAndRomberg(
  rawPoints: CoordinatePoint[],
  targetX: number,
  aInput: number,
  bInput: number,
  levelsInput: number,
  velocityInput: number
): FullNumericalSolution {
  // Validate minimum points
  if (!rawPoints || rawPoints.length < 2) {
    return createInvalidResult('Se requieren al menos 2 coordenadas (xᵢ, yᵢ) para interpolar.');
  }

  if (rawPoints.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) {
    return createInvalidResult('Completa la posición y la profundidad de cada punto con números finitos.');
  }
  if (rawPoints.some(p => p.y < 0)) {
    return createInvalidResult('La profundidad medida debe ser mayor o igual a cero.');
  }
  if (![targetX, aInput, bInput, velocityInput, levelsInput].every(Number.isFinite)) {
    return createInvalidResult('Completa la posición consultada, los límites, la velocidad y los niveles con números finitos.');
  }
  if (aInput >= bInput) {
    return createInvalidResult('El límite inferior a debe ser menor que el límite superior b.');
  }
  if (velocityInput < 0) {
    return createInvalidResult('La velocidad media debe ser mayor o igual a cero.');
  }

  // Sort points by x ascending for clean hydrological profile
  const points = [...rawPoints].sort((p1, p2) => p1.x - p2.x);

  // Check for duplicate x coordinates
  for (let i = 0; i < points.length - 1; i++) {
    if (Math.abs(points[i + 1].x - points[i].x) < 1e-9) {
      return createInvalidResult(
        `Las coordenadas x deben ser distintas. Se encontró x duplicado: x = ${points[i].x}.`
      );
    }
  }

  const mCount = points.length;
  const n = mCount - 1; // polynomial degree
  const levels = Math.max(2, Math.min(7, Math.round(levelsInput || 4)));
  const a = Number.isFinite(aInput) ? aInput : points[0].x;
  const b = Number.isFinite(bInput) ? bInput : points[n].x;
  const velocity = Number.isFinite(velocityInput) ? velocityInput : 1.5;

  // -------------------------------------------------------------------------
  // 1. LAGRANGE INTERPOLATION COMPUTATION & STEP-BY-STEP LATEX
  // -------------------------------------------------------------------------
  const polyCoeffs = new Array(mCount).fill(0);
  const lagrangeTerms: LagrangeTermStep[] = [];

  for (let i = 0; i <= n; i++) {
    const xi = points[i].x;
    const yi = points[i].y;

    let basisCoeffs = [1]; // starts as constant 1
    let denomVal = 1;
    let evalNumVal = 1;

    const numSymbolicParts: string[] = [];
    const denSymbolicParts: string[] = [];
    const denFactorParts: string[] = [];
    const evalNumFactorParts: string[] = [];
    const numIndexSymbolicParts: string[] = [];
    const denIndexSymbolicParts: string[] = [];

    for (let j = 0; j <= n; j++) {
      if (j === i) continue;
      const xj = points[j].x;

      // Multiply basis polynomial by (x - xj) = [-xj, 1]
      basisCoeffs = multiplyPoly(basisCoeffs, [-xj, 1]);

      const diff = xi - xj;
      denomVal *= diff;

      const evalDiff = targetX - xj;
      evalNumVal *= evalDiff;

      numIndexSymbolicParts.push(`(x - x_{${j}})`);
      denIndexSymbolicParts.push(`(x_{${i}} - x_{${j}})`);

      numSymbolicParts.push(fmtSub('x', xj, 4));
      denSymbolicParts.push(fmtSub(fmt(xi, 4), xj, 4));
      denFactorParts.push(`(${fmt(diff, 4)})`);
      evalNumFactorParts.push(fmtSub(fmt(targetX, 4), xj, 4));
    }

    const scalarWeight = yi / denomVal;
    const weightedCoeffs = basisCoeffs.map((c) => c * scalarWeight);

    for (let p = 0; p <= n; p++) {
      polyCoeffs[p] += weightedCoeffs[p];
    }

    const LiAtTarget = evalNumVal / denomVal;
    const termAtTarget = yi * LiAtTarget;

    const numeratorSymbolicLatex = numSymbolicParts.join('');
    const denominatorSymbolicLatex = denSymbolicParts.join('');
    const denominatorFactorsLatex = denFactorParts.join('');
    const evalNumeratorFactorsLatex = evalNumFactorParts.join('');

    const termSymbolicFractionLatex = `\\frac{${numIndexSymbolicParts.join('')}}{${denIndexSymbolicParts.join('')}} y_{${i}}`;
    const termDataFractionLatex = `\\frac{${numeratorSymbolicLatex}}{${denominatorSymbolicLatex}} \\cdot ${fmtParen(yi, 4)}`;
    const evalFractionDataLatex = `\\frac{${evalNumeratorFactorsLatex}}{${denominatorSymbolicLatex}} \\cdot ${fmtParen(yi, 4)}`;

    lagrangeTerms.push({
      i,
      xi,
      yi,
      numeratorSymbolicLatex,
      denominatorSymbolicLatex,
      denominatorFactorsLatex,
      denominatorValue: denomVal,
      scalarWeight,
      basisCoeffs,
      weightedCoeffs,
      basisExpandedLatex: formatPolynomialLatex(basisCoeffs, 5),
      weightedPolyLatex: formatPolynomialLatex(weightedCoeffs, 6),
      termSymbolicFractionLatex,
      termDataFractionLatex,
      evalNumeratorFactorsLatex,
      evalNumeratorValue: evalNumVal,
      LiAtTarget,
      termAtTarget,
      evalFractionDataLatex,
    });
  }

  const targetY = lagrangeTerms.reduce((acc, t) => acc + t.termAtTarget, 0);

  // Step 1: Coordinate Table in pure LaTeX
  const tableRowsLatex = points
    .map((pt, idx) => `${idx} & ${fmt(pt.x, 4)} & ${fmt(pt.y, 4)} \\\\ \\hline`)
    .join(' ');
  const lagrangeStep1TableLatex = `\\begin{array}{|c|c|c|} \\hline \\mathbf{i} & \\mathbf{x_i \\text{ (m)}} & \\mathbf{y_i = f(x_i) \\text{ (m)}} \\\\ \\hline ${tableRowsLatex} \\end{array}`;

  // Step 2: What we are looking for (Lo que buscamos)
  const lagrangeStep2ObjectiveLatex = `\\begin{aligned}
&\\text{1. Polinomio Interpolador de Lagrange de grado } n = ${n}: \\quad P_{${n}}(x) \\text{ que modela el cauce del río.} \\\\
&\\text{2. Profundidad interpolada en } x^* = ${fmt(targetX, 4)}\\text{ m}: \\quad P_{${n}}(${fmt(targetX, 4)}) = \\text{?} \\\\
&\\text{3. Área transversal del cauce en } [${fmt(a, 4)}, ${fmt(b, 4)}]: \\quad A = \\int_{${fmt(a, 4)}}^{${fmt(b, 4)}} P_{${n}}(x)\\,dx
\\end{aligned}`;

  // Step 3: General & Multi-point Expanded Formula
  const lagrangeStep3FormulaCompactLatex = `P_{n}(x) = \\sum_{i=0}^{n} y_i \\cdot L_i(x) = \\sum_{i=0}^{${n}} y_i \\prod_{\\substack{j=0 \\\\ j \\neq i}}^{${n}} \\frac{x - x_j}{x_i - x_j}`;

  const lagrangeStep3FormulaExpandedLatex = `P_{${n}}(x) = ${lagrangeTerms
    .map((t) => t.termSymbolicFractionLatex)
    .join(' + ')}`;

  // Step 4: Formula with Data Substituted (Symbolic in x + Evaluated at targetX)
  const lagrangeStep4SymbolicDataLatex = `P_{${n}}(x) = ${lagrangeTerms
    .map((t) => t.termDataFractionLatex)
    .join(' + ')}`;

  const lagrangeStep4StandardPolyLatex = `P_{${n}}(x) = ${formatPolynomialLatex(polyCoeffs, 6)}`;

  const lagrangeStep4EvalDataLatex = `P_{${n}}(${fmt(targetX, 4)}) = ${lagrangeTerms
    .map((t) => t.evalFractionDataLatex)
    .join(' + ')}`;

  const lagrangeStep4EvalSumLatex = `P_{${n}}(${fmt(targetX, 4)}) = ${lagrangeTerms
    .map((t) => fmtParen(t.termAtTarget, 6))
    .join(' + ')} = \\mathbf{${fmt(targetY, 6)}\\text{ m}}`;

  // -------------------------------------------------------------------------
  // 2. EXACT ANALYTICAL INTEGRAL OF P_n(x) ON [a, b]
  // -------------------------------------------------------------------------
  // Antiderivative F(x) = sum_{p=0}^n (a_p / (p + 1)) x^{p + 1}
  const antiderivCoeffs = [0, ...polyCoeffs.map((c, p) => c / (p + 1))];
  const antiderivativeLatex = formatPolynomialLatex(antiderivCoeffs, 6);
  const fbValue = evalPolynomial(antiderivCoeffs, b);
  const faValue = evalPolynomial(antiderivCoeffs, a);
  const exactIntegralValue = fbValue - faValue;

  const polyStr = formatPolynomialLatex(polyCoeffs, 5);
  const integralProblemLatex = `I = \\int_{${fmt(a, 4)}}^{${fmt(b, 4)}} f(x)\\,dx = \\int_{${fmt(a, 4)}}^{${fmt(b, 4)}} \\left( ${polyStr} \\right) dx`;

  const exactEvaluationLatex = `I_{\\mathrm{ref}} = \\left[ ${antiderivativeLatex} \\right]_{${fmt(a, 4)}}^{${fmt(b, 4)}} = F(${fmt(b, 4)}) - F(${fmt(a, 4)}) = ${fmt(fbValue, 6)} - ${fmtParen(faValue, 6)} = \\mathbf{${fmt(exactIntegralValue, 6)}\\text{ m}^2}`;

  // -------------------------------------------------------------------------
  // 3. TRAPEZOIDAL RULE LEVELS & ROMBERG INTEGRATION TABLE
  // -------------------------------------------------------------------------
  const evaluateP = (x: number) => evalPolynomial(polyCoeffs, x);

  const trapezoidalLevels: TrapezoidalLevelDetail[] = [];

  for (let k = 0; k < levels; k++) {
    const N = Math.pow(2, k);
    const h = (b - a) / N;
    const hFractionLatex = `h_{${k}} = \\frac{b - a}{N} = \\frac{${fmt(b, 4)} - ${fmtParen(a, 4)}}{${N}} = \\frac{${fmt(b - a, 4)}}{${N}} = ${fmt(h, 6)}`;

    const nodes: TrapezoidalNodeRow[] = [];
    let interiorSum = 0;

    for (let i = 0; i <= N; i++) {
      const xi = a + i * h;
      const fxi = evaluateP(xi);
      const isEndpoint = i === 0 || i === N;
      const weight = isEndpoint ? 1 : 2;
      const weightedFxi = weight * fxi;

      if (!isEndpoint) {
        interiorSum += fxi;
      }

      nodes.push({
        i,
        xi,
        fxi,
        weight,
        weightedFxi,
      });
    }

    const fStart = nodes[0].fxi;
    const fEnd = nodes[N].fxi;
    const bracketSum = fStart + 2 * interiorSum + fEnd;
    const areaValue = (h / 2) * bracketSum;

    const formulaLatex =
      N === 1
        ? `A_{0,${k}} = \\frac{h_{${k}}}{2} \\left[ f(x_0) + f(x_1) \\right]`
        : `A_{0,${k}} = \\frac{h_{${k}}}{2} \\left[ f(x_0) + 2\\sum_{i=1}^{${N - 1}} f(x_i) + f(x_{${N}}) \\right]`;

    // Build detailed substitution string showing the values
    let interiorTermsStr = '';
    if (N > 1) {
      const interiorSlice = nodes.slice(1, Math.min(N, 7));
      interiorTermsStr = interiorSlice.map((nd) => fmt(nd.fxi, 4)).join(' + ');
      if (N - 1 > 6) {
        interiorTermsStr += ` + \\dots + ${fmt(nodes[N - 1].fxi, 4)}`;
      }
    }

    const substitutionLatex =
      N === 1
        ? `\\begin{aligned}
A_{0,0} &= \\frac{${fmt(h, 5)}}{2} \\left[ f(${fmt(nodes[0].xi, 4)}) + f(${fmt(nodes[1].xi, 4)}) \\right] \\\\
&= \\frac{${fmt(h, 5)}}{2} \\left[ ${fmt(fStart, 5)} + ${fmtParen(fEnd, 5)} \\right] \\\\
&= ${fmt(h / 2, 5)} \\times \\left( ${fmt(bracketSum, 5)} \\right) = \\mathbf{${fmt(areaValue, 6)}}
\\end{aligned}`
        : `\\begin{aligned}
A_{0,${k}} &= \\frac{${fmt(h, 5)}}{2} \\left[ ${fmt(fStart, 4)} + 2\\left( ${interiorTermsStr} \\right) + ${fmtParen(fEnd, 4)} \\right] \\\\
&= \\frac{${fmt(h, 5)}}{2} \\left[ ${fmt(fStart, 5)} + 2\\left( ${fmt(interiorSum, 5)} \\right) + ${fmtParen(fEnd, 5)} \\right] \\\\
&= ${fmt(h / 2, 5)} \\times \\left( ${fmt(bracketSum, 6)} \\right) = \\mathbf{${fmt(areaValue, 6)}}
\\end{aligned}`;

    const resultLatex = `A_{0,${k}} = ${fmt(areaValue, 6)}\\text{ m}^2`;

    trapezoidalLevels.push({
      k,
      N,
      h,
      hFractionLatex,
      nodes,
      fStart,
      fEnd,
      interiorSum,
      bracketSum,
      areaValue,
      formulaLatex,
      substitutionLatex,
      resultLatex,
    });
  }

  // -------------------------------------------------------------------------
  // 4. BUILD ROMBERG EXTRAPOLATION MATRIX (A_0, A_1, A_2, ...)
  // -------------------------------------------------------------------------
  const rombergColumns: RombergCellDetail[][] = [];

  // Column m = 0 (A_0: Trapezoidal Rule)
  const col0: RombergCellDetail[] = trapezoidalLevels.map((trap) => {
    const errPct =
      Math.abs(exactIntegralValue) > 1e-12
        ? (Math.abs(exactIntegralValue - trap.areaValue) / Math.abs(exactIntegralValue)) * 100
        : 0;

    return {
      id: `A_0_${trap.k}`,
      colIndex: 0,
      rowIndex: trap.k,
      label: `A_{0,${trap.k}}`,
      colName: 'A_0',
      methodType: 'trapezoidal',
      N: trap.N,
      h: trap.h,
      value: trap.areaValue,
      errorPercent: errPct,
      popupFormulaTitle: `Fórmula de la Regla Trapezoidal Compuesta (Columna A₀, Nivel N = ${trap.N})`,
      popupFormulaLatex: trap.formulaLatex,
      popupFormulaEquivalentLatex: `h_{${trap.k}} = \\frac{b - a}{N} = \\frac{${fmt(b, 4)} - ${fmtParen(a, 4)}}{${trap.N}} = ${fmt(trap.h, 6)}`,
      popupFormulaExplanationLatex: `\\text{Para la columna } A_0 \\text{ se utiliza la Regla Trapezoidal con } N = 2^{${trap.k}} = ${trap.N} \\text{ trapecios y paso } h = ${fmt(trap.h, 5)}.`,
      popupDataTitle: `Sustitución de Datos y Resultado para A₀ (Fila ${trap.k + 1}, N = ${trap.N})`,
      popupDataGivenLatex: `a = ${fmt(a, 4)}, \\quad b = ${fmt(b, 4)}, \\quad N = ${trap.N}, \\quad h_{${trap.k}} = ${fmt(trap.h, 6)}`,
      popupDataSubstitutionLatex: trap.substitutionLatex,
      popupResultLatex: `A_{0,${trap.k}} = \\mathbf{${fmt(trap.areaValue, 6)}\\text{ m}^2}`,
    };
  });

  rombergColumns.push(col0);

  // Columns m = 1, 2, ..., levels - 1 (Romberg Extrapolation)
  for (let m = 1; m < levels; m++) {
    const prevCol = rombergColumns[m - 1];
    const currentCol: RombergCellDetail[] = [];
    const powerOfFour = Math.pow(4, m);
    const denominator = powerOfFour - 1;

    for (let k = 0; k < levels - m; k++) {
      const upperParent = prevCol[k]; // I_menor (row k, step h)
      const lowerParent = prevCol[k + 1]; // I_mayor (row k+1, step h/2)

      const val = (powerOfFour * lowerParent.value - upperParent.value) / denominator;
      const errPct =
        Math.abs(exactIntegralValue) > 1e-12
          ? (Math.abs(exactIntegralValue - val) / Math.abs(exactIntegralValue)) * 100
          : 0;

      const label = `A_{${m},${k}}`;
      const prevColName = `A_{${m - 1}}`;

      const popupFormulaLatex = `${label} = \\frac{4^{${m}} \\cdot A_{${m - 1},${k + 1}} - A_{${m - 1},${k}}}{4^{${m}} - 1} = \\frac{${powerOfFour} \\cdot A_{${m - 1},${k + 1}} - A_{${m - 1},${k}}}{${denominator}}`;

      const popupFormulaEquivalentLatex = `${label} = A_{${m - 1},${k + 1}} + \\frac{A_{${m - 1},${k + 1}} - A_{${m - 1},${k}}}{4^{${m}} - 1} = I_{\\text{mayor}} + \\frac{I_{\\text{mayor}} - I_{\\text{menor}}}{${denominator}}`;

      const numProduct = powerOfFour * lowerParent.value;
      const numDiff = numProduct - upperParent.value;
      const simpleDiff = lowerParent.value - upperParent.value;

      const popupDataSubstitutionLatex = `\\begin{aligned}
${label} &= \\frac{${powerOfFour} \\left( ${fmt(lowerParent.value, 6)} \\right) - \\left( ${fmt(upperParent.value, 6)} \\right)}{${powerOfFour} - 1} \\\\
&= \\frac{${fmt(numProduct, 6)} - ${fmtParen(upperParent.value, 6)}}{${denominator}} \\\\
&= \\frac{${fmt(numDiff, 6)}}{${denominator}} = \\mathbf{${fmt(val, 6)}}
\\end{aligned}`;

      const popupDataEquivalentSubLatex = `\\begin{aligned}
${label} &= ${fmt(lowerParent.value, 6)} + \\frac{${fmt(lowerParent.value, 6)} - ${fmtParen(upperParent.value, 6)}}{${denominator}} \\\\
&= ${fmt(lowerParent.value, 6)} + \\frac{${fmt(simpleDiff, 6)}}{${denominator}} = \\mathbf{${fmt(val, 6)}}
\\end{aligned}`;

      currentCol.push({
        id: `A_${m}_${k}`,
        colIndex: m,
        rowIndex: k,
        label,
        colName: `A_${m}`,
        methodType: 'romberg',
        N: lowerParent.N,
        h: lowerParent.h,
        value: val,
        errorPercent: errPct,
        upperParentId: upperParent.id,
        lowerParentId: lowerParent.id,
        upperParentLabel: upperParent.label,
        lowerParentLabel: lowerParent.label,
        upperParentValue: upperParent.value,
        lowerParentValue: lowerParent.value,
        powerOfFour,
        denominator,
        popupFormulaTitle: `Fórmula de Extrapolación de Romberg (Columna A_${m}, Orden m = ${m})`,
        popupFormulaLatex,
        popupFormulaEquivalentLatex,
        popupFormulaExplanationLatex: `\\text{Combina dos estimaciones consecutivas de la columna } ${prevColName} \\text{ con factor de Richardson } 4^{${m}} = ${powerOfFour} \\text{ y divisor } 4^{${m}} - 1 = ${denominator}.`,
        popupDataTitle: `Sustitución de Datos y Resultado para ${label}`,
        popupDataGivenLatex: `I_{\\text{mayor}} = ${lowerParent.label} = ${fmt(lowerParent.value, 6)}, \\quad I_{\\text{menor}} = ${upperParent.label} = ${fmt(upperParent.value, 6)}, \\quad 4^{${m}} - 1 = ${denominator}`,
        popupDataSubstitutionLatex,
        popupDataEquivalentSubLatex,
        popupResultLatex: `${label} = \\mathbf{${fmt(val, 6)}\\text{ m}^2}`,
      });
    }

    rombergColumns.push(currentCol);
  }

  const rombergFinalValue = rombergColumns[levels - 1][0].value;
  const dischargeQ = rombergFinalValue * velocity;
  if (![...polyCoeffs, targetY, exactIntegralValue, rombergFinalValue, dischargeQ, ...trapezoidalLevels.flatMap(t => [t.areaValue, ...t.nodes.map(node => node.fxi)])].every(Number.isFinite)) {
    return createInvalidResult('Estos valores exceden la capacidad numérica del modelo. Reduce las magnitudes o revisa la separación entre posiciones.');
  }
  const absoluteError = Math.abs(exactIntegralValue - rombergFinalValue);
  const relativeErrorPercent =
    Math.abs(exactIntegralValue) > 1e-12
      ? (absoluteError / Math.abs(exactIntegralValue)) * 100
      : 0;

  return {
    isValid: true,
    points,
    degree: n,
    targetX,
    targetY,
    a,
    b,
    levels,
    velocity,
    polyCoeffs,
    lagrangeTerms,
    lagrangeStep1TableLatex,
    lagrangeStep2ObjectiveLatex,
    lagrangeStep3FormulaCompactLatex,
    lagrangeStep3FormulaExpandedLatex,
    lagrangeStep4SymbolicDataLatex,
    lagrangeStep4StandardPolyLatex,
    lagrangeStep4EvalDataLatex,
    lagrangeStep4EvalSumLatex,
    integralProblemLatex,
    antiderivativeLatex,
    exactEvaluationLatex,
    exactIntegralValue,
    rombergFinalValue,
    dischargeQ,
    absoluteError,
    relativeErrorPercent,
    trapezoidalLevels,
    rombergColumns,
    evaluateP,
  };
}

function createInvalidResult(errorMessage: string): FullNumericalSolution {
  return {
    isValid: false,
    errorMessage,
    points: [],
    degree: 0,
    targetX: 0,
    targetY: 0,
    a: 0,
    b: 1,
    levels: 4,
    velocity: 1,
    polyCoeffs: [0],
    lagrangeTerms: [],
    lagrangeStep1TableLatex: '',
    lagrangeStep2ObjectiveLatex: '',
    lagrangeStep3FormulaCompactLatex: '',
    lagrangeStep3FormulaExpandedLatex: '',
    lagrangeStep4SymbolicDataLatex: '',
    lagrangeStep4StandardPolyLatex: '',
    lagrangeStep4EvalDataLatex: '',
    lagrangeStep4EvalSumLatex: '',
    integralProblemLatex: '',
    antiderivativeLatex: '',
    exactEvaluationLatex: '',
    exactIntegralValue: 0,
    rombergFinalValue: 0,
    dischargeQ: 0,
    absoluteError: 0,
    relativeErrorPercent: 0,
    trapezoidalLevels: [],
    rombergColumns: [],
    evaluateP: () => 0,
  };
}

/**
 * Curated Real-World Hydrological & Engineering Presets
 */
export interface ProblemPreset {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  description: string;
  points: CoordinatePoint[];
  targetX: number;
  a: number;
  b: number;
  levels: number;
  velocity: number;
}

export const HYDROLOGY_PRESETS: ProblemPreset[] = [
  {
    id: 'rio-santa-catarina',
    name: 'Caso 1: Aforo Hidrométrico del Río (CONAGUA)',
    subtitle: 'Sección transversal medida con sonar acústico en 4 estaciones',
    badge: 'Hidrología • Grado 3',
    description:
      'Un equipo de ingeniería hidráulica mide la profundidad y(x) de un río de 12 metros de ancho en 4 estaciones estratégicas para calcular el área de la sección transversal y el caudal volumétrico Q = A · v.',
    points: [
      { id: 'p0', x: 0, y: 0.5 },
      { id: 'p1', x: 4, y: 3.2 },
      { id: 'p2', x: 8, y: 4.1 },
      { id: 'p3', x: 12, y: 1.0 },
    ],
    targetX: 6,
    a: 0,
    b: 12,
    levels: 4,
    velocity: 1.85,
  },
  {
    id: 'canal-presas',
    name: 'La Boca: canal de alimentación hipotético (5 sondeos)',
    subtitle: 'Ejemplo académico situado en Santiago, Nuevo León',
    badge: 'Didáctico • Grado 4',
    description:
      'Sección hipotética de 20 metros en un canal de alimentación de la presa La Boca, Santiago, Nuevo León. Las cinco profundidades son datos didácticos; no corresponden a un levantamiento real. Se estima el caudal de la sección, no el volumen del embalse.',
    points: [
      { id: 'p0', x: 0, y: 0.4 },
      { id: 'p1', x: 5, y: 3.5 },
      { id: 'p2', x: 10, y: 5.2 },
      { id: 'p3', x: 15, y: 3.8 },
      { id: 'p4', x: 20, y: 0.6 },
    ],
    targetX: 12.5,
    a: 0,
    b: 20,
    levels: 4,
    velocity: 2.4,
  },
  {
    id: 'canal-compacto',
    name: 'Caso 3: Canal de Riego Agrícola (3 Puntos - Parábola)',
    subtitle: 'Ideal para comprobar a mano en pizarrón (Grado 2)',
    badge: 'Didáctico • Grado 2',
    description:
      'Canal parabólico de 8 metros de ancho con 3 mediciones de profundidad. Perfecto para verificar cada fracción en las diapositivas de exposición.',
    points: [
      { id: 'p0', x: 0, y: 1.0 },
      { id: 'p1', x: 4, y: 4.2 },
      { id: 'p2', x: 8, y: 1.8 },
    ],
    targetX: 5,
    a: 0,
    b: 8,
    levels: 4,
    velocity: 1.5,
  },
];
