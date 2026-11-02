import { lazy, Suspense, useMemo, useRef, useState } from 'react';
import { BookOpen, ChartNoAxesCombined, Dices, Presentation, Table2, Undo2, Waves, X } from 'lucide-react';
import { HYDROLOGY_PRESETS, ProblemPreset, solveLagrangeAndRomberg } from './math/numericalMethods';
import { MeasurementEditor, InputState } from './components/MeasurementEditor';
import { VisualProblemScene } from './components/VisualProblemScene';
import { FlowResults } from './components/FlowResults';
import { PresentationWalkthrough } from './components/PresentationWalkthrough';
import { LagrangeStepByStep } from './components/LagrangeStepByStep';
import { RombergStepByStep, Verification } from './components/RombergStepByStep';
import { LA_BOCA_PRESET } from './data/laBoca';

const ProblemStory = lazy(() => import('./components/ProblemStory'));
type Mode = 'explore' | 'steps' | 'story';

type Model = InputState & { preset: string };
type Tab = 'lagrange' | 'romberg' | 'verification';
type MobilePanel = 'data' | 'chart' | 'development';
const tabs: { id: Tab; label: string }[] = [{ id: 'lagrange', label: 'Lagrange' }, { id: 'romberg', label: 'Romberg' }, { id: 'verification', label: 'Comprobación' }];
const presetLabels = ['Río · 4 mediciones', 'La Boca · caso didáctico', 'Canal · 3 mediciones'];
const fromPreset = (p: ProblemPreset): Model => ({ preset: p.id, points: p.points.map(point => ({ ...point })), targetX: p.targetX, a: p.a, b: p.b, levels: p.levels, velocity: p.velocity });

export function App() {
  const [model, setModel] = useState<Model>(() => fromPreset(LA_BOCA_PRESET));
  const [undo, setUndo] = useState<Model | null>(null);
  const [notice, setNotice] = useState('');
  const [mode, setMode] = useState<Mode>(() => ['#el-problema', '#el-reto', '#modelo-3d', '#los-metodos', '#del-caudal-al-aporte', '#el-lugar', '#probar-caso'].includes(window.location.hash) ? 'story' : 'explore');
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('chart');
  const [focusedPointId, setFocusedPointId] = useState<string | null>(null);
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);
  const [selectedTrapLevel, setSelectedTrapLevel] = useState(2);
  const [presenting, setPresenting] = useState(false);
  const [stage, setStage] = useState(0);
  const [initialStage, setInitialStage] = useState(1);
  const [tab, setTab] = useState<Tab>('lagrange');
  const [expanded, setExpanded] = useState<boolean | undefined>(undefined);
  const presentationOrigin = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const referenceTabs = useRef<(HTMLButtonElement | null)[]>([]);
  const solution = useMemo(() => solveLagrangeAndRomberg(model.points, model.targetX, model.a, model.b, model.levels, model.velocity), [model]);
  const activeTrap = Math.min(selectedTrapLevel, model.levels - 1);
  const activePointId = hoveredPointId ?? focusedPointId;
  const change = (patch: Partial<InputState>) => { setModel(prev => ({ ...prev, ...patch, preset: 'custom' })); setNotice(''); };
  const clearPoint = () => { setFocusedPointId(null); setHoveredPointId(null); };
  const choosePreset = (id: string) => {
    const p = HYDROLOGY_PRESETS.find(item => item.id === id);
    if (!p) return;
    setUndo(model); setModel(fromPreset(p)); setSelectedTrapLevel(2); clearPoint(); setNotice('Caso cargado.');
  };
  const rollDice = () => {
    const width = (3 + Math.floor(Math.random() * 5)) * 3;
    const base = .3 + Math.random() * .9, depth = 2 + Math.random() * 3, tilt = Math.random() * .5;
    const points = Array.from({ length: 4 }, (_, i) => {
      const t = i / 3;
      return { id: `random-${Date.now()}-${i}`, x: width * t, y: Number((base + 4 * depth * t * (1 - t) + tilt * t).toFixed(2)) };
    });
    setUndo(model); setModel({ preset: 'random', points, a: 0, b: width, targetX: width / 2, levels: 4, velocity: Number((.8 + Math.random() * 1.8).toFixed(2)) });
    setSelectedTrapLevel(2); clearPoint(); setNotice('Caso generado.');
  };
  const addPoint = () => {
    if (model.points.length >= 7) return;
    const x = Math.max(...model.points.map(p => Number.isFinite(p.x) ? p.x : 0)) + 2;
    change({ points: [...model.points, { id: `point-${Date.now()}`, x, y: 1 }], b: x });
  };
  const switchMode = (next: Mode) => {
    setMode(next); setHoveredPointId(null); setMobilePanel(next === 'steps' ? 'development' : 'chart');
    window.history.replaceState(null, '', next === 'story' ? '#el-problema' : '#main');
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  };
  const navigateMobile = (panel: MobilePanel) => { setMobilePanel(panel); setHoveredPointId(null); setMode(panel === 'development' ? 'steps' : 'explore'); requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' })); };
  const showData = (pointId?: string) => {
    const targetError = !pointId && !Number.isFinite(model.targetX);
    setMode('explore'); setMobilePanel(targetError ? 'chart' : 'data'); setHoveredPointId(null);
    if (pointId) setFocusedPointId(pointId);
    requestAnimationFrame(() => {
      const field = pointId ? document.getElementById(`point-${pointId}-x`) : targetError ? document.getElementById('target-position') : document.querySelector<HTMLInputElement>('.input-panel input[aria-invalid="true"]');
      field?.focus();
    });
  };
  const exitPresentation = () => {
    setPresenting(false);
    if (stage > 0) setTab(tabs[stage - 1].id);
    if (mode === 'steps') setInitialStage(stage);
    requestAnimationFrame(() => presentationOrigin.current?.focus());
  };

  return <div className={`app app-workspace ${presenting ? 'presentation-mode' : ''}`}>
    <a className="skip-link" href="#main">Ir a la calculadora</a>
    <header className="app-header"><div className="header-inner">
      <a className="brand" href="#main" aria-label="Álveo, ir al laboratorio" onClick={event => { if (!presenting) { event.preventDefault(); switchMode('explore'); } }}><span className="brand-symbol"><Waves size={22} strokeWidth={1.7} /></span><span>Álveo</span></a>
      {!presenting && <><nav className="experience-tabs" aria-label="Modo de trabajo"><button type="button" aria-pressed={mode === 'explore'} onClick={() => switchMode('explore')}>Explorar</button><button type="button" aria-pressed={mode === 'steps'} onClick={() => switchMode('steps')}>Paso a paso</button><button type="button" aria-pressed={mode === 'story'} onClick={() => switchMode('story')}>El problema</button></nav><button type="button" className="mobile-story-button" aria-label="El problema" aria-pressed={mode === 'story'} onClick={() => switchMode('story')}><BookOpen size={19} /></button></>}
      {presenting ? <button type="button" className="button" aria-label="Salir de presentación" onClick={exitPresentation}><X size={16} /><span className="exit-long">Salir de presentación</span><span className="exit-short" aria-hidden="true">Salir</span></button> : mode === 'story' ? <button type="button" className="button" onClick={() => switchMode('explore')}><ChartNoAxesCombined size={17} /> Laboratorio</button> : <button type="button" ref={presentationOrigin} className="button" disabled={!solution.isValid} onClick={() => { setStage(0); setPresenting(true); mainRef.current?.focus(); }}><Presentation size={17} /> Presentar</button>}
    </div></header>
    {!presenting && mode !== 'story' && <nav className="mobile-workspace-nav" aria-label="Navegación del laboratorio">
      {([{ id: 'data', label: 'Datos', Icon: Table2 }, { id: 'chart', label: 'Gráfica', Icon: ChartNoAxesCombined }, { id: 'development', label: 'Desarrollo', Icon: BookOpen }] as const).map(item => <button type="button" key={item.id} aria-pressed={mobilePanel === item.id} onClick={() => navigateMobile(item.id)}><item.Icon size={17} />{item.label}</button>)}
    </nav>}
    <main id="main" ref={mainRef} tabIndex={-1} className="main-shell">
      {!presenting && mode === 'explore' && <h1 className="sr-only">Caudal del río</h1>}
      {!presenting && mode !== 'story' && <div className="workspace-toolbar">
        <label htmlFor="case-select"><span className="sr-only">Caso de estudio</span><select id="case-select" aria-label="Caso de estudio" value={model.preset} onChange={e => choosePreset(e.target.value)}>{HYDROLOGY_PRESETS.map((p, i) => <option key={p.id} value={p.id}>{presetLabels[i]}</option>)}{!HYDROLOGY_PRESETS.some(p => p.id === model.preset) && <option value={model.preset}>{model.preset === 'random' ? 'Caso aleatorio' : 'Datos personalizados'}</option>}</select></label>
        <div className="workspace-actions">{undo && <button type="button" className="text-button" onClick={() => { setModel(undo); setUndo(null); clearPoint(); setNotice('Datos restaurados.'); }}><Undo2 size={16} /><span>Deshacer</span></button>}<button type="button" className="button" onClick={rollDice}><Dices size={18} /> Generar caso</button></div>
        <span className="workspace-notice" role="status">{notice}</span>
      </div>}

      {!presenting && mode === 'explore' && <div className="workspace" data-mobile-panel={mobilePanel}>
        <div className="editor-column"><div className="mobile-data-metrics"><FlowResults solution={solution} inScene /></div><MeasurementEditor model={model} onChange={change} onAddPoint={addPoint} onRestore={() => choosePreset(LA_BOCA_PRESET.id)} activePointId={activePointId} onPointFocus={setFocusedPointId} onPointHover={setHoveredPointId} /></div>
        <VisualProblemScene solution={solution} targetX={model.targetX} selectedTrapLevel={activeTrap} onSelectTrapLevel={setSelectedTrapLevel} onChangeTargetX={targetX => change({ targetX })} activePointId={activePointId} onPointFocus={setFocusedPointId} onPointHover={setHoveredPointId} onEditPoint={showData} onShowData={() => showData()} pointOrder={model.points.map(p => p.id)} />
      </div>}

      {!presenting && mode === 'steps' && <div className="steps-workspace">
        {solution.isValid ? <PresentationWalkthrough solution={solution} onExit={() => switchMode('explore')} onStageChange={setStage} initialStage={initialStage} embedded /> : <div className="method-empty"><BookOpen size={26} /><p>Corrige las entradas para continuar.</p><button type="button" className="button" onClick={() => showData()}>Revisar datos</button></div>}
        <details className="full-development"><summary>Desarrollo completo</summary>
          <section className="development" aria-label="Referencia de los métodos"><div className="development-heading"><h2>Referencia</h2>{tab !== 'verification' && <button type="button" className="text-button" onClick={() => setExpanded(prev => !prev)}>{expanded ? 'Contraer' : 'Expandir'}</button>}</div>
            <div role="tablist" aria-label="Desarrollo matemático" className="method-tabs">{tabs.map((item, i) => <button type="button" ref={el => { referenceTabs.current[i] = el; }} id={`tab-${item.id}`} key={item.id} role="tab" aria-selected={tab === item.id} aria-controls={`panel-${item.id}`} tabIndex={tab === item.id ? 0 : -1} onClick={() => setTab(item.id)} onKeyDown={event => {
              let next = i;
              if (event.key === 'ArrowRight') next = (i + 1) % tabs.length;
              else if (event.key === 'ArrowLeft') next = (i + tabs.length - 1) % tabs.length;
              else if (event.key === 'Home') next = 0;
              else if (event.key === 'End') next = tabs.length - 1;
              else return;
              event.preventDefault(); setTab(tabs[next].id); referenceTabs.current[next]?.focus();
            }}>{i + 1} {item.label}</button>)}</div>
            <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0}>{tab === 'lagrange' ? <LagrangeStepByStep solution={solution} expanded={expanded} /> : tab === 'romberg' ? <RombergStepByStep solution={solution} selectedTrapLevel={activeTrap} onSelectTrapLevel={setSelectedTrapLevel} expanded={expanded} /> : <Verification solution={solution} />}</div>
          </section>
        </details>
      </div>}
      {!presenting && mode === 'story' && <Suspense fallback={<p className="story-page-loading" role="status">Abriendo La Boca…</p>}><ProblemStory onTryCase={() => { choosePreset(LA_BOCA_PRESET.id); switchMode('explore'); }} /></Suspense>}
      {presenting && <PresentationWalkthrough solution={solution} onExit={exitPresentation} onStageChange={setStage} />}
    </main>
  </div>;
}

export default App;
