import { Check, CircleAlert, ShieldCheck } from 'lucide-react';
import { FullNumericalSolution, fmt } from '../math/numericalMethods';
import { assessFlow } from '../math/interpretation';
import { Latex } from './Latex';

export function FlowResults({ solution: s, compact = false, inScene = false }: { solution: FullNumericalSolution; compact?: boolean; inScene?: boolean }) {
  const assessment = assessFlow(s);
  const statusIcon = assessment.state === 'consistent' ? <ShieldCheck size={14} /> : <CircleAlert size={14} />;
  return <section className={`results-strip flow-${assessment.state} ${compact ? 'flow-compact' : ''} ${inScene ? 'scene-results' : ''}`} aria-label="Resultados del cálculo">
    <div className="result-main">
      <div className="result-heading"><span>Caudal <Latex math="Q" /></span><span className="calculation-state">{s.isValid ? <><Check size={13} /> Calculado</> : 'Sin calcular'}</span></div>
      <strong>{s.isValid ? <Latex math={`${fmt(s.dischargeQ, 4)}\\,\\mathrm{m}^3/\\mathrm{s}`} /> : '—'}</strong>
      <div className="flow-interpretation"><span className="flow-badge">{statusIcon}{assessment.label}</span>
        {assessment.reasons.length > 0 && <details className="flow-reasons"><summary>Ver motivo</summary>{assessment.reasons.map(reason => <p key={reason}>{reason}</p>)}<p>El valor numérico se conserva para revisar el procedimiento.</p></details>}
      </div>
    </div>
    {!compact && <><div><span>Área <Latex math="A" /></span><strong>{s.isValid ? <Latex math={`${fmt(s.rombergFinalValue, 4)}\\,\\mathrm{m}^2`} /> : '—'}</strong></div>{!inScene && <div><span>Profundidad <Latex math="P_n(x^*)" /></span><strong>{s.isValid ? <Latex math={`${fmt(s.targetY, 4)}\\,\\mathrm{m}`} /> : '—'}</strong>{assessment.queryNegative ? <span className="depth-alert">Profundidad negativa</span> : assessment.queryExtrapolated && <span className="depth-alert">Profundidad extrapolada</span>}</div>}</>}
  </section>;
}
