import { useEffect, useRef, useState } from 'react';
import { Box, ChevronLeft, ChevronRight, Minus, Plus, RotateCcw } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FullNumericalSolution, fmt } from '../math/numericalMethods';
import { Latex } from './Latex';
import './river3d.css';

type View = 'iso' | 'section' | 'top';
type Runtime = {
  renderer: THREE.WebGLRenderer; camera: THREE.OrthographicCamera; controls: OrbitControls;
  profile: THREE.Group; areas: THREE.Group; boat: THREE.Group;
  markers: THREE.Mesh[]; beams: THREE.Line[]; render: () => void;
};

function SectionFallback({ solution: s, stage, station, level }: { solution: FullNumericalSolution; stage: number; station: number; level: number }) {
  const px = (x: number) => 70 + (x - s.a) / (s.b - s.a) * 700, py = (y: number) => 70 + y * 43;
  const samples = Array.from({ length: 101 }, (_, i) => { const x = s.a + (s.b - s.a) * i / 100; return `${px(x)},${py(s.evaluateP(x))}`; });
  const path = `M${samples.join(' L')}`;
  const nodes = s.trapezoidalLevels[level].nodes;
  return <svg className="three-fallback" viewBox="0 0 840 385" role="img" aria-label="Esquema de la sección: cinco sondeos, perfil de Lagrange y área por trapecios">
    <path d={`M70 70H770L${samples.slice().reverse().join(' L')}Z`} fill="#D5EBF5" />
    <path d={`${path}L770 365H70Z`} fill="#B6A68D" /><line x1="70" x2="770" y1="70" y2="70" stroke="#85B4CA" strokeWidth="2" />
    {stage === 2 && nodes.slice(0, -1).map((n, i) => <polygon key={i} points={`${px(n.xi)},70 ${px(n.xi)},${py(n.fxi)} ${px(nodes[i + 1].xi)},${py(nodes[i + 1].fxi)} ${px(nodes[i + 1].xi)},70`} fill="#DBB47B" fillOpacity=".35" stroke="#A66112" />)}
    {stage > 0 && <path d={path} stroke="#086B9C" strokeWidth="4" fill="none" />}
    {s.points.map((p, i) => <g key={p.id}><line x1={px(p.x)} x2={px(p.x)} y1="70" y2={py(p.y)} stroke={station === i ? '#A66112' : '#789EAE'} strokeWidth={station === i ? 3 : 1} strokeDasharray="5 5" /><circle cx={px(p.x)} cy={py(p.y)} r={station === i ? 8 : 5} fill="#173247" /><text x={px(p.x)} y="36" textAnchor="middle">{fmt(p.x)} m</text></g>)}
    <text x="420" y="383" textAnchor="middle">Sección didáctica de un canal de alimentación</text>
  </svg>;
}

export default function RiverSection3D({ solution: s }: { solution: FullNumericalSolution }) {
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<Runtime | null>(null);
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<'waiting' | 'ready' | 'unavailable'>('waiting');
  const [stage, setStage] = useState(0);
  const [station, setStation] = useState(2);
  const [level, setLevel] = useState(Math.min(3, s.levels - 1));
  const [view, setView] = useState<View>('iso');
  const xWorld = (x: number) => (x - s.a) / (s.b - s.a) * 10 - 5;

  useEffect(() => {
    if (!host.current) return;
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { setVisible(true); observer.disconnect(); } }, { rootMargin: '160px' });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = host.current;
    if (!container || !visible) return;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', { antialias: true, alpha: true });
    if (!context) { setStatus('unavailable'); return; }
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true, alpha: true }); }
    catch { setStatus('unavailable'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Corte 3D de un canal. Arrastra para orbitar; usa flechas izquierda y derecha para girar, más y menos para acercar y Home para restablecer.');
    canvas.tabIndex = 0;
    container.appendChild(canvas);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#EAF2F5');
    const camera = new THREE.OrthographicCamera(-12, 12, 6, -6, .1, 120);
    camera.position.set(13, 10, 15);
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, -.8, 0);
    controls.enableDamping = false;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = .02;
    controls.maxPolarAngle = 1.49;
    canvas.style.touchAction = 'pan-y';
    scene.add(new THREE.HemisphereLight('#FFFFFF', '#9E927B', 2.5));
    const sun = new THREE.DirectionalLight('#FFF6E7', 3);
    sun.position.set(-6, 12, 8); scene.add(sun);
    const fill = new THREE.DirectionalLight('#BBDDF1', 1.4);
    fill.position.set(8, 5, -6); scene.add(fill);

    const bedY = (x: number) => -s.evaluateP(s.a + (x + 5) / 10 * (s.b - s.a)) / 2.6;
    const bedSamples = Array.from({ length: 101 }, (_, i) => { const x = -5 + i / 10; return new THREE.Vector2(x, bedY(x)); });
    const earthShape = new THREE.Shape();
    earthShape.moveTo(-7, -3.4); earthShape.lineTo(-7, .48); earthShape.lineTo(-5.25, .48);
    bedSamples.forEach(p => earthShape.lineTo(p.x, p.y));
    earthShape.lineTo(5.25, .48); earthShape.lineTo(7, .48); earthShape.lineTo(7, -3.4); earthShape.closePath();
    const earth = new THREE.Mesh(new THREE.ExtrudeGeometry(earthShape, { depth: 10, bevelEnabled: false, curveSegments: 1 }), new THREE.MeshStandardMaterial({ color: '#BAAC91', roughness: 1, flatShading: true }));
    earth.position.z = -5; scene.add(earth);
    for (const x of [-6.1, 6.1]) {
      const bank = new THREE.Mesh(new THREE.BoxGeometry(1.8, .13, 10), new THREE.MeshStandardMaterial({ color: '#769782', roughness: 1 }));
      bank.position.set(x, .53, 0); scene.add(bank);
    }
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(21, 17), new THREE.MeshStandardMaterial({ color: '#D8E4E7', roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -3.43; scene.add(ground);
    const waterShape = new THREE.Shape();
    waterShape.moveTo(-5, 0); waterShape.lineTo(5, 0);
    bedSamples.slice().reverse().forEach(p => waterShape.lineTo(p.x, p.y)); waterShape.closePath();
    const water = new THREE.Mesh(new THREE.ExtrudeGeometry(waterShape, { depth: 10, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: '#53A8C8', transparent: true, opacity: .24, roughness: .25, metalness: .05, side: THREE.DoubleSide, depthWrite: false }));
    water.position.z = -5; water.renderOrder = 1; scene.add(water);
    const surface = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ color: '#72BCD4', roughness: .3, transparent: true, opacity: .35, side: THREE.DoubleSide, depthWrite: false }));
    surface.rotation.x = -Math.PI / 2; surface.position.y = .015; surface.renderOrder = 2; scene.add(surface);
    const profile = new THREE.Group();
    const curve = new THREE.Line(new THREE.BufferGeometry().setFromPoints(bedSamples.map(p => new THREE.Vector3(p.x, p.y, 5.05))), new THREE.LineBasicMaterial({ color: '#086B9C' }));
    profile.add(curve);
    const sectionFill = new THREE.Mesh(new THREE.ShapeGeometry(waterShape), new THREE.MeshBasicMaterial({ color: '#2388B3', transparent: true, opacity: .24, side: THREE.DoubleSide, depthWrite: false }));
    sectionFill.position.z = 5.06; sectionFill.renderOrder = 3; profile.add(sectionFill); scene.add(profile);
    const areas = new THREE.Group(); scene.add(areas);
    const markers: THREE.Mesh[] = [], beams: THREE.Line[] = [];
    s.points.forEach(p => {
      const x = xWorld(p.x), y = -p.y / 2.6;
      const marker = new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 10), new THREE.MeshStandardMaterial({ color: '#173247', roughness: .7 }));
      marker.position.set(x, y + .04, .2); scene.add(marker); markers.push(marker);
      const beam = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, .08, .2), new THREE.Vector3(x, y, .2)]), new THREE.LineDashedMaterial({ color: '#A66112', dashSize: .16, gapSize: .1, transparent: true, opacity: .55 }));
      beam.computeLineDistances(); beam.renderOrder = 4; scene.add(beam); beams.push(beam);
    });
    const boat = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.CapsuleGeometry(.25, .7, 4, 12), new THREE.MeshStandardMaterial({ color: '#FBF4DB', roughness: .65 }));
    hull.rotation.x = Math.PI / 2; hull.scale.z = .52; boat.add(hull);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(.28, .2, .38), new THREE.MeshStandardMaterial({ color: '#286D89', roughness: .5 }));
    cabin.position.y = .2; boat.add(cabin);
    const sensor = new THREE.Mesh(new THREE.BoxGeometry(.12, .14, .12), new THREE.MeshStandardMaterial({ color: '#E6A041' }));
    sensor.position.set(0, .3, -.3); boat.add(sensor); boat.position.set(0, .16, .2); scene.add(boat);

    const render = () => renderer.render(scene, camera);
    const resize = () => {
      const width = container.clientWidth, height = container.clientHeight;
      if (!width || !height) return;
      const aspect = width / height, half = Math.max(5.2, 9 / aspect);
      camera.left = -half * aspect; camera.right = half * aspect; camera.top = half; camera.bottom = -half;
      camera.updateProjectionMatrix(); renderer.setSize(width, height, false); render();
    };
    const observer = new ResizeObserver(resize); observer.observe(container);
    controls.addEventListener('change', render); controls.update();
    const lost = () => setStatus('unavailable'); canvas.addEventListener('webglcontextlost', lost);
    runtime.current = { renderer, camera, controls, profile, areas, boat, markers, beams, render };
    resize(); setStatus('ready');
    return () => {
      runtime.current = null; observer.disconnect(); canvas.removeEventListener('webglcontextlost', lost);
      controls.removeEventListener('change', render); controls.dispose();
      const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) { geometries.add(object.geometry); (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m)); }
      });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
      renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    };
  }, [s, visible]);

  useEffect(() => {
    const r = runtime.current;
    if (!r || status !== 'ready') return;
    r.profile.visible = stage > 0;
    r.areas.visible = stage === 2;
    r.boat.position.x = xWorld(s.points[station].x);
    r.markers.forEach((marker, i) => { marker.scale.setScalar(i === station ? 1.55 : 1); (marker.material as THREE.MeshStandardMaterial).color.set(i === station ? '#D59636' : '#173247'); });
    r.beams.forEach((beam, i) => { (beam.material as THREE.LineDashedMaterial).opacity = i === station ? 1 : .3; });
    r.areas.children.slice().forEach(child => { r.areas.remove(child); if (child instanceof THREE.Mesh || child instanceof THREE.Line) { child.geometry.dispose(); (Array.isArray(child.material) ? child.material : [child.material]).forEach(m => m.dispose()); } });
    const nodes = s.trapezoidalLevels[level].nodes;
    nodes.slice(0, -1).forEach((node, i) => {
      const next = nodes[i + 1], x1 = xWorld(node.xi), x2 = xWorld(next.xi), y1 = -node.fxi / 2.6, y2 = -next.fxi / 2.6;
      const shape = new THREE.Shape(); shape.moveTo(x1, 0); shape.lineTo(x1, y1); shape.lineTo(x2, y2); shape.lineTo(x2, 0); shape.closePath();
      const face = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: '#DBA650', transparent: true, opacity: .38, side: THREE.DoubleSide, depthWrite: false }));
      face.position.z = 5.12; face.renderOrder = 5; r.areas.add(face);
      const edge = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1, 0, 5.14), new THREE.Vector3(x1, y1, 5.14), new THREE.Vector3(x2, y2, 5.14), new THREE.Vector3(x2, 0, 5.14)]), new THREE.LineBasicMaterial({ color: '#946015' }));
      edge.renderOrder = 6; r.areas.add(edge);
    });
    r.render();
  }, [s, stage, station, level, status]);

  const changeView = (next: View) => {
    setView(next); const r = runtime.current; if (!r) return;
    r.camera.zoom = 1; r.camera.position.set(...(next === 'iso' ? [13, 10, 15] : next === 'section' ? [0, .9, 24] : [0, 24, .1]) as [number, number, number]);
    r.controls.target.set(0, -.8, 0); r.camera.updateProjectionMatrix(); r.controls.update(); r.render();
  };
  const rotate = (amount: number) => {
    const r = runtime.current; if (!r) return;
    const offset = r.camera.position.clone().sub(r.controls.target), spherical = new THREE.Spherical().setFromVector3(offset);
    spherical.theta += amount; r.camera.position.copy(new THREE.Vector3().setFromSpherical(spherical).add(r.controls.target)); r.controls.update(); r.render();
  };
  const zoom = (factor: number) => { const r = runtime.current; if (!r) return; r.camera.zoom = Math.min(2.2, Math.max(.7, r.camera.zoom * factor)); r.camera.updateProjectionMatrix(); r.render(); };
  const active = s.points[station], partition = s.trapezoidalLevels[level];
  return <div className="river-3d" data-renderer={status}>
    <div className="three-toolbar"><div className="three-stage-tabs" role="group" aria-label="Etapas del modelo 3D">{['Sondeo', 'Perfil', 'Área'].map((label, i) => <button type="button" key={label} aria-pressed={stage === i} onClick={() => setStage(i)}><span>{i + 1}</span>{label}</button>)}</div><span className="three-badge"><Box size={14} />{status === 'unavailable' ? 'Esquema 2D' : 'Corte 3D'}</span></div>
    <div className="three-stage" onKeyDown={event => { if (event.target instanceof HTMLCanvasElement && ['ArrowLeft', 'ArrowRight', '+', '-', 'Home'].includes(event.key)) { event.preventDefault(); if (event.key === 'Home') changeView('iso'); else if (event.key === '+') zoom(1.15); else if (event.key === '-') zoom(1 / 1.15); else rotate(event.key === 'ArrowLeft' ? -.22 : .22); } }}>
      <div className="three-host" ref={host} />
      {status !== 'ready' && <SectionFallback solution={s} stage={stage} station={station} level={level} />}
      <div className="three-legend"><span className="legend-bed">Lecho</span><span className="legend-water">Agua</span>{stage > 0 && <span className="legend-profile">Lagrange</span>}{stage === 2 && <span className="legend-trapezoids">Trapecios</span>}</div>
      {status === 'ready' && <div className="three-camera-tools" role="group" aria-label="Cámara 3D"><button type="button" aria-label="Girar a la izquierda" onClick={() => rotate(-.22)}><ChevronLeft size={17} /></button><button type="button" aria-label="Girar a la derecha" onClick={() => rotate(.22)}><ChevronRight size={17} /></button><button type="button" aria-label="Acercar modelo" onClick={() => zoom(1.15)}><Plus size={17} /></button><button type="button" aria-label="Alejar modelo" onClick={() => zoom(1 / 1.15)}><Minus size={17} /></button><button type="button" aria-label="Restablecer vista 3D" onClick={() => changeView('iso')}><RotateCcw size={16} /></button></div>}
    </div>
    <div className="three-controls"><div className="three-view-tabs" role="group" aria-label="Vista del modelo 3D">{([{ id: 'iso', label: 'Vista 3D' }, { id: 'section', label: 'Corte' }, { id: 'top', label: 'Planta' }] as const).map(item => <button type="button" key={item.id} aria-pressed={view === item.id} disabled={status !== 'ready'} onClick={() => changeView(item.id)}>{item.label}</button>)}</div>
      {stage === 0 ? <label>Punto de sondeo<select aria-label="Punto de sondeo 3D" value={station} onChange={event => setStation(Number(event.target.value))}>{s.points.map((p, i) => <option key={p.id} value={i}>{i + 1} · x = {fmt(p.x)} m</option>)}</select></label> : stage === 2 ? <label>Subdivisiones<select aria-label="Trapecios del modelo 3D" value={level} onChange={event => setLevel(Number(event.target.value))}>{s.trapezoidalLevels.map(p => <option key={p.k} value={p.k}>N = {p.N}</option>)}</select></label> : <span className="three-interaction-hint">Arrastra para mirar desde otro ángulo.</span>}
    </div>
    <div className="three-data" aria-live="polite">{stage === 0 ? <Latex math={`(x_${station},y_${station})=(${fmt(active.x)},${fmt(active.y)})\\,\\mathrm{m}`} /> : stage === 1 ? <Latex math={s.lagrangeStep4StandardPolyLatex} /> : <><span><Latex math={`T_{${partition.N}}=${fmt(partition.areaValue, 5)}\\,\\mathrm{m}^2`} /></span><span><Latex math={`A_{\\mathrm{Romberg}}=${fmt(s.rombergFinalValue, 5)}\\,\\mathrm{m}^2`} /></span></>}</div>
  </div>;
}
