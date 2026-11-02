import { useEffect, useId, useRef, useState } from 'react';
import { Pencil, Waves, X } from 'lucide-react';
import { FullNumericalSolution, fmt } from '../math/numericalMethods';
import { assessFlow, preciseLatex } from '../math/interpretation';
import { trapezoidContributions } from '../math/trapezoids';
import { Latex } from './Latex';
import { MagicCard } from './magicui/MagicComponents';
import { FlowResults } from './FlowResults';
import { ConvergenceChart } from './ConvergenceChart';
import { Formula } from './AcademicStep';

interface Props {
  solution: FullNumericalSolution; targetX: number; selectedTrapLevel: number;
  onSelectTrapLevel: (k: number) => void; onChangeTargetX: (x: number) => void;
  presentationLayer?: 'points' | 'curve' | 'traps'; activePointId?: string | null;
  onPointFocus?: (id: string | null) => void; onPointHover?: (id: string | null) => void;
  onEditPoint?: (id: string) => void; onShowData?: () => void;
  pointOrder?: string[];
}

function PositionControl({ value, onChange, solution: s }: { value: number; onChange: (x: number) => void; solution: FullNumericalSolution }) {
  const assessment = assessFlow(s), error = !Number.isFinite(value);
  const min = s.points[0]?.x, max = s.points.at(-1)?.x;
  return <div className="probe-controls">
    <div className="probe-label"><label htmlFor="target-position">Posición <Latex math="x^*" /></label><div className="probe-number"><div className="number-with-unit"><input id="target-position" type="number" inputMode="decimal" step="any" value={Number.isFinite(value) ? value : ''} aria-invalid={error} aria-describedby={error ? 'target-position-error' : undefined} onChange={e => onChange(e.target.value === '' ? NaN : Number(e.target.value))} /><span>m</span></div>{error && <small className="field-error" id="target-position-error">Escribe una posición.</small>}</div>
      {s.isValid && <div className="probe-value"><Latex math={`P_n(x^*)=${fmt(s.targetY, 4)}\\,\\mathrm{m}`} />{assessment.queryNegative ? <small className="depth-alert">Profundidad negativa</small> : assessment.queryExtrapolated && <small className="depth-alert">Extrapolada</small>}</div>}
    </div>
    {s.isValid && <><input className="probe-range" aria-label="Posición de la ecosonda" type="range" min={min} max={max} step={(max! - min!) / 1000} value={Math.min(max!, Math.max(min!, value))} onChange={e => onChange(Number(e.target.value))} /><div className="range-endpoints"><span>{fmt(min!)} m</span><span>{fmt(max!)} m</span></div></>}
  </div>;
}

export function VisualProblemScene({ solution: s, targetX, selectedTrapLevel, onSelectTrapLevel, onChangeTargetX, presentationLayer, activePointId, onPointFocus, onPointHover, onEditPoint, onShowData, pointOrder }: Props) {
  const [userLayers, setLayers] = useState({ points: true, curve: true, traps: false });
  const layers = presentationLayer ? { points: true, curve: presentationLayer !== 'points', traps: presentationLayer === 'traps' } : userLayers;
  const [view, setView] = useState<'profile' | 'convergence'>('profile');
  const [cartesian, setCartesian] = useState(false);
  const [localFocus, setLocalFocus] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
  const [selectedTrap, setSelectedTrap] = useState<number | null>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const [viewWidth, setViewWidth] = useState(860);
  const id = useId().replace(/:/g, '');
  useEffect(() => {
    if (!canvas.current) return;
    const observer = new ResizeObserver(entries => setViewWidth(Math.max(500, Math.min(860, Math.round(entries[0].contentRect.width)))));
    observer.observe(canvas.current);
    return () => observer.disconnect();
  }, [s.isValid, view]);
  useEffect(() => { setSelectedTrap(null); }, [selectedTrapLevel]);
  const highlightedId = hoveredPoint ?? activePointId ?? localFocus;
  const point = s.points.find(p => p.id === highlightedId);
  const pointNumber = (pointId: string) => (pointOrder ?? s.points.map(p => p.id)).indexOf(pointId) + 1;
  const trap = s.trapezoidalLevels[Math.min(selectedTrapLevel, s.levels - 1)];
  const contributions = trapezoidContributions(s, selectedTrapLevel);
  const selected = selectedTrap === null ? undefined : contributions[selectedTrap];
  const focusPoint = (pointId: string | null) => { setLocalFocus(pointId); onPointFocus?.(pointId); };
  const hoverPoint = (pointId: string | null) => { setHoveredPoint(pointId); onPointHover?.(pointId); };
  const selectTrap = (index: number, focus = false) => {
    setSelectedTrap(index);
    if (focus) canvas.current?.querySelector<SVGGElement>(`[data-trap-index="${index}"]`)?.focus();
  };
  const minMeasured = s.points[0]?.x ?? 0, maxMeasured = s.points.at(-1)?.x ?? 1;
  const minX = s.isValid ? Math.min(minMeasured, s.a, s.targetX) : 0;
  const maxX = s.isValid ? Math.max(maxMeasured, s.b, s.targetX) : 1;
  const span = Math.max(maxX - minX, 1);
  const samples = s.isValid ? Array.from({ length: 241 }, (_, i) => { const x = minX + (maxX - minX) * i / 240; return { x, y: s.evaluateP(x) }; }) : [];
  const minY = Math.min(0, ...samples.map(p => p.y), s.targetY), maxY = Math.max(1, ...samples.map(p => p.y), s.targetY);
  const left = 60, right = viewWidth - 36, top = 54, bottom = 326;
  const px = (x: number) => left + 22 + (x - minX) / span * (right - left - 44);
  const py = (y: number) => cartesian ? bottom - 12 - (y - minY) / (maxY - minY) * (bottom - top - 24) : top + 5 + (y - minY) / (maxY - minY) * (bottom - top - 24);
  const surface = py(0);
  const curve = samples.map((p, i) => `${i ? 'L' : 'M'}${px(p.x)},${py(p.y)}`).join(' ');
  const closedArea = (a: number, b: number) => {
    const vertices = Array.from({ length: 161 }, (_, i) => { const x = a + (b - a) * i / 160; return `${px(x)},${py(s.evaluateP(x))}`; });
    return `M${px(a)},${surface} L${vertices.join(' L')} L${px(b)},${surface} Z`;
  };
  const intervalWidth = s.isValid ? Math.max(0, px(s.b) - px(s.a)) : 0;
  return <MagicCard className={`scene-panel ${!s.isValid ? 'scene-invalid' : ''}`}>
    {!presentationLayer && <div className="scene-topbar" key="metrics"><div className="scene-heading"><h2>Perfil del río</h2>{s.isValid && <span className="interval-label"><Latex math={`[a,b]=[${fmt(s.a)},${fmt(s.b)}]\\,\\mathrm{m}`} /></span>}</div><FlowResults solution={s} inScene /></div>}
    {!presentationLayer && s.isValid && <div className="scene-tools"><div className="plot-tabs" role="group" aria-label="Vista de la gráfica"><button type="button" aria-pressed={view === 'profile'} onClick={() => setView('profile')}>Perfil</button><button type="button" aria-pressed={view === 'convergence'} onClick={() => setView('convergence')}>Convergencia</button></div>
      {view === 'profile' && <div className="layer-controls" role="group" aria-label="Capas de la gráfica">{([{ key: 'points', label: 'Mediciones' }, { key: 'curve', label: 'Lagrange' }, { key: 'traps', label: 'Trapecios' }] as const).map(layer => <button key={layer.key} type="button" aria-pressed={layers[layer.key]} className={`layer-button layer-${layer.key}`} onClick={() => { setLayers(prev => ({ ...prev, [layer.key]: !prev[layer.key] })); if (layer.key === 'traps') setSelectedTrap(layers.traps ? null : 0); }}><span className="legend-mark" />{layer.label}</button>)}</div>}
    </div>}
    {!s.isValid ? <div className="scene-validation"><Waves size={30} /><h2>Revisa las entradas</h2><p>{s.errorMessage}</p>{onShowData && <button type="button" className="button" onClick={onShowData}>Revisar datos</button>}</div> : view === 'convergence' && !presentationLayer ? <div className="scene-convergence"><ConvergenceChart solution={s} selectedLevel={selectedTrapLevel} onSelectLevel={onSelectTrapLevel} /></div> : <>
      <div className="river-canvas" ref={canvas}>
        <svg viewBox={`0 0 ${viewWidth} 400`} role="group" aria-labelledby={`${id}-title ${id}-description`}>
          <title id={`${id}-title`}>Sección transversal del río</title><desc id={`${id}-description`}>Intervalo integrado de {fmt(s.a)} a {fmt(s.b)} metros. Selecciona una medición para vincularla con la tabla. {layers.traps ? 'Los trapecios se seleccionan con clic, Enter o las flechas.' : ''}</desc>
          <defs><linearGradient id={`${id}-water`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#E1F1FA" /><stop offset="100%" stopColor="#B9DCEB" /></linearGradient><clipPath id={`${id}-interval`}><rect x={px(s.a)} y="0" width={intervalWidth} height="400" /></clipPath></defs>
          <rect x={left} y={top} width={Math.max(0, px(s.a) - left)} height={bottom - top} fill="#F3F6F8" /><rect x={px(s.b)} y={top} width={Math.max(0, right - px(s.b))} height={bottom - top} fill="#F3F6F8" />
          {[0, 1, 2, 3, 4].map(i => { const y = minY + (maxY - minY) * i / 4; return <g key={i}><line x1={left} x2={right} y1={py(y)} y2={py(y)} stroke="#DCE6EC" strokeDasharray="3 5" /><text x={left - 12} y={py(y) + 4} textAnchor="end" className="axis-text">{fmt(y, 1)}</text></g>; })}
          {s.points.map(p => <line key={p.id} x1={px(p.x)} x2={px(p.x)} y1={top} y2={bottom} stroke="#E4ECF0" strokeDasharray="3 5" />)}
          {layers.curve && <><path d={closedArea(minX, maxX)} fill="#EDF2F5" /><path d={closedArea(s.a, s.b)} fill={`url(#${id}-water)`} /><path d={curve} fill="none" stroke="#AEC9D7" strokeWidth="2" /><path d={curve} clipPath={`url(#${id}-interval)`} fill="none" stroke="#086B9C" strokeWidth="3.3" /></>}
          {layers.traps && contributions.map(t => <g key={t.i} role="button" aria-label={`Trapecio ${t.i + 1}: ${fmt(t.area, 5)} metros cuadrados`} aria-pressed={selectedTrap === t.i} tabIndex={selectedTrap === t.i || (selectedTrap === null && t.i === 0) ? 0 : -1} data-trap-index={t.i} className={`trapezoid-target ${selectedTrap === t.i ? 'trap-selected' : ''}`} onClick={() => selectTrap(t.i)} onFocus={() => selectTrap(t.i)} onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectTrap(t.i); }
            else if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? contributions.length - 1 : Math.max(0, Math.min(contributions.length - 1, t.i + (event.key === 'ArrowRight' ? 1 : -1))); selectTrap(next, true); }
          }}><polygon points={`${px(t.leftX)},${surface} ${px(t.leftX)},${py(t.leftHeight)} ${px(t.rightX)},${py(t.rightHeight)} ${px(t.rightX)},${surface}`} fill={selectedTrap === t.i ? '#D8AB66' : '#D8AB66'} fillOpacity={selectedTrap === t.i ? '.32' : '.08'} stroke="#A66112" strokeOpacity={selectedTrap === t.i ? 1 : .45} strokeWidth={selectedTrap === t.i ? 2.5 : 1} /></g>)}
          <line x1={left} x2={right} y1={surface} y2={surface} stroke="#7CAEC6" strokeWidth="1.4" />
          {[{ x: s.a, label: 'a' }, { x: s.b, label: 'b' }].map(bound => <g key={bound.label} className="integration-bound"><line x1={px(bound.x)} x2={px(bound.x)} y1={top - 5} y2={bottom + 4} stroke="#507A91" strokeDasharray="5 4" /><text x={px(bound.x)} y={bottom + 20} textAnchor="middle">{bound.label} = {fmt(bound.x, 2)}</text></g>)}
          {selected && layers.traps && <g className="trap-dimensions" pointerEvents="none"><line x1={px(selected.leftX)} x2={px(selected.rightX)} y1={surface - 6} y2={surface - 6} stroke="#173247" strokeWidth="3" /><line x1={px(selected.leftX)} x2={px(selected.leftX)} y1={surface} y2={py(selected.leftHeight)} stroke="#086B9C" strokeWidth="3.5" /><line x1={px(selected.rightX)} x2={px(selected.rightX)} y1={surface} y2={py(selected.rightHeight)} stroke="#A66112" strokeWidth="3.5" /><text x={(px(selected.leftX) + px(selected.rightX)) / 2} y={Math.abs((px(selected.leftX) + px(selected.rightX)) / 2 - px(s.targetX)) < 55 ? surface + 22 : surface - 15} textAnchor="middle" className="dimension-label">h = {fmt(selected.width, 3)} m</text></g>}
          {layers.points && s.points.map((p, i) => { const active = highlightedId === p.id, outside = p.x < s.a || p.x > s.b; return <g key={p.id} role="button" aria-label={`Medición ${pointNumber(p.id)}: posición ${fmt(p.x)}, profundidad ${fmt(p.y)}`} aria-pressed={active} tabIndex={0} className={`measurement-point ${active ? 'point-active' : ''}`} data-point-id={p.id} onClick={() => focusPoint(p.id)} onFocus={() => focusPoint(p.id)} onBlur={() => focusPoint(null)} onMouseEnter={() => hoverPoint(p.id)} onMouseLeave={() => hoverPoint(null)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); focusPoint(p.id); } }}>
            {active && <><line x1={px(p.x)} x2={px(p.x)} y1={surface} y2={py(p.y)} stroke="#086B9C" strokeWidth="2" strokeDasharray="4 3" /><circle cx={px(p.x)} cy={py(p.y)} r="13" fill="#086B9C" fillOpacity=".13" /></>}
            <circle cx={px(p.x)} cy={py(p.y)} r={active ? 7 : 5} fill={active ? '#086B9C' : '#173247'} fillOpacity={outside && !active ? .35 : 1} stroke="white" strokeWidth="2.5" /><circle cx={px(p.x)} cy={py(p.y)} r="17" fill="transparent" />
          </g>; })}
          {!presentationLayer && <g pointerEvents="none"><line x1={px(s.targetX)} x2={px(s.targetX)} y1={surface} y2={py(s.targetY)} stroke="#086B9C" strokeWidth="1.5" strokeDasharray="4 4" /><circle cx={px(s.targetX)} cy={py(s.targetY)} r="6" fill="white" stroke="#086B9C" strokeWidth="2.5" /></g>}
          <image href="./kitbitz/tree-puffy.svg" x="24" y={surface - 39} width="25" height="38" opacity=".48" pointerEvents="none" /><image href="./kitbitz/river-stones.svg" x={right - 5} y={surface - 12} width="27" height="14" opacity=".4" pointerEvents="none" /><image href="./kitbitz/survey-boat.svg" x={px(s.targetX) - 24} y={surface - 39} width="48" height="39" pointerEvents="none" />
          {s.points.map(p => <text key={p.id} x={px(p.x)} y={bottom + 41} textAnchor="middle" className="axis-text">{fmt(p.x, 2)}</text>)}
          <text x={(left + right) / 2} y="393" textAnchor="middle" className="axis-title">Posición (m)</text><text x="19" y="195" textAnchor="middle" transform="rotate(-90 19 195)" className="axis-title">Profundidad (m)</text>
        </svg>
      </div>
      {!presentationLayer && <div className="profile-readout"><label className="point-picker"><span className="sr-only">Medición seleccionada</span><select aria-label="Medición seleccionada" value={highlightedId ?? ""} onChange={e => focusPoint(e.target.value || null)}><option value="">Mediciones</option>{s.points.map((p, i) => <option key={p.id} value={p.id}>{pointNumber(p.id)}: ({fmt(p.x)}, {fmt(p.y)})</option>)}</select></label>{point && layers.points ? <><span className="point-readout"><span className="point-index">{pointNumber(point.id)}</span><Latex math={`(x_i,y_i)=(${fmt(point.x)},${fmt(point.y)})\\,\\mathrm{m}`} /></span>{onEditPoint && <button type="button" className="text-button" onClick={() => onEditPoint(point.id)}><Pencil size={14} /> Editar</button>}</> : <span className="profile-hint">Selecciona una medición{layers.traps ? ' o un trapecio' : ''}.</span>}<label className="axis-option"><input type="checkbox" checked={cartesian} onChange={e => setCartesian(e.target.checked)} /> Eje cartesiano</label></div>}
      {!presentationLayer && layers.traps && <div className="trap-controls"><label>Partición<select aria-label="Subdivisiones de los trapecios" value={trap.k} onChange={e => onSelectTrapLevel(Number(e.target.value))}>{s.trapezoidalLevels.map(t => <option key={t.k} value={t.k}>N = {t.N}</option>)}</select></label><label>Trapecio<select aria-label="Trapecio seleccionado" value={selectedTrap ?? ''} onChange={e => setSelectedTrap(e.target.value === '' ? null : Number(e.target.value))}><option value="">Seleccionar</option>{contributions.map(t => <option key={t.i} value={t.i}>{t.i + 1} · {fmt(t.leftX, 2)}–{fmt(t.rightX, 2)} m</option>)}</select></label></div>}
      {!presentationLayer && selected && layers.traps && <section className="trapezoid-inspector" aria-label="Detalle del trapecio"><div className="trap-inspector-heading"><h3>Trapecio {selected.i + 1}</h3><button type="button" className="icon-button" aria-label="Cerrar detalle del trapecio" onClick={() => setSelectedTrap(null)}><X size={17} /></button></div><div className="trap-operand-values"><span><Latex math={`h=${fmt(selected.width)}\\,\\mathrm{m}`} /></span><span className="height-left"><Latex math={`y_{${selected.i}}=${fmt(selected.leftHeight, 5)}\\,\\mathrm{m}`} /></span><span className="height-right"><Latex math={`y_{${selected.i + 1}}=${fmt(selected.rightHeight, 5)}\\,\\mathrm{m}`} /></span></div><Formula math={`\\Delta A_{${selected.i}}=\\frac{${fmt(selected.width)}}{2}\\left(\\color{#086B9C}{${fmt(selected.leftHeight, 5)}}+\\color{#A66112}{${fmt(selected.rightHeight, 5)}}\\right)\\approx${preciseLatex(selected.area)}\\,\\mathrm{m}^2`} /></section>}
    </>}
    {!presentationLayer && (view === 'profile' || !s.isValid) && <PositionControl key="position-control" value={targetX} onChange={onChangeTargetX} solution={s} />}
  </MagicCard>;
}
