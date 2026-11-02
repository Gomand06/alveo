import { FullNumericalSolution, RombergCellDetail, fmt } from '../math/numericalMethods';
import { Latex } from './Latex';

export function RombergMatrix({ solution: s, active, knownIds, onInspect, onFocusCell }: {
  solution: FullNumericalSolution; active?: RombergCellDetail | null;
  knownIds?: Set<string>; onInspect: (cell: RombergCellDetail) => void;
  onFocusCell?: (cell: RombergCellDetail | null) => void;
}) {
  return <div className="table-scroll" role="region" aria-label="Tabla interactiva de Romberg" tabIndex={0}>
    <table className="data-table romberg-table"><caption className="sr-only">H como fracción, H como decimal y columnas A0 en adelante</caption><thead><tr>
      <th><Latex math="H=\frac{b-a}{N}" /></th><th><Latex math="H\ (\mathrm{m})" /></th>
      {s.rombergColumns.map((_, m) => <th key={m}><Latex math={`A_{${m}}`} /><small>{m === 0 ? 'Trapecios' : 'Romberg'}</small></th>)}
    </tr></thead><tbody>{s.trapezoidalLevels.map((t, k) => <tr key={k}>
      <th><Latex math={`\\frac{${fmt(s.b - s.a)}}{${t.N}}`} /><small>N = {t.N}</small></th><td><Latex math={fmt(t.h, 6)} /></td>
      {s.rombergColumns.map((column, m) => {
        const cell = column[k];
        if (!cell) return <td key={m} className="empty-cell">—</td>;
        const hidden = knownIds !== undefined && !knownIds.has(cell.id);
        const current = active?.id === cell.id;
        const parent = active?.upperParentId === cell.id ? 'operand-amber' : active?.lowerParentId === cell.id ? 'operand-blue' : '';
        const final = m === s.levels - 1 && k === 0;
        return <td key={m}><button type="button" disabled={hidden && !current} className={`matrix-cell ${m === 0 ? 'trapezoid-cell' : ''} ${final && !hidden ? 'final-cell' : ''} ${current ? 'current-cell' : ''} ${parent}`} onClick={() => onInspect(cell)} onMouseEnter={() => onFocusCell?.(cell)} onMouseLeave={() => onFocusCell?.(null)} onFocus={() => onFocusCell?.(cell)} onBlur={() => onFocusCell?.(null)} aria-label={hidden ? `Pendiente A ${m}, ${k}` : `Ver cálculo de A ${m}, ${k}: ${fmt(cell.value, 8)}`}>
          <span className="cell-label"><Latex math={cell.label} /></span>{hidden ? <span className="unrevealed-value">?</span> : <Latex math={fmt(cell.value, 8)} />}{final && !hidden && <small>Área final</small>}
        </button></td>;
      })}
    </tr>)}</tbody></table>
  </div>;
}
