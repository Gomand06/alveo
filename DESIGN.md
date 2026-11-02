# Dirección visual de Álveo

La identidad se centra en el lecho del cauce y en el contexto de La Boca, Santiago, Nuevo León. La sección «El problema» usa una composición editorial con fotografía real, lectura breve y un corte 3D manipulable. Se mantiene separada del laboratorio para conservar la edición compacta. La navegación conserva los datos; cargar el ejemplo desde el artículo es una acción explícita que permite deshacer.

La narrativa abre con «¿Cuánta agua entra a La Boca?»: necesidad de abastecimiento documentada en 2022 → usos del aforo → sección irregular → Lagrange y Romberg → aporte del cauce. Tres filas breves explican recuperación, balance de agua y vigilancia; el alcance completo se revela en un desplegable. Se distingue el caudal de un cauce del aporte total a la presa y del cambio de almacenamiento.

El corte 3D comparte los cinco datos del caso La Boca con la calculadora. Sus tres estados explican sondeo → interpolación → integración. No hay giro automático ni movimiento decorativo continuo. Los controles incluyen alternativas a arrastrar y una representación SVG sin WebGL. Las fotografías conservan créditos visibles, fecha de 2022 y advertencia sobre el encuadre; la geometría y las mediciones se identifican como didácticas.

La pieza central es un corte transversal del río. La interfaz debe ayudar a explicar la cadena mediciones → Lagrange → Romberg → caudal durante una exposición escolar.

## Sistema

| Token | Valor | Uso |
|---|---|---|
| Fondo | #F3F7FA | Área de trabajo |
| Superficie | #FFFFFF | Entradas, gráfica y desarrollo |
| Texto | #173247 | Contenido principal y mediciones |
| Texto secundario | #5C7180 | Ayuda y unidades |
| Azul río | #086B9C | Interacción y modelo interpolado |
| Ámbar | #A66112 | Aproximación trapezoidal |
| Separador | #D5E1E8 | Límites funcionales |

Tipografía de sistema: Segoe UI Variable, Segoe UI y system-ui. KaTeX para fórmulas y resultados. Etiquetas en estilo oración, encabezados breves y unidades siempre explícitas.

## Estructura y comportamiento

- Escritorio: mediciones a la izquierda y gráfica a la derecha. Caudal y área viven en la cabecera de la gráfica y permanecen visibles al revisar el perfil. El encabezado y el selector de caso son compactos.
- Dos modos: Explorar reúne datos, perfil, resultados y convergencia; Paso a paso presenta una operación por pantalla. La referencia completa de Lagrange, Romberg y Comprobación permanece bajo un desplegable.
- Móvil: Datos, Gráfica y Desarrollo cambian de panel sin obligar a recorrer la página. Datos muestra un resumen en vivo; los errores aparecen junto al campo. Entradas y controles de edición tienen al menos 44 px de altura.
- Se conserva el contenido académico; se eliminan la duplicación de tablas de coordenadas, las explicaciones repetidas y el inspector que duplicaba el diálogo de Romberg.
- Dos paneles dentro de cada diálogo de cálculo: fórmula y sustitución. Los elementos de origen se resaltan al enfocar o señalar una celda.
- Generar casos y deshacer son acciones secundarias. Los límites y niveles viven en ajustes numéricos.
- No hay partículas, contadores animados, luces en movimiento ni movimientos decorativos continuos. La manipulación del deslizador actualiza el perfil directamente.
- Foco visible, etiquetas para entradas, pestañas con flechas/Home/End, diálogos nativos con Escape, tablas con desplazamiento propio y soporte para movimiento/transparencia reducidos y mayor contraste.

El área analítica se describe como referencia del modelo. El estado físico se muestra junto al caudal y distingue un cálculo completado de un resultado sin alertas del modelo. La extrapolación de x* se indica en la profundidad y solo afecta al estado de Q si el intervalo integrado también extrapola. Una entrada incompleta no se convierte silenciosamente en cero.

La gráfica de convergencia muestra trapecios, mejor estimación de Romberg por N y error absoluto. Usa líneas y marcadores distintos, y ofrece valores numéricos accesibles en un desplegable. No presupone una reducción estricta del error.

El perfil destaca el intervalo integrado [a,b], con límites rotulados y zonas exteriores atenuadas. El espacio sobre el agua y las ilustraciones tienen un papel secundario. Los puntos y las filas se conectan por identificador, conservando la numeración de entrada aunque las posiciones estén desordenadas. Seleccionar un trapecio muestra su base, las dos alturas y su aportación al área; un selector y flechas ofrecen alternativas a los polígonos pequeños.

Presentar revela fórmula, sustitución y resultado por operación. El azul y el ámbar relacionan los dos operandos con sus celdas; las estimaciones futuras permanecen ocultas. El selector evita obligar a recorrer todas las operaciones. El texto de apoyo se limita a etiquetas breves, estados y ayuda bajo demanda.
