import { HYDROLOGY_PRESETS, solveLagrangeAndRomberg } from '../math/numericalMethods';

export const LA_BOCA_PRESET = HYDROLOGY_PRESETS[1];
export const laBocaSolution = () => {
  const p = LA_BOCA_PRESET;
  return solveLagrangeAndRomberg(p.points, p.targetX, p.a, p.b, p.levels, p.velocity);
};
export const LA_BOCA_SOURCES = {
  place: 'https://www.santiago.gob.mx/turismo/lugares-de-interes',
  streamflow: 'https://www.usgs.gov/water-science-school/science/how-streamflow-measured?qt-science_center_objects=0',
  waterBudget: 'https://www.usbr.gov/tsc/techreferences/mands/wmm/chap13_08.html',
  historicalContext: 'https://www.nl.gob.mx/es/boletines/ayd-restablece-gradualmente-suministro-de-agua-en-poniente-y-norponiente-de-la-ciudad',
  name: 'https://www.ideam.gov.co/atencion-y-servicios-a-la-ciudadania/glosario/alveo',
  panorama: 'https://commons.wikimedia.org/wiki/File:Presa_La_Boca,_Santiago,_Nuevo_Le%C3%B3n,_M%C3%A9xico_-_2.jpg',
  shore: 'https://commons.wikimedia.org/wiki/File:Presa_La_Boca,_Santiago,_Nuevo_Le%C3%B3n,_M%C3%A9xico_-_11.jpg',
  license: 'https://creativecommons.org/licenses/by-sa/4.0/',
  pinterest: 'https://www.pinterest.com/search/pins/?q=Presa%20La%20Boca%20Santiago',
  map: 'https://www.google.com/maps/search/?api=1&query=Presa+La+Boca+Santiago+Nuevo+Leon',
  embed: 'https://maps.google.com/maps?q=Presa%20La%20Boca%2C%20Santiago%2C%20Nuevo%20Le%C3%B3n&z=12&t=k&output=embed',
};
