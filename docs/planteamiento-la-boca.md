# ¿Cuánta agua entra a La Boca?

## Necesidad real

La recuperación del almacenamiento y la planeación del abastecimiento requieren conocer cuánta agua recibe y pierde una presa. El problema tiene un antecedente local: el 27 de junio de 2022, el Gobierno de Nuevo León reportó que La Boca estaba por debajo del nivel de su toma y que se instalarían bombas para recuperar el abastecimiento en el sur de la ciudad. Es un hecho histórico, no una descripción de la situación actual.

## Problema que resuelve el proyecto

**Estimar el caudal instantáneo de un cauce de alimentación de La Boca a partir de profundidades discretas y una velocidad media representativa, para cuantificar su aportación al embalse.**

El fondo irregular dificulta obtener el área con una figura geométrica simple. Lagrange construye un polinomio que pasa por los sondeos; Romberg integra ese perfil para obtener el área transversal. Multiplicar el área por la velocidad media produce el caudal Q = A v.

## Para qué sirve

- **Cuantificar aportaciones:** aforos sucesivos permiten estimar el volumen que aporta un cauce durante un periodo.
- **Apoyar el balance hídrico:** combinar las aportaciones con las salidas y pérdidas ayuda a evaluar el cambio de almacenamiento y aporta información para planear el abastecimiento.
- **Vigilar variaciones:** comparar aforos permite reconocer aumentos de caudal que requieren evaluación junto con niveles y pronósticos.

## Alcance académico

Los cinco sondeos y la velocidad del ejemplo son hipotéticos. El resultado de 161.6 m³/s corresponde a una sección, no a todos los afluentes. Si permaneciera constante 10 minutos, aportaría aproximadamente 96 960 m³; esa cantidad no es el incremento neto del almacenamiento. Con caudal variable se necesita integrar Q(t) en el tiempo.

Evaluar la presa completa requiere otros afluentes, almacenamiento inicial, extracciones, desfogues, lluvia directa, evaporación y otras pérdidas. La operación de la presa y las alertas de inundación necesitan información y modelos adicionales. El proyecto demuestra el aforo y su cálculo numérico, sin sustituir el monitoreo oficial ni resolver por sí solo la escasez.

La referencia analítica verifica la integración del polinomio; la fidelidad del perfil y el caudal al cauce real depende de las mediciones, del modelo interpolado y de la velocidad media utilizada.

## Fuentes

- [Gobierno de Nuevo León, 27 de junio de 2022: situación de la toma de La Boca y abastecimiento](https://www.nl.gob.mx/es/boletines/ayd-restablece-gradualmente-suministro-de-agua-en-poniente-y-norponiente-de-la-ciudad).
- [USGS: medición de caudal por área y velocidad](https://www.usgs.gov/water-science-school/science/how-streamflow-measured?qt-science_center_objects=0).
- [USBR: relación entre entradas, salidas y almacenamiento](https://www.usbr.gov/tsc/techreferences/mands/wmm/chap13_08.html).
