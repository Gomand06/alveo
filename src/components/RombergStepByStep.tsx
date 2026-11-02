import { useEffect, useRef, useState } from 'react';
import { X, MousePointer2 } from 'lucide-react';
import { FullNumericalSolution, RombergCellDetail, fmt } from '../math/numericalMethods';
import { Latex } from './Latex';
import { AcademicStep, Formula } from './AcademicStep';
import { ConvergenceChart } from './ConvergenceChart';
import { RombergMatrix } from './RombergMatrix';
import { FlowResults } from './FlowResults';
import { preciseLatex } from '../math/interpretation';

export function RombergStepByStep({ solution: s, selectedTrapLevel, onSelectTrapLevel, expanded }: {
  solution: FullNumericalSolution; selectedTrapLevel: number; onSelectTrapLevel: (k: number) => void; expanded?: boolean;
}) {
  const [cellId, setCellId] = useState<string | null>(null);
  const [hovered, setHovered] = useState<RombergCellDetail | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const selected = s.rombergColumns.flat().find(cell => cell.id === cellId);
  // Changing input data must never leave a stale calculation in an open dialog.
  useEffect(() => { dialog.current?.close(); setCellId(null); setHovered(null); }, [s]);
  const inspect = (cell: RombergCellDetail) => { setCellId(cell.id); dialog.current?.showModal(); };
  if (!s.isValid) return null;
  const trap = s.trapezoidalLevels[Math.min(selectedTrapLevel, s.levels - 1)];
  const reference = selected || hovered;
  return <div className="method-body">
    <div className="method-intro"><div><h2>Área por Romberg</h2><p>Integración · Tema 4</p></div><span className="quiet-badge"><Latex math={`A_0,\\ldots,A_{${s.levels - 1}}`} /></span></div>
    <ConvergenceChart solution={s} selectedLevel={selectedTrapLevel} onSelectLevel={onSelectTrapLevel} />
    <AcademicStep number={1} title="Integral, subdivisiones y tamaño de paso" expanded={expanded} initialOpen>
      <Formula math={s.integralProblemLatex} />
      <Formula math={`N_k=2^k,\\qquad h_k=\\frac{b-a}{N_k},\\qquad k=0,\\ldots,${s.levels - 1}`} />
      <div className="partition-summary">{s.trapezoidalLevels.map(t => <span key={t.k}><Latex math={`N=${t.N},\\ h=\\frac{${fmt(s.b - s.a)}}{${t.N}}=${fmt(t.h, 5)}`} /></span>)}</div>
      <Formula title="Referencia analítica" math={`I_{\\mathrm{ref}}=${fmt(s.exactIntegralValue, 8)}\\,\\mathrm{m}^2`} />
    </AcademicStep>
    <AcademicStep number={2} title="Tabla completa de la regla trapezoidal" expanded={expanded}>
      <label className="inline-select">Partición <select aria-label="Partición de la regla trapezoidal" value={trap.k} onChange={e => onSelectTrapLevel(Number(e.target.value))}>{s.trapezoidalLevels.map(t => <option key={t.k} value={t.k}>N = {t.N} · h = {fmt(t.h, 4)} m</option>)}</select></label>
      <Formula math={trap.hFractionLatex} />
      <div className="table-scroll" role="region" aria-label="Evaluaciones completas de la regla trapezoidal" tabIndex={0}>
        <table className="data-table node-table"><caption><Latex math={`N=${trap.N},\\quad ${trap.N + 1}\\text{ nodos}`} /></caption><thead><tr>
          <th><Latex math="N" /></th><th><Latex math="i" /></th><th><Latex math="x_i=a+ih" /></th><th><Latex math="f(x_i)=P_n(x_i)" /></th><th><Latex math="w_i" /></th><th><Latex math="w_i f(x_i)" /></th>
        </tr></thead><tbody>{trap.nodes.map(node => <tr key={node.i}>
          <td><Latex math={`${trap.N}`} /></td><th><Latex math={`${node.i}`} /></th><td><Latex math={`${fmt(s.a)}+${node.i}(${fmt(trap.h)})=${fmt(node.xi)}`} /></td><td><Latex math={`${fmt(node.fxi, 8)}`} /></td><td><Latex math={`${node.weight}`} /></td><td><Latex math={`${fmt(node.weightedFxi, 8)}`} /></td>
        </tr>)}</tbody></table>
      </div>
      <Formula title="Fórmula trapezoidal compuesta" math={trap.formulaLatex} />
      <Formula title="Sustitución y resultado" math={trap.substitutionLatex} emphasis />
    </AcademicStep>
    <AcademicStep number={3} title="Tabla de extrapolación de Romberg" expanded={expanded} initialOpen>
      <div className="matrix-description"><span className="helper"><MousePointer2 size={14} /> Selecciona una celda.</span></div>
      <Formula math="A_{m,k}=\frac{4^m A_{m-1,k+1}-A_{m-1,k}}{4^m-1}" />
      <RombergMatrix solution={s} active={reference} onInspect={inspect} onFocusCell={setHovered} />
    </AcademicStep>
    <dialog ref={dialog} className="calculation-dialog" aria-labelledby="cell-dialog-title" onClose={() => setCellId(null)} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close();
    }}>
      {selected && <>
        <div className="dialog-heading"><div><p>{selected.methodType === 'trapezoidal' ? 'Regla trapezoidal compuesta' : 'Extrapolación de Romberg'}</p><h2 id="cell-dialog-title">Así calculamos <Latex math={selected.label} /></h2></div><button className="icon-button" type="button" aria-label="Cerrar explicación" onClick={() => dialog.current?.close()} autoFocus><X size={20} /></button></div>
        <div className="dialog-columns">
          <section><h3>Fórmula utilizada</h3><Formula math={selected.popupFormulaLatex} />{selected.popupFormulaEquivalentLatex && <details className="nested-disclosure"><summary>Otra forma</summary><Formula math={selected.popupFormulaEquivalentLatex} /><Formula math={selected.popupFormulaExplanationLatex} /></details>}</section>
          <section><h3>Datos y resultado</h3>{selected.methodType === 'romberg' && <div className="operation-operands"><div className="operand-amber"><Latex math={`${selected.upperParentLabel}=${fmt(selected.upperParentValue!, 8)}`} /></div><div className="operand-blue"><Latex math={`${selected.lowerParentLabel}=${fmt(selected.lowerParentValue!, 8)}`} /></div></div>}<Formula title="Datos de entrada" math={selected.popupDataGivenLatex} /><Formula title="Sustituimos y resolvemos" math={selected.popupDataSubstitutionLatex} />{selected.popupDataEquivalentSubLatex && <details className="nested-disclosure"><summary>Comprobar con la forma equivalente</summary><Formula math={selected.popupDataEquivalentSubLatex} /></details>}<Formula title="Resultado" math={selected.popupResultLatex} emphasis /></section>
        </div>
        <div className="dialog-footer"><span className="helper">Presiona Esc para volver a la tabla.</span><button className="button button-primary" type="button" onClick={() => dialog.current?.close()}>Volver a la tabla</button></div>
      </>}
    </dialog>
  </div>;
}

export function Verification({ solution: s }: { solution: FullNumericalSolution }) {
  if (!s.isValid) return null;
  const relative = Math.abs(s.exactIntegralValue) > 1e-12;
  return <div className="method-body verification">
    <div className="method-intro"><h2>Comprobación</h2></div>
    <div className="comparison-values"><div><span>Referencia analítica</span><Latex math={`${fmt(s.exactIntegralValue, 8)}\\,\\mathrm{m}^2`} /></div><div><span>Romberg</span><Latex math={`${fmt(s.rombergFinalValue, 8)}\\,\\mathrm{m}^2`} /></div><div><span>{relative ? 'Error relativo' : 'Error absoluto'}</span><Latex math={relative ? `${preciseLatex(s.relativeErrorPercent)}\\,\\%` : `${preciseLatex(s.absoluteError)}\\,\\mathrm{m}^2`} /></div></div>
    <details className="nested-disclosure verification-detail"><summary>Ver cálculo analítico y error</summary>
      <Formula title="Antiderivada" math={`F(x)=${s.antiderivativeLatex}`} />
      <Formula title="Referencia del modelo" math={s.exactEvaluationLatex} />
      <Formula title="Error absoluto" math={`E_a=|I_{\\mathrm{ref}}-A_{${s.levels - 1},0}|=${preciseLatex(s.absoluteError)}\\,\\mathrm{m}^2`} />
      {relative && <Formula title="Error relativo" math={`E_r=\\frac{|I_{\\mathrm{ref}}-A_{${s.levels - 1},0}|}{|I_{\\mathrm{ref}}|}\\times100=${preciseLatex(s.relativeErrorPercent)}\\,\\%`} />}
      <p className="helper">La referencia verifica la integración del polinomio; no mide la exactitud del perfil real.</p>
    </details>
    <Formula math={`Q=A\\cdot v=(${fmt(s.rombergFinalValue, 8)}\\,\\mathrm{m}^2)(${fmt(s.velocity)}\\,\\mathrm{m/s})=${fmt(s.dischargeQ, 8)}\\,\\mathrm{m}^3/\\mathrm{s}`} emphasis />
    <FlowResults solution={s} compact />
  </div>;
}
