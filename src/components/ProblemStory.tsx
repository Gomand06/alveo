import { lazy, Suspense, useMemo } from 'react';
import { ArrowRight, ArrowUpRight, Compass, Droplets, Film, Gauge, MapPin, Ruler, Waves } from 'lucide-react';
import { laBocaSolution, LA_BOCA_SOURCES as sources } from '../data/laBoca';
import { fmt } from '../math/numericalMethods';
import { Latex } from './Latex';
import { Formula } from './AcademicStep';
import './story.css';

const RiverSection3D = lazy(() => import('./RiverSection3D'));

function PhotoCredit({ source }: { source: string }) {
  return <span className="photo-credit"><a href={source} target="_blank" rel="noreferrer">ProtoplasmaKid / Wikimedia Commons</a> / <a href={sources.license} target="_blank" rel="noreferrer">CC BY-SA 4.0</a>. Foto de 2022; encuadre adaptado.</span>;
}

export default function ProblemStory({ onTryCase }: { onTryCase: () => void }) {
  const s = useMemo(laBocaSolution, []);
  return <article className="problem-story" aria-labelledby="story-title">
    <header className="story-header">
      <p className="story-location"><MapPin size={16} /> Presa La Boca · Santiago, Nuevo León</p>
      <div className="story-heading"><h1 id="story-title">¿Cuánta agua<br />entra a La Boca?</h1><div className="story-lead"><p>Estimar el caudal de un cauce de entrada permite cuantificar su aporte al embalse y apoyar la gestión del agua.</p><a href="#el-reto" className="story-text-link">Por qué necesitamos medirla <ArrowRight size={16} /></a></div></div>
      <figure className="story-hero-photo"><img src="./story/la-boca-panorama.jpg" width="1280" height="525" alt="Vista panorámica de la presa La Boca y las montañas de Santiago, Nuevo León" fetchPriority="high" /><figcaption><span>El paisaje real que da contexto al proyecto.</span><PhotoCredit source={sources.panorama} /></figcaption></figure>
    </header>

    <div className="story-body-layout">
      <nav className="story-index" aria-label="Contenido del artículo"><p>En esta historia</p><a href="#el-reto">Por qué medir la entrada</a><a href="#modelo-3d">Dónde medimos el caudal</a><a href="#los-metodos">Cómo lo calculamos</a><a href="#del-caudal-al-aporte">Del caudal al aporte</a><a href="#video-resumen">Cápsula en video</a><a href="#el-lugar">El lugar real</a><a href="#probar-caso">Llevarlo al laboratorio</a></nav>
      <div className="story-reading">
        <section id="el-reto" className="story-section"><div className="story-section-heading"><span className="story-symbol"><Waves size={22} /></span><h2>Medir la entrada ayuda a planear el abastecimiento.</h2></div><p>Es una necesidad real: el 27 de junio de 2022, el Gobierno de Nuevo León informó que La Boca estaba por debajo del nivel de su toma y que instalaría bombas para recuperar el abastecimiento en el sur de la ciudad. <a href={sources.historicalContext} target="_blank" rel="noreferrer">Ver el antecedente oficial de 2022.</a></p><p>Para evaluar la recuperación de una presa se necesita cuantificar el agua que recibe. Medir el caudal de sus cauces de entrada aporta una parte de esa información.</p>
          <dl className="story-purpose-list"><div><dt><Droplets size={19} />Cuantificar las aportaciones</dt><dd>Con mediciones a lo largo del tiempo, estimar cuánto volumen aporta cada cauce al embalse.</dd></div><div><dt><Ruler size={19} />Apoyar el balance de agua</dt><dd>Comparar las entradas con las extracciones y las pérdidas para evaluar el cambio de almacenamiento.</dd></div><div><dt><Gauge size={19} />Vigilar cambios de caudal</dt><dd>Repetir los aforos permite identificar aumentos que deben evaluarse junto con niveles y pronósticos.</dd></div></dl>
          <aside className="story-scope"><Ruler size={20} /><div><strong>Lo que resuelve Álveo</strong><p>Estima el caudal instantáneo de una sección a partir de cinco sondeos y una velocidad media. El caso es hipotético; el aporte total a La Boca requiere evaluar todos sus afluentes.</p></div></aside></section>
      </div>
    </div>

    <section id="modelo-3d" className="story-model-section" aria-labelledby="model-title"><div className="story-model-heading"><div><p className="story-small-label">Una sección antes de entrar al embalse</p><h2 id="model-title">El reto está bajo el agua.</h2></div><p>El fondo es irregular y solo conocemos algunos sondeos. Reconstruimos su perfil para calcular el área por la que fluye el agua.</p></div><Suspense fallback={<div className="model-loading" role="status">Preparando el corte del cauce…</div>}><RiverSection3D solution={s} /></Suspense><p className="story-model-note">Cauce de alimentación hipotético. La geometría se genera con los cinco sondeos del ejemplo.</p></section>

    <div className="story-body-layout">
      <div aria-hidden="true" />
      <div className="story-reading">
        <section id="los-metodos" className="story-section"><h2>Un resultado alimenta al siguiente.</h2><p>Los dos métodos trabajan en cadena: primero construimos una función a partir de las mediciones; después integramos esa función para obtener el área.</p>
          <div className="story-method"><span className="story-method-number">1</span><div><h3>Lagrange reconstruye el perfil.</h3><p>El polinomio pasa por los cinco sondeos y permite estimar una profundidad intermedia.</p><Formula math="(x_i,y_i)\ \xrightarrow{\text{Lagrange}}\ P_4(x)" /><div className="story-coordinate-row">{s.points.map((point, i) => <span key={point.id}><Latex math={`(x_${i},y_${i})=(${fmt(point.x)},${fmt(point.y)})`} /></span>)}</div><p className="story-caption">Posición y profundidad en metros.</p></div></div>
          <div className="story-method"><span className="story-method-number">2</span><div><h3>Romberg integra la sección.</h3><p>Partimos de trapecios y combinamos sus aproximaciones mediante extrapolación. La referencia analítica comprueba la integración del polinomio.</p><Formula math={`A=\\int_0^{20}P_4(x)\\,dx\\approx${fmt(s.rombergFinalValue, 4)}\\,\\mathrm{m}^2`} /></div></div>
          <div className="story-method"><span className="story-method-number">3</span><div><h3>El área se convierte en caudal.</h3><p>Con una velocidad media representativa de la sección, obtenemos el volumen que la atraviesa por segundo.</p><Formula math={`Q=A\\cdot v\\approx(${fmt(s.rombergFinalValue, 4)})(${fmt(s.velocity)})\\approx${fmt(s.dischargeQ, 4)}\\,\\mathrm{m}^3/\\mathrm{s}`} emphasis /><p className="story-caption">Caudal estimado del cauce estudiado en el instante del aforo.</p></div></div>
        </section>
        <section id="del-caudal-al-aporte" className="story-section story-contribution"><h2>Del caudal al agua que llega.</h2><p>Si el caudal del ejemplo se mantuviera constante durante 10 minutos, este cauce aportaría:</p><div className="story-contribution-value"><Latex math={`${fmt(s.dischargeQ * 600, 2)}\\,\\mathrm{m}^3`} /><span>en 10 minutos, bajo esa suposición</span></div><Formula math={`V_{\\text{aporte}}\\approx Q\\,\\Delta t=(${fmt(s.dischargeQ)})(600)\\approx${fmt(s.dischargeQ * 600, 2)}\\,\\mathrm{m}^3`} /><p className="story-caption">Volumen aportado por este cauce; no equivale al aumento neto del almacenamiento.</p><details className="story-boundary"><summary>Qué falta para evaluar toda la presa</summary><p>Se necesitan los caudales de los demás afluentes y su variación en el tiempo, el almacenamiento inicial, las extracciones, los desfogues, la lluvia directa y las pérdidas, como la evaporación. Si el caudal cambia, el volumen se obtiene integrando <Latex math="Q(t)" /> en el tiempo.</p><p>La alerta de inundación y las decisiones de operación requieren además niveles, pronósticos y modelos hidráulicos. Álveo demuestra el aforo de una sección; no realiza esas evaluaciones.</p><a href={sources.waterBudget} target="_blank" rel="noreferrer">Cómo se relacionan entradas, salidas y almacenamiento <ArrowUpRight size={13} /></a></details></section>
      </div>
    </div>

    <section id="video-resumen" className="story-video-section" aria-labelledby="video-title">
      <div className="story-video-card">
        <div className="story-video-info">
          <p className="story-small-label"><Film size={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px' }} /> Extra audiovisual</p>
          <h2 id="video-title">El problema y la solución en 70 segundos.</h2>
          <p>
            Cápsula explicativa animada con código: el antecedente histórico de la presa La Boca en junio de 2022, el reto del lecho irregular bajo el agua, la interpolación continua con Lagrange, la integración numérica con Romberg y la estimación del caudal resultante.
          </p>
          <ul className="story-video-highlights">
            <li><strong>Caso didáctico:</strong> 5 sondeos en 20 m de ancho y velocidad media de 2.4 m/s</li>
            <li><strong>Matemática aplicada:</strong> Reconstrucción de <Latex math="P_4(x)" /> e integración <Latex math="A \approx 67.33\,\mathrm{m}^2" /></li>
            <li><strong>Animado con Remotion:</strong> Sincronización palabra a palabra con locución</li>
          </ul>
        </div>
        <div className="story-video-player-container">
          <video
            className="story-video-element"
            controls
            playsInline
            preload="metadata"
            poster="./story/alveo-portada.png"
            aria-label="Cápsula en video: ¿Cuánta agua entra a La Boca?"
          >
            <source src="./story/alveo-reel.mp4" type="video/mp4" />
            Tu navegador no admite la reproducción de video HTML5.
          </video>
        </div>
      </div>
    </section>

    <section id="el-lugar" className="story-place-section" aria-labelledby="place-title"><div className="story-place-copy"><p className="story-location"><Compass size={16} /> Contexto local</p><h2 id="place-title">Aquí empieza la pregunta.</h2><p>La presa Rodrigo Gómez, conocida como La Boca, está en Santiago, Nuevo León. El mapa sitúa el embalse; la sección de 20 metros del ejemplo es hipotética.</p><a className="story-text-link" href={sources.map} target="_blank" rel="noreferrer">Abrir en Google Maps <ArrowUpRight size={16} /></a><figure className="story-shore-photo"><img src="./story/la-boca-orilla.jpg" width="1280" height="960" alt="Orilla de la presa La Boca, con embarcaciones y la Sierra Madre al fondo" loading="lazy" /><figcaption><PhotoCredit source={sources.shore} /></figcaption></figure></div><div className="story-map"><iframe title="Google Maps: presa La Boca, Santiago, Nuevo León" src={sources.embed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /><div className="story-map-caption"><MapPin size={16} /><span>Presa La Boca<br /><small>Santiago, Nuevo León, México</small></span><a href={sources.map} target="_blank" rel="noreferrer" aria-label="Abrir el mapa de La Boca en Google Maps"><ArrowUpRight size={18} /></a></div></div></section>

    <section id="probar-caso" className="story-cta"><div><p className="story-small-label">De la pregunta a los datos</p><h2>Estima el aporte de este cauce.</h2><p>Carga los cinco sondeos y comprueba cómo cambian el perfil, el área y el caudal.</p></div><button type="button" className="button button-primary" onClick={onTryCase}>Probar el caso La Boca <ArrowRight size={17} /></button></section>
    <footer className="story-sources"><div><strong>Por qué Álveo</strong><p>Álveo es el cauce o lecho de una corriente de agua. De ahí parte nuestro nombre y nuestra pregunta.</p><a href={sources.name} target="_blank" rel="noreferrer">Glosario de IDEAM <ArrowUpRight size={13} /></a></div><div><strong>Fuentes y referencias</strong><a href={sources.place} target="_blank" rel="noreferrer">Municipio de Santiago: La Boca <ArrowUpRight size={13} /></a><a href={sources.historicalContext} target="_blank" rel="noreferrer">Gobierno de NL: antecedente de abastecimiento, 2022 <ArrowUpRight size={13} /></a><a href={sources.streamflow} target="_blank" rel="noreferrer">USGS: cómo se mide el caudal <ArrowUpRight size={13} /></a><a href={sources.waterBudget} target="_blank" rel="noreferrer">USBR: entradas, salidas y almacenamiento <ArrowUpRight size={13} /></a><a href={sources.pinterest} target="_blank" rel="noreferrer">Referencias visuales en Pinterest <ArrowUpRight size={13} /></a><span>Fotografías: ProtoplasmaKid / Wikimedia Commons / CC BY-SA 4.0. Modelo 3D: elaboración del proyecto.</span></div></footer>
  </article>;
}
