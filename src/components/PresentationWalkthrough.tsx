import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { FullNumericalSolution, fmt } from '../math/numericalMethods';
import { presentationOperations } from '../math/presentation';
import { Latex } from './Latex';
import { Formula } from './AcademicStep';
import { VisualProblemScene } from './VisualProblemScene';
import { RombergMatrix } from './RombergMatrix';
import { ConvergenceChart } from './ConvergenceChart';
import { FlowResults } from './FlowResults';

const stageNames = ['Mediciones', 'Lagrange', 'Romberg', 'Caudal'];
type Cursor = { stage: number; operation: number; phase: number };

export function PresentationWalkthrough({ solution: s, onExit, onStageChange, initialStage = 0, embedded = false }: { solution: FullNumericalSolution; onExit: (stage: number) => void; onStageChange: (stage: number) => void; initialStage?: number; embedded?: boolean }) {
  const stages = useMemo(() => presentationOperations(s), [s]);
  const [cursor, setCursor] = useState<Cursor>({ stage: initialStage, operation: 0, phase: 0 });
  const [plotLevel, setPlotLevel] = useState(s.levels - 1);
  const heading = useRef<HTMLHeadingElement>(null);
  const formulas = useRef<HTMLDivElement>(null);
  const matrix = useRef<HTMLElement>(null);
  const operations = stages[cursor.stage];
  const operation = operations[cursor.operation];
  const lastPhase = cursor.phase === operation.phases.length - 1;
  const atEnd = cursor.stage === 3 && cursor.operation === operations.length - 1 && lastPhase;
  const goStage = (stage: number) => setCursor({ stage, operation: 0, phase: 0 });
  useEffect(() => { onStageChange(cursor.stage); }, [cursor.stage, onStageChange]);
  const forward = () => {
    if (atEnd) { onExit(cursor.stage); return; }
    if (!lastPhase) setCursor(c => ({ ...c, phase: c.phase + 1 }));
    else if (cursor.operation < operations.length - 1) setCursor(c => ({ ...c, operation: c.operation + 1, phase: 0 }));
    else goStage(cursor.stage + 1);
  };
  const backward = () => {
    if (cursor.phase > 0) setCursor(c => ({ ...c, phase: c.phase - 1 }));
    else if (cursor.operation > 0) setCursor(c => ({ ...c, operation: c.operation - 1, phase: operations[c.operation - 1].phases.length - 1 }));
    else if (cursor.stage > 0) {
      const stage = cursor.stage - 1, operation = stages[stage].length - 1;
      setCursor({ stage, operation, phase: stages[stage][operation].phases.length - 1 });
    }
  };
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
    matrix.current?.querySelector('.current-cell')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' });
  }, [cursor.stage, cursor.operation]);
  useEffect(() => {
    if (cursor.phase > 0) formulas.current?.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }, [cursor.phase]);
  useEffect(() => {
    if (!matrix.current) return;
    const observer = new ResizeObserver(() => {
      const cell = matrix.current?.querySelector('.current-cell');
      const scroll = matrix.current?.querySelector('.table-scroll');
      if (!cell || !scroll) return;
      const cellRect = cell.getBoundingClientRect(), scrollRect = scroll.getBoundingClientRect();
      scroll.scrollLeft += cellRect.left - scrollRect.left - (scroll.clientWidth - cellRect.width) / 2;
    });
    observer.observe(matrix.current);
    return () => observer.disconnect();
  }, [cursor.stage, cursor.operation]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (document.querySelector('dialog[open]')) return;
      if (event.key === 'Escape' && !embedded) { event.preventDefault(); onExit(cursor.stage); return; }
      const target = event.target as HTMLElement;
      if (embedded && target.closest('.full-development')) return;
      if (/INPUT|SELECT|TEXTAREA|SUMMARY/.test(target.tagName) || (target.tagName === 'BUTTON' && !target.closest('.presentation-controls'))) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); forward(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); backward(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });
  const currentCell = operation.cell;
  const knownIds = new Set(operations.slice(0, cursor.operation).flatMap(op => op.cell ? [op.cell.id] : []));
  if (currentCell && lastPhase) knownIds.add(currentCell.id);
  const inspect = (id: string) => {
    const index = operations.findIndex(op => op.cell?.id === id);
    if (index >= 0) setCursor(c => ({ ...c, operation: index, phase: 0 }));
  };
  const showContext = cursor.stage === 1 && cursor.operation > 0;
  const explanation = currentCell ? currentCell.methodType === 'romberg' ? 'Combinamos las dos áreas resaltadas para corregir su error.' : 'Sumamos los trapecios de esta partición.' : operation.pointIndex !== undefined ? 'Este término usa la medición resaltada y las demás posiciones.' : undefined;
  return <>
    <nav className="presentation-stages" aria-label="Etapas de exposición">{stageNames.map((name, i) => <button type="button" key={name} aria-current={cursor.stage === i ? 'step' : undefined} onClick={() => goStage(i)}><span>{i + 1}</span>{name}</button>)}</nav>
    <div className="walkthrough-heading"><h1 ref={heading} tabIndex={-1}>{operation.cell ? <>{operation.cell.methodType === 'romberg' ? 'Romberg' : 'Trapecios'} <Latex math={operation.cell.label} /></> : operation.title}</h1><label className="operation-picker"><span className="sr-only">Operación de exposición</span><select aria-label="Operación de exposición" value={cursor.operation} onChange={e => setCursor(c => ({ ...c, operation: Number(e.target.value), phase: 0 }))}>{operations.map((op, i) => <option key={i} value={i}>{i + 1}. {op.title}</option>)}</select></label></div>
    {operation.kind === 'measurements' ? <VisualProblemScene solution={s} targetX={s.targetX} selectedTrapLevel={0} onSelectTrapLevel={() => {}} onChangeTargetX={() => {}} presentationLayer="points" /> : operation.kind === 'convergence' ? <div className="presentation-surface"><ConvergenceChart solution={s} selectedLevel={plotLevel} onSelectLevel={setPlotLevel} /></div> : <div className={`walkthrough-layout ${showContext || currentCell ? 'has-context' : ''}`}>
      {showContext && <aside className="walkthrough-context"><table className="data-table"><thead><tr><th><Latex math="i" /></th><th><Latex math="x_i" /></th><th><Latex math="y_i" /></th></tr></thead><tbody>{s.points.map((p, i) => <tr key={p.id} className={operation.pointIndex === i ? 'operand-blue' : ''}><th>{i}</th><td><Latex math={fmt(p.x)} /></td><td><Latex math={fmt(p.y)} /></td></tr>)}</tbody></table></aside>}
      {currentCell && <aside ref={matrix} className="walkthrough-context matrix-context"><RombergMatrix solution={s} active={currentCell} knownIds={knownIds} onInspect={cell => inspect(cell.id)} /></aside>}
      <section className="operation-canvas" aria-label="Operación actual">
        {explanation && cursor.phase === 0 && <p className="operation-caption">{explanation}</p>}
        {operation.operands && <div className="operation-operands">{operation.operands.map((item, i) => <div className={item.tone ? `operand-${item.tone}` : ''} key={i}><Latex math={item.math} /></div>)}</div>}
        <div className="reveal-progress" aria-label="Fases de la operación">{operation.phases.map((phase, i) => <span key={i} aria-current={cursor.phase === i ? 'step' : undefined} className={i <= cursor.phase ? 'revealed' : ''}>{i < cursor.phase ? <Check size={12} /> : <span>{i + 1}</span>}{phase.label}</span>)}</div>
        <div className="revealed-formulas" ref={formulas}>{operation.phases.slice(0, cursor.phase + 1).map((phase, i) => phase.math && <Formula key={i} title={operation.phases.length > 1 ? phase.label : undefined} math={phase.math} emphasis={i === cursor.phase} />)}</div>
        {cursor.stage === 3 && cursor.operation === operations.length - 1 && lastPhase && <FlowResults solution={s} compact />}
      </section>
    </div>}
    <nav className={`presentation-controls walkthrough-controls ${embedded ? 'embedded-controls' : ''}`} aria-label="Recorrido de presentación"><button className="button" disabled={cursor.stage === 0 && cursor.operation === 0 && cursor.phase === 0} onClick={backward}><ChevronLeft size={17} /> Atrás</button><span className="walkthrough-count" aria-live="polite">{cursor.operation + 1} / {operations.length}</span><button className="button button-primary" onClick={forward}>{atEnd ? embedded ? 'Explorar' : 'Finalizar' : !lastPhase ? operation.phases[cursor.phase + 1].label === 'Resultado' ? 'Ver resultado' : operation.phases[cursor.phase + 1].label : 'Siguiente'}{atEnd ? <Check size={16} /> : <ChevronRight size={17} />}</button></nav>
  </>;
}
