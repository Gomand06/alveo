import { FullNumericalSolution, fmt, fmtParen } from '../math/numericalMethods';
import { Latex } from './Latex';
import { AcademicStep, Formula } from './AcademicStep';

export function LagrangeStepByStep({ solution: s, expanded }: { solution: FullNumericalSolution; expanded?: boolean }) {
  if (!s.isValid) return null;
  return <div className="method-body">
    <div className="method-intro"><div><h2>Perfil por Lagrange</h2><p>Interpolación · Tema 3</p></div><span className="quiet-badge"><Latex math={`n = ${s.degree},\\quad ${s.points.length}\\text{ puntos}`} /></span></div>
    <AcademicStep number={1} title="Tabla de coordenadas" expanded={expanded} initialOpen>
      <Formula math={s.lagrangeStep1TableLatex} />
    </AcademicStep>
    <AcademicStep number={2} title="Lo que buscamos" expanded={expanded}>
      <Formula math={s.lagrangeStep2ObjectiveLatex} />
    </AcademicStep>
    <AcademicStep number={3} title="Fórmula de Lagrange" expanded={expanded}>
      <Formula title="Fórmula general" math={s.lagrangeStep3FormulaCompactLatex} />
      <Formula title={`Desarrollo para ${s.points.length} coordenadas`} math={s.lagrangeStep3FormulaExpandedLatex} />
    </AcademicStep>
    <AcademicStep number={4} title="Sustitución, polinomio y evaluación" expanded={expanded}>
      <Formula title="Coordenadas sustituidas" math={s.lagrangeStep4SymbolicDataLatex} />
      <details className="nested-disclosure"><summary>Términos <Latex math="L_i(x)" /></summary>
        {s.lagrangeTerms.map(t => <div key={t.i} className="term-detail">
          <h4>Término <Latex math={`L_{${t.i}}(x)`} /></h4>
          <Formula math={`L_{${t.i}}(x)=\\frac{${t.numeratorSymbolicLatex}}{${t.denominatorSymbolicLatex}}=\\frac{${t.basisExpandedLatex}}{${fmt(t.denominatorValue)}}`} />
          <Formula math={`y_{${t.i}}L_{${t.i}}(x)=${fmtParen(t.yi)}\\,L_{${t.i}}(x)=${t.weightedPolyLatex}`} />
        </div>)}
      </details>
      <Formula title="Polinomio" math={s.lagrangeStep4StandardPolyLatex} emphasis />
      <Formula title={`Evaluamos en x* = ${fmt(s.targetX)} m`} math={s.lagrangeStep4EvalDataLatex} />
      <Formula title="Profundidad" math={s.lagrangeStep4EvalSumLatex} emphasis />
    </AcademicStep>
  </div>;
}
