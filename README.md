# Álveo

Calculadora educativa de área transversal y caudal de una sección de río. Encadena interpolación de Lagrange e integración de Romberg, con gráfica interactiva y desarrollo matemático en LaTeX.

**Sitio web:** [gomand06.github.io/alveo](https://gomand06.github.io/alveo/)

## Publicación

GitHub Actions verifica los tipos y los métodos numéricos, compila y publica `dist/` en GitHub Pages después de cada push a `main`. El código y los recursos usan rutas relativas para funcionar tanto en `/alveo/` como en una instalación en la raíz de un dominio. El repositorio publica mediante GitHub Actions, no desde una carpeta de la rama.

La calculadora y sus recursos están incluidos en el sitio. Google Maps y las referencias externas requieren conexión a internet.

## Ejecutar

```sh
npm install
npm run dev
```

Abre la dirección local que imprime Vite. La calculadora, las fotografías y el modelo 3D funcionan sin cuentas ni claves. Google Maps y los enlaces de referencias necesitan conexión a internet.

## La Boca y la identidad Álveo

**El problema** abre un artículo visual sobre la presa La Boca (Rodrigo Gómez), Santiago, Nuevo León. También puede abrirse directamente con `/#el-problema`. Las fotografías reales de 2022 están incluidas con atribución y licencia en `public/story/CREDITS.md`.

La pregunta central es **«¿Cuánta agua entra a La Boca?»**. El problema técnico es estimar el caudal de un cauce de alimentación con fondo irregular a partir de sondeos discretos y una velocidad media representativa. El artículo explica su utilidad para cuantificar aportaciones, alimentar el balance de agua y vigilar cambios entre aforos; documenta un antecedente real de abastecimiento de junio de 2022. El alcance y el texto para exposición se encuentran en [docs/planteamiento-la-boca.md](docs/planteamiento-la-boca.md).

El caso representa una sección **hipotética de un canal de alimentación**, de 20 m de ancho y cinco sondeos. No es un levantamiento batimétrico real de la presa ni calcula su volumen almacenado. El ejemplo obtiene A ≈ 67.3333 m² y Q = 161.6 m³/s con v = 2.4 m/s. Es el caso inicial y el botón del artículo permite cargarlo de nuevo; Deshacer conserva las entradas anteriores.

Como interpretación dimensional del resultado, si ese caudal permaneciera constante durante 10 minutos, el cauce aportaría aproximadamente 96 960 m³. El artículo separa ese aporte del cambio neto de almacenamiento, que requiere conocer todas las entradas y salidas. La integración de Romberg del laboratorio sigue siendo espacial (área del perfil); el ejemplo temporal es la aproximación V ≈ Q Δt bajo caudal constante.

El corte interactivo usa Three.js: sondeo seleccionable, perfil de Lagrange, trapecios con N variable, órbita, zoom y vistas de corte/planta. Incluye controles por teclado y un esquema SVG cuando WebGL no está disponible. Se renderiza al interactuar y se libera al abandonar el artículo; no mantiene una animación en segundo plano. El artículo y el motor 3D se cargan bajo demanda.

Álveo toma su nombre del cauce o lecho de una corriente, según el [glosario de IDEAM](https://www.ideam.gov.co/atencion-y-servicios-a-la-ciudadania/glosario/alveo). Las fuentes geográficas, científicas y visuales también se enlazan dentro del artículo. Pinterest se ofrece como referencia externa, no como origen de las fotografías incluidas.

## Comprobar

```sh
npm run typecheck
npm test
npm run build
```

Las pruebas verifican los tres ejemplos, integrales conocidas de grados 2, 4 y 6, celdas de Romberg, entradas inválidas, área cero, convergencia, interpretación física, dependencias del recorrido y las expresiones LaTeX generadas.

## Recorrido

- Explorar reúne mediciones y gráfica. Caudal y área se muestran en la cabecera del perfil; la pestaña Convergencia conserva esos resultados a la vista.
- Paso a paso muestra una operación principal, con revelado progresivo de fórmula, sustitución y resultado. Desarrollo completo contiene las tablas y demostraciones de referencia.
- En celular, Datos, Gráfica y Desarrollo cambian de panel. Datos conserva un resumen numérico en vivo y muestra los errores junto a cada entrada.
- Edita entre 2 y 7 mediciones. La gráfica y los resultados se recalculan automáticamente.
- Los dados generan un ejemplo editable. Deshacer recupera los datos anteriores a cargar o generar un caso.
- Consulta la profundidad mediante la entrada numérica o el deslizador de la ecosonda.
- Activa mediciones, curva y trapecios por separado. El eje de profundidad crece hacia abajo por defecto.
- Al enfocar una medición se ilumina su punto y viceversa. La numeración sigue la tabla de entrada aunque las posiciones estén desordenadas. En móvil, el selector de mediciones y Editar llevan directamente al campo correspondiente.
- Los límites a y b se rotulan en el perfil; el área integrada se destaca y el exterior se atenúa. Seleccionar un trapecio revela su base, alturas y área. También se puede elegir en el selector, con Enter/Espacio y con flechas/Home/End.
- Ajustes numéricos permite editar límites y niveles de Romberg.
- Lagrange presenta coordenadas, objetivo, fórmula y sustitución, en ese orden.
- Romberg incluye los pasos h, las subdivisiones N, la tabla completa de evaluaciones y la matriz H, H, A₀, A₁, … Cada elemento abre fórmula y sustitución en dos paneles.
- Convergencia compara trapecios y la mejor estimación de Romberg disponible con cada N (Aₖ,₀). El error absoluto se mide respecto a la integral analítica; los errores pequeños conservan notación científica. Los botones N seleccionan un nivel y la tabla de valores está en un desplegable.
- El caudal distingue «Calculado» de su interpretación: sin alertas del modelo, extrapolación o sin interpretación física. Se evalúan los extremos y puntos críticos del polinomio en el intervalo integrado para detectar profundidades negativas. Un x* extrapolado fuera de ese intervalo solo marca la profundidad consultada.
- Comprobación muestra antiderivada, referencia analítica, error y cálculo final del caudal.
- Presentar recorre cuatro etapas con operaciones individuales. Fórmula, sustitución y resultado se revelan de una en una. Las coordenadas o las dos celdas utilizadas se resaltan; las celdas futuras se ocultan hasta revelar su resultado. Atrás y las flechas recorren fases y operaciones. Las etapas y el selector permiten saltar directamente; Esc sale. Las flechas conservan su comportamiento normal dentro de entradas y selectores.

Los ejemplos son didácticos; no se presentan como mediciones oficiales. La integral analítica es el valor de referencia del polinomio interpolado. La comparación con Romberg verifica el error de integración del modelo, no la exactitud física del perfil entre sondeos. Para el caudal se supone que la velocidad media introducida representa la sección integrada.

## Recursos

- Ilustraciones locales de [Kitbitz](https://kitbitz.art/).
- Adaptación local de [Magic Card de Magic UI](https://magicui.design/docs/components/magic-card), con iluminación tenue al mover el puntero y sin animaciones continuas.
- React, TypeScript, Vite y KaTeX.
