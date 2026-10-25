/** Small, explicitly idealised teaching models. All angular inputs are degrees. */
export type LabConcept = { id: string; title: string; english: string; tags: string[] };
export type LabKind = 'retrograde' | 'hydrogen' | 'cepheid' | 'photometry' | 'radial' | 'climate' | 'galaxies' | 'windows' | 'hawking' | 'origins' | 'trgb' | 'broadening' | 'ecliptic' | 'red-eclipse' | 'kelvin';
export function labKindFor(concept: LabConcept): LabKind | null {
  const s = [concept.id, concept.title, concept.english, ...concept.tags].join(' ').toLowerCase();
  if (/spectral-broadening|rotational broadening|旋转展宽/.test(s)) return 'broadening';
  if (/ecliptic-zodiac|ecliptic|黄道/.test(s)) return 'ecliptic';
  if (/red-lunar-eclipse|red lunar eclipse|红色月食/.test(s)) return 'red-eclipse';
  if (/kelvin-scale|kelvin scale|开尔文温标/.test(s)) return 'kelvin';
  if (/hawking-radiation|hawking radiation|霍金辐射/.test(s)) return 'hawking';
  if (/primordial-black-holes|primordial black hole|原初黑洞/.test(s)) return 'origins';
  if (/trgb-distance|\btrgb\b|tip of the red.giant branch|红巨星支尖/.test(s)) return 'trgb';
  if (/retrograde|geocentric|heliocentric|inferior planet|solar-models|galileo/.test(s)) return 'retrograde';
  if (/balmer|lyman|energy level|atomic|spectral-fingerprints|emission-nebula|line-identification|photon/.test(s)) return 'hydrogen';
  if (/cepheid|period.luminosity|standard candle|distance.ladder|variable.star/.test(s)) return 'cepheid';
  if (/magnitude|inverse.square|distance.modulus|luminosity.distance/.test(s)) return 'photometry';
  if (/radial.velocity|exoplanet|detection.method|detection-bias|direct-imaging|planet.detection|doppler.method|视向速度|探测方法/.test(s) && !/^doppler /.test(s)) return 'radial';
  if (/greenhouse|habitable|habitability|planet.climate|温室|宜居|albedo/.test(s)) return 'climate';
  if (/galaxy.morph|galaxy.type|elliptical|spiral.galax|galaxy.merger|gravitational.lens|microlensing|星系形态|引力透镜/.test(s)) return 'galaxies';
  if (/atmospheric.window|multiwavelength|em-spectrum|radio.astronomy|interferomet|adaptive.optics|resolution|telescope.design|detector|wave.properties/.test(s)) return 'windows';
  return null;
}
export const balmerWavelength = (upper: number) => 1e9 / (1.0967758e7 * (1 / 4 - 1 / upper ** 2));
export const hydrogenEnergy = (n: number) => -13.5984 / n ** 2;
export const absoluteCepheidMagnitude = (periodDays: number) => -2.76 * Math.log10(periodDays) - 1.40;
export const photometricDistance = (apparent: number, absolute: number) => 10 ** ((apparent - absolute + 5) / 5);
export const apparentMagnitude = (absolute: number, distancePc: number) => absolute + 5 * Math.log10(distancePc / 10);
export const relativeFlux = (luminositySolar: number, distancePc: number) => luminositySolar * (10 / distancePc) ** 2;
/** Schwarzschild black hole, temperature measured by a distant observer; SI constants. */
export const hawkingTemperature = (massSolar: number) => 1.054571817e-34 * 299792458 ** 3 / (8 * Math.PI * 6.67430e-11 * 1.380649e-23 * 1.98847e30 * massSolar);
/** Isolated evaporation scaling only; the solar-mass lifetime is the shared reference. */
export const hawkingRelativeLifetime = (massSolar: number) => massSolar ** 3;
/** Old, metal-poor I-band TRGB example; actual calibration has colour/population corrections. */
export const TRGB_I_MAGNITUDE = -4.05;
export const trgbDistance = (apparentI: number, extinctionI: number) => photometricDistance(apparentI - extinctionI, TRGB_I_MAGNITUDE);
export const kelvinToCelsius = (kelvin: number) => kelvin - 273.15;
export const celsiusToKelvin = (celsius: number) => celsius + 273.15;
/** Solar direction on the ecliptic at Earth orbital phase; circular orbit, fixed obliquity. */
export function eclipticSolarPosition(earthAngle: number) {
  const longitude = ((earthAngle + 180) % 360 + 360) % 360;
  const declination = Math.asin(Math.sin(23.44 * Math.PI / 180) * Math.sin(longitude * Math.PI / 180)) * 180 / Math.PI;
  return { longitude, declination };
}
/** Uniform-brightness rotating disk, no limb darkening; normalized flux of an isolated line.
 * Convolve intrinsic Gaussian absorption with the symmetric sqrt(1-u²) rotation kernel. */
export function rotationalLineFlux(wavelengthNm: number, projectedVelocity: number, restNm = 500, sigmaNm = .035) {
  const intrinsicAbsorption = (offset: number) => .65 * Math.exp(-.5 * (offset / sigmaNm) ** 2);
  const width = restNm * projectedVelocity / 299792.458;
  if (width === 0) return 1 - intrinsicAbsorption(wavelengthNm - restNm);
  let absorption = 0, totalWeight = 0;
  for (let i = -60; i <= 60; i++) {
    const u = i / 60, weight = Math.sqrt(1 - u * u);
    absorption += weight * intrinsicAbsorption(wavelengthNm - restNm - u * width);
    totalWeight += weight;
  }
  return 1 - absorption / totalWeight;
}
export function radialAmplitude(massJupiter: number, periodDays: number, inclination: number, starMassSolar = 1) {
  return 28.4329 * massJupiter * Math.sin(inclination * Math.PI / 180) * (periodDays / 365.25) ** (-1 / 3) * starMassSolar ** (-2 / 3);
}
export const equilibriumTemperature = (luminositySolar: number, distanceAU: number, albedo: number) => 278.3 * (luminositySolar * (1 - albedo) / distanceAU ** 2) ** .25;
export const greySurfaceTemperature = (effectiveK: number, emissivity: number) => effectiveK / (1 - emissivity / 2) ** .25;
export const diffractionArcsec = (wavelengthMetres: number, diameterMetres: number) => 1.22 * wavelengthMetres / diameterMetres * 206264.806;
export function lensImages(beta: number, einsteinRadius: number) {
  const root = Math.sqrt(beta ** 2 + 4 * einsteinRadius ** 2);
  return [(beta + root) / 2, (beta - root) / 2];
}
export function planetPositions(day: number, inner = false) {
  const ae = day / 365.25 * 2 * Math.PI;
  const ap = day / (inner ? 224.7 : 686.98) * 2 * Math.PI;
  const radius = inner ? .723 : 1.524;
  const earth = { x: Math.cos(ae), y: Math.sin(ae) };
  const planet = { x: radius * Math.cos(ap), y: radius * Math.sin(ap) };
  return { earth, planet, longitude: Math.atan2(planet.y - earth.y, planet.x - earth.x) * 180 / Math.PI, heliocentric: ap * 180 / Math.PI };
}
