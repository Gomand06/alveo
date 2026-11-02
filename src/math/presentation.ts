import { FullNumericalSolution, fmt, RombergCellDetail } from './numericalMethods';
import { preciseLatex } from './interpretation';

export type PresentationPhase = { label: string; math?: string };
export type PresentationOperation = {
  title: string; kind: 'measurements' | 'lagrange' | 'integral' | 'cell' | 'convergence' | 'verification';
  phases: PresentationPhase[]; pointIndex?: number; cell?: RombergCellDetail; operands?: { math: string; tone?: 'blue' | 'amber' }[];
};
const blue = (math: string) => `\\color{#086B9C}{${math}}`;
const amber = (math: string) => `\\color{#A66112}{${math}}`;

export function presentationOperations(s: FullNumericalSolution): PresentationOperation[][] {
  if (!s.isValid) return [[], [], [], []];
  const cellOps: PresentationOperation[] = s.rombergColumns.flatMap(column => column.map(cell => {
    const trap = s.trapezoidalLevels[cell.rowIndex];
    const romberg = cell.methodType === 'romberg';
    const formula = romberg
      ? `${cell.label}=\\frac{${cell.powerOfFour}\\,${blue(cell.lowerParentLabel!)}-${amber(cell.upperParentLabel!)}}{${cell.denominator}}`
      : cell.popupFormulaLatex;
    const substitution = romberg
      ? `${cell.label}=\\frac{${cell.powerOfFour}\\,(${blue(fmt(cell.lowerParentValue!, 8))})-(${amber(fmt(cell.upperParentValue!, 8))})}{${cell.denominator}}`
      : trap.substitutionLatex;
    return {
      title: romberg ? `Romberg · A${cell.colIndex},${cell.rowIndex}` : `Trapecios · N = ${trap.N}`,
      kind: 'cell', cell,
      operands: romberg ? [
        { math: `${cell.upperParentLabel}=${fmt(cell.upperParentValue!, 8)}`, tone: 'amber' },
        { math: `${cell.lowerParentLabel}=${fmt(cell.lowerParentValue!, 8)}`, tone: 'blue' },
      ] : [{ math: `N=${trap.N},\\quad h=${fmt(trap.h, 6)}` }, { math: `f(a)=${fmt(trap.fStart)},\\quad f(b)=${fmt(trap.fEnd)}` }],
      phases: [{ label: 'Fórmula', math: formula }, { label: 'Sustitución', math: substitution }, { label: 'Resultado', math: cell.popupResultLatex }],
    } satisfies PresentationOperation;
  }));
  return [
    [{ title: 'Mediciones del río', kind: 'measurements', phases: [{ label: 'Mediciones' }] }],
    [
      { title: 'Coordenadas', kind: 'lagrange', phases: [{ label: 'Datos', math: s.lagrangeStep1TableLatex }] },
      { title: 'Profundidad buscada', kind: 'lagrange', operands: [{ math: `x^*=${blue(fmt(s.targetX))}\\,\\mathrm{m}`, tone: 'blue' }], phases: [{ label: 'Objetivo', math: `P_{${s.degree}}(${fmt(s.targetX)})=?` }] },
      { title: 'Fórmula de Lagrange', kind: 'lagrange', phases: [{ label: 'Fórmula', math: s.lagrangeStep3FormulaCompactLatex }, { label: 'Desarrollo', math: s.lagrangeStep3FormulaExpandedLatex }] },
      { title: 'Sustituimos las coordenadas', kind: 'lagrange', phases: [{ label: 'Sustitución', math: s.lagrangeStep4SymbolicDataLatex }] },
      ...s.lagrangeTerms.map(t => ({
        title: `Término ${t.i + 1}`, kind: 'lagrange', pointIndex: t.i,
        operands: [{ math: `x_{${t.i}}=${fmt(t.xi)}`, tone: 'blue' }, { math: `y_{${t.i}}=${fmt(t.yi)}`, tone: 'blue' }],
        phases: [
          { label: 'Fórmula', math: `y_{${t.i}}L_{${t.i}}(x)=${t.termSymbolicFractionLatex}` },
          { label: 'Sustitución', math: `y_{${t.i}}L_{${t.i}}(x)=${t.termDataFractionLatex}` },
          { label: 'Resultado', math: `y_{${t.i}}L_{${t.i}}(x)=${t.weightedPolyLatex}` },
        ],
      } satisfies PresentationOperation)),
      { title: 'Polinomio del perfil', kind: 'lagrange', phases: [{ label: 'Resultado', math: s.lagrangeStep4StandardPolyLatex }] },
      { title: 'Evaluamos la profundidad', kind: 'lagrange', operands: [{ math: `x^*=${fmt(s.targetX)}\\,\\mathrm{m}`, tone: 'blue' }], phases: [{ label: 'Sustitución', math: s.lagrangeStep4EvalDataLatex }, { label: 'Resultado', math: s.lagrangeStep4EvalSumLatex }] },
    ],
    [
      { title: 'Área transversal', kind: 'integral', phases: [{ label: 'Integral', math: s.integralProblemLatex }, { label: 'Particiones', math: `N_k=2^k,\\qquad h_k=\\frac{${fmt(s.b - s.a)}}{2^k}` }] },
      ...cellOps,
      { title: 'Convergencia por nivel', kind: 'convergence', phases: [{ label: 'Comparación' }] },
    ],
    [
      { title: 'Referencia analítica', kind: 'verification', phases: [{ label: 'Antiderivada', math: `F(x)=${s.antiderivativeLatex}` }, { label: 'Referencia', math: s.exactEvaluationLatex }] },
      { title: 'Error de integración', kind: 'verification', operands: [{ math: `I_{\\mathrm{ref}}=${fmt(s.exactIntegralValue, 8)}`, tone: 'amber' }, { math: `A=${fmt(s.rombergFinalValue, 8)}`, tone: 'blue' }], phases: [{ label: 'Fórmula', math: 'E_a=|I_{\\mathrm{ref}}-A|' }, { label: 'Sustitución', math: `E_a=|${amber(fmt(s.exactIntegralValue, 8))}-${blue(fmt(s.rombergFinalValue, 8))}|` }, { label: 'Resultado', math: `E_a=${preciseLatex(s.absoluteError)}\\,\\mathrm{m}^2` }] },
      { title: 'Caudal', kind: 'verification', operands: [{ math: `A=${fmt(s.rombergFinalValue, 8)}\\,\\mathrm{m}^2`, tone: 'blue' }, { math: `v=${fmt(s.velocity)}\\,\\mathrm{m/s}`, tone: 'amber' }], phases: [{ label: 'Fórmula', math: 'Q=A\\cdot v' }, { label: 'Sustitución', math: `Q=(${blue(fmt(s.rombergFinalValue, 8))})(${amber(fmt(s.velocity))})` }, { label: 'Resultado', math: `Q=\\boxed{${fmt(s.dischargeQ, 8)}\\,\\mathrm{m}^3/\\mathrm{s}}` }] },
    ],
  ];
}
