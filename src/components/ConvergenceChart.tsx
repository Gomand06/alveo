import { useId } from 'react';
import { FullNumericalSolution, fmt } from '../math/numericalMethods';
import { convergenceLevels, preciseLatex } from '../math/interpretation';
import { Latex } from './Latex';

export function ConvergenceChart({ solution: s, selectedLevel, onSelectLevel }: {
  solution: FullNumericalSolution; selectedLevel: number; onSelectLevel: (k: number) => void;
}) {
  const id = useId();
  if (!s.isValid) return null;
  const rows = convergenceLevels(s);
  const active = rows[Math.min(selectedLevel, rows.length - 1)];
  const W = 460, H = 218, left = 60, right = 438, top = 22, bottom = 177;
  const x = (k: number) => left + k / Math.max(1, rows.length - 1) * (right - left);
  const values = rows.flatMap(r => [r.trapezoidal, r.romberg]).concat(s.exactIntegralValue);
  const low = Math.min(...values), high = Math.max(...values);
  const pad = Math.max((high - low) * .12, Math.abs(high) * .025, 0.01);
  const min = low - pad, max = high + pad;
  const areaY = (value: number) => bottom - (value - min) / (max - min) * (bottom - top);
  const errorMax = Math.max(...rows.map(r => r.error));
  const errorY = (value: number) => bottom - value / (errorMax || 1) * (bottom - top - 8);
  const line = (field: 'romberg' | 'trapezoidal' | 'error') => rows.map((r, i) => `${i ? 'L' : 'M'}${x(i)},${field === 'error' ? errorY(r.error) : areaY(r[field])}`).join(' ');
  const tick = (value: number) => Math.abs(value) > 0 && (Math.abs(value) < .001 || Math.abs(value) >= 1e5) ? value.toExponential(1) : fmt(value, 2);
  return <section className="convergence" aria-labelledby={`${id}-title`}>
    <div className="convergence-heading"><h3 id={`${id}-title`}>Convergencia</h3><span className="quiet-badge"><Latex math={`N=${active.N},\\ h=${fmt(active.h, 4)}\\,\\mathrm{m}`} /></span></div>
    <div className="convergence-plots">
      <figure><figcaption>Área <span>(m²)</span></figcaption><svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Área por nivel: trapecios, mejor estimación de Romberg y referencia analítica">
        {[0, .5, 1].map(t => { const v = min + (max - min) * t; return <g key={t}><line x1={left} x2={right} y1={areaY(v)} y2={areaY(v)} className="chart-grid" /><text x={left - 8} y={areaY(v) + 4} textAnchor="end">{tick(v)}</text></g>; })}
        <line x1={left} x2={right} y1={areaY(s.exactIntegralValue)} y2={areaY(s.exactIntegralValue)} className="reference-line" />
        <path d={line('trapezoidal')} className="trap-line" /><path d={line('romberg')} className="romberg-line" />
        <line x1={x(active.k)} x2={x(active.k)} y1={top} y2={bottom} className="chart-selection" />
        {rows.map(r => <g key={r.k}><rect x={x(r.k) - 3} y={areaY(r.trapezoidal) - 3} width="6" height="6" className="trap-marker" /><circle cx={x(r.k)} cy={areaY(r.romberg)} r={r.k === active.k ? 6 : 4} className="romberg-marker" /><text x={x(r.k)} y={bottom + 22} textAnchor="middle">{r.N}</text></g>)}
        <text x={(left + right) / 2} y={H - 3} textAnchor="middle">Subdivisiones N</text>
      </svg><div className="chart-legend"><span className="legend-romberg">Romberg</span><span className="legend-trap">Trapecios</span><span className="legend-reference">Referencia</span></div></figure>
      <figure><figcaption>Error absoluto <span>(m²)</span></figcaption><svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Error absoluto de Romberg respecto a la integral analítica por nivel">
        {[0, .5, 1].map(t => <g key={t}><line x1={left} x2={right} y1={errorY((errorMax || 1) * t)} y2={errorY((errorMax || 1) * t)} className="chart-grid" /><text x={left - 8} y={errorY((errorMax || 1) * t) + 4} textAnchor="end">{tick((errorMax || 1) * t)}</text></g>)}
        <path d={line('error')} className="romberg-line" /><line x1={x(active.k)} x2={x(active.k)} y1={top} y2={bottom} className="chart-selection" />
        {rows.map(r => <g key={r.k}><circle cx={x(r.k)} cy={errorY(r.error)} r={r.k === active.k ? 6 : 4} className="romberg-marker" /><text x={x(r.k)} y={bottom + 22} textAnchor="middle">{r.N}</text></g>)}
        <text x={(left + right) / 2} y={H - 3} textAnchor="middle">Subdivisiones N</text>
      </svg><div className="chart-error-value"><Latex math={`|A_{${active.k},0}-I_{\\mathrm{ref}}|=${preciseLatex(active.error)}\\,\\mathrm{m}^2`} /></div></figure>
    </div>
    <div className="convergence-levels" role="group" aria-label="Nivel de convergencia">{rows.map(r => <button type="button" key={r.k} aria-pressed={active.k === r.k} onClick={() => onSelectLevel(r.k)}>N = {r.N}</button>)}</div>
    <details className="chart-details"><summary>Valores por nivel</summary><p className="helper">Romberg usa la mejor estimación disponible con cada N: <Latex math="A_{k,0}" />. El error se compara con la integral del modelo y puede estabilizarse por redondeo.</p><div className="table-scroll" tabIndex={0} role="region" aria-label="Valores de convergencia"><table className="data-table"><thead><tr><th>N</th><th><Latex math="h" /></th><th>Trapecios</th><th>Romberg</th><th>Error absoluto</th></tr></thead><tbody>{rows.map(r => <tr key={r.k}><th>{r.N}</th><td><Latex math={fmt(r.h)} /></td><td><Latex math={preciseLatex(r.trapezoidal)} /></td><td><Latex math={preciseLatex(r.romberg)} /></td><td><Latex math={preciseLatex(r.error)} /></td></tr>)}</tbody></table></div></details>
  </section>;
}
