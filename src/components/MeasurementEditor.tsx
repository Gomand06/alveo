import { Plus, RotateCcw, SlidersHorizontal, Trash2 } from 'lucide-react';
import { CoordinatePoint, fmt } from '../math/numericalMethods';
import { Latex } from './Latex';

export type InputState = { points: CoordinatePoint[]; targetX: number; a: number; b: number; levels: number; velocity: number };
const parse = (raw: string) => raw.trim() === '' ? NaN : Number(raw);

export function NumberField({ id, label, value, onChange, unit, min, error }: {
  id: string; label: React.ReactNode; value: number; onChange: (value: number) => void; unit?: string; min?: number; error?: string;
}) {
  const message = !Number.isFinite(value) ? 'Escribe un número.' : min !== undefined && value < min ? `Mínimo: ${min}.` : error;
  return <label className="field" htmlFor={id}><span>{label}</span><span className="number-with-unit"><input id={id} type="number" inputMode="decimal" step="any" min={min} value={Number.isFinite(value) ? value : ''} onChange={e => onChange(parse(e.target.value))} aria-invalid={!!message} aria-describedby={message ? `${id}-error` : undefined} />{unit && <span>{unit}</span>}</span>{message && <small id={`${id}-error`} className="field-error">{message}</small>}</label>;
}

export function MeasurementEditor({ model, activePointId, onChange, onAddPoint, onRestore, onPointFocus, onPointHover }: {
  model: InputState; activePointId: string | null; onChange: (patch: Partial<InputState>) => void;
  onAddPoint: () => void; onRestore: () => void;
  onPointFocus: (id: string | null) => void; onPointHover: (id: string | null) => void;
}) {
  const pointError = (point: CoordinatePoint, field: 'x' | 'y') => {
    if (!Number.isFinite(point[field])) return 'Escribe un número.';
    if (field === 'y' && point.y < 0) return 'Usa una profundidad ≥ 0.';
    if (field === 'x' && model.points.some(p => p.id !== point.id && Math.abs(p.x - point.x) < 1e-9)) return 'Posición repetida.';
    return '';
  };
  return <section className="input-panel" aria-labelledby="measurements-title">
    <div className="panel-heading"><div><h2 id="measurements-title">Mediciones</h2><p>{model.points.length} puntos</p></div><button type="button" className="icon-button" title="Restaurar ejemplo" aria-label="Restaurar el ejemplo inicial" onClick={onRestore}><RotateCcw size={17} /></button></div>
    <table className="input-table"><thead><tr><th scope="col">Punto</th><th scope="col"><Latex math="x_i" /> (m)</th><th scope="col"><Latex math="y_i" /> (m)</th><th scope="col"><span className="sr-only">Eliminar</span></th></tr></thead><tbody>
      {model.points.map((point, i) => <tr key={point.id} className={activePointId === point.id ? 'measurement-active' : ''} onMouseEnter={() => onPointHover(point.id)} onMouseLeave={() => onPointHover(null)} onFocusCapture={() => onPointFocus(point.id)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onPointFocus(null); }}>
        <th scope="row"><span className="point-index">{i + 1}</span></th>
        {(['x', 'y'] as const).map(field => {
          const error = pointError(point, field), id = `point-${point.id}-${field}`;
          return <td key={field}><input id={id} aria-label={`${field === 'x' ? 'Posición' : 'Profundidad'} del punto ${i + 1}`} type="number" inputMode="decimal" step="any" min={field === 'y' ? 0 : undefined} value={Number.isFinite(point[field]) ? point[field] : ''} onChange={e => onChange({ points: model.points.map(p => p.id === point.id ? { ...p, [field]: parse(e.target.value) } : p) })} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />{error && <small id={`${id}-error`} className="field-error">{error}</small>}</td>;
        })}
        <td><button type="button" className="delete-point" disabled={model.points.length <= 2} aria-label={`Eliminar punto ${i + 1}`} onClick={() => { onChange({ points: model.points.filter(p => p.id !== point.id) }); onPointFocus(null); onPointHover(null); }}><Trash2 size={16} /></button></td>
      </tr>)}
    </tbody></table>
    <button type="button" className="text-button add-point" onClick={onAddPoint} disabled={model.points.length >= 7}><Plus size={17} /> Agregar punto <span>{model.points.length}/7</span></button>
    <div className="velocity-field"><NumberField id="velocity" label="Velocidad media" value={model.velocity} min={0} unit="m/s" onChange={velocity => onChange({ velocity })} /></div>
    <details className="settings"><summary><SlidersHorizontal size={17} /><span>Ajustes<small>{Number.isFinite(model.a) ? fmt(model.a) : '—'}–{Number.isFinite(model.b) ? fmt(model.b) : '—'} m · {model.levels} niveles</small></span></summary>
      <div className="settings-content"><div className="two-fields">
        <NumberField id="limit-a" label={<Latex math="a\ (\mathrm{m})" />} value={model.a} onChange={a => onChange({ a })} />
        <NumberField id="limit-b" label={<Latex math="b\ (\mathrm{m})" />} value={model.b} error={Number.isFinite(model.a) && model.b <= model.a ? 'Debe ser mayor que a.' : undefined} onChange={b => onChange({ b })} />
      </div><button type="button" className="text-button" onClick={() => { const xs = model.points.map(p => p.x).filter(Number.isFinite); if (xs.length > 1) onChange({ a: Math.min(...xs), b: Math.max(...xs) }); }}>Usar intervalo medido</button>
      <label className="field" htmlFor="romberg-levels"><span>Niveles de Romberg</span><select id="romberg-levels" aria-label="Niveles de Romberg" value={model.levels} onChange={e => onChange({ levels: Number(e.target.value) })}>{[2, 3, 4, 5, 6, 7].map(n => <option value={n} key={n}>{n} niveles · N máx. = {2 ** (n - 1)}</option>)}</select></label></div>
    </details>
  </section>;
}
