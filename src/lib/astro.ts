/** Astronomy teaching models. Units and approximation limits: docs/models.md. */
export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;
export const deg = DEG;
export const rad = RAD;
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const normalizeDegrees = (angle: number) => ((angle % 360) + 360) % 360;
const sin = (angle: number) => Math.sin(angle * DEG);
const cos = (angle: number) => Math.cos(angle * DEG);
const positive = (value: number, label: string) => {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} must be positive and finite`);
  return value;
};

/** Orbital elongation: 0° new Moon, 90° first quarter, 180° full Moon. */
export function moonIllumination(phaseDegrees: number): number {
  return (1 - cos(phaseDegrees)) / 2;
}

/** Circular-year season model: day 80 is March equinox; adjustable axial tilt. */
export function solarDeclination(dayOfYear: number, tilt = 23.44): number {
  return Math.asin(sin(tilt) * sin((dayOfYear - 80) * 360 / 365.2422)) * RAD;
}

/** Hours above a flat horizon, Sun's centre, no refraction. */
export function daylightHours(latitude: number, dayOfYear: number, tilt = 23.44): number {
  const dec = solarDeclination(dayOfYear, tilt);
  const constant = sin(latitude) * sin(dec);
  const varying = cos(latitude) * cos(dec);
  // The pole/equinox limit has the Sun on the horizon all day: display 12 h.
  if (Math.abs(varying) < 1e-12) return Math.abs(constant) < 1e-12 ? 12 : constant > 0 ? 24 : 0;
  const crossing = -constant / varying;
  return crossing <= -1 ? 24 : crossing >= 1 ? 0 : 24 * Math.acos(crossing) / Math.PI;
}

/** Geometric solar altitude in degrees. `hour` is local apparent solar time. */
export function solarAltitude(latitude: number, dayOfYear: number, hour: number, tilt = 23.44): number {
  const dec = solarDeclination(dayOfYear, tilt);
  return Math.asin(clamp(sin(latitude) * sin(dec) + cos(latitude) * cos(dec) * cos(15 * (hour - 12)), -1, 1)) * RAD;
}

/** Wien B_lambda peak in nanometres, temperature in kelvin. */
export const wienPeak = (temperature: number): number => 2.897771955e6 / positive(temperature, 'Temperature');
/** Simplified main-sequence scaling in solar units; not an evolution track. */
export const luminosity = (mass: number): number => positive(mass, 'Stellar mass') ** 3.5;
export const stellarLifetime = (mass: number): number => 10 * mass / luminosity(mass);
/** Kepler two-body limit; a in AU, central mass in solar masses, period years. */
export const orbitalPeriod = (a: number, mass = 1): number => Math.sqrt(positive(a, 'Semi-major axis') ** 3 / positive(mass, 'Central mass'));
/** Central transit with a uniform stellar disc; Earth radii / solar radii. */
export const transitDepth = (planetRadiusEarth: number, starRadiusSolar = 1): number =>
  Math.min(1, (Math.max(0, planetRadiusEarth) * 6371 / (positive(starRadiusSolar, 'Star radius') * 695700)) ** 2);
/** Surface escape speed km/s, spherical body in Earth mass and mean radius units. */
export const escapeVelocity = (massEarth: number, radiusEarth: number): number =>
  Math.sqrt(2 * 6.67430e-11 * positive(massEarth, 'Planet mass') * 5.9722e24 / (positive(radiusEarth, 'Planet radius') * 6.371e6)) / 1000;
export const parallaxDistance = (pArcsec: number): number => 1 / positive(pArcsec, 'Parallax');
export const distanceModulus = (distancePc: number): number => 5 * Math.log10(positive(distancePc, 'Distance') / 10);
/** Nearby-universe linear Hubble law; H0 km/s/Mpc, distance Mpc. */
export const hubbleVelocity = (distanceMpc: number, H0 = 70): number => distanceMpc * H0;
export const redshiftWavelength = (restNm: number, z: number): number => positive(restNm, 'Wavelength') * (1 + z);

/**
 * Flat matter + cosmological-constant Friedmann solution, age in Gyr.
 * Scale factor is normalized to today a=1. Radiation is omitted: use for
 * late-universe teaching, not recombination or primordial nucleosynthesis.
 */
export function cosmicAge(scale: number, H0 = 70, omegaMatter = 0.3): number {
  if (!Number.isFinite(scale) || scale < 0) throw new RangeError('Scale factor must be non-negative and finite');
  if (!Number.isFinite(omegaMatter) || omegaMatter <= 0 || omegaMatter > 1) throw new RangeError('Matter density must be in (0, 1]');
  const hubbleTime = 3.0856775814913673e19 / positive(H0, 'Hubble constant') / 3.15576e16;
  const omegaLambda = 1 - omegaMatter;
  if (omegaLambda < 1e-12) return 2 * hubbleTime * scale ** 1.5 / 3;
  return 2 * hubbleTime / (3 * Math.sqrt(omegaLambda)) * Math.asinh(Math.sqrt(omegaLambda / omegaMatter) * scale ** 1.5);
}

/**
 * Illustrative galaxy, not Milky Way measurements. Luminous Plummer component
 * M=6e10 Msun, scale=3 kpc; optional cored halo tends to 200 km/s.
 */
export function rotationSpeed(radiusKpc: number, darkMatter = true): number {
  const r = Math.max(0, radiusKpc);
  const visibleSquared = 4.30091e-6 * 6e10 * r * r / (r * r + 9) ** 1.5;
  const haloSquared = darkMatter ? 200 ** 2 * r * r / (r * r + 25) : 0;
  return Math.sqrt(visibleSquared + haloSquared);
}

/** Planck B_lambda in W m^-2 sr^-1 m^-1. Input wavelength nm, T kelvin. */
export function blackbody(lambdaNm: number, temperature: number): number {
  const wavelength = positive(lambdaNm, 'Wavelength') * 1e-9;
  const exponent = 6.62607015e-34 * 299792458 / (wavelength * 1.380649e-23 * positive(temperature, 'Temperature'));
  return exponent > 709 ? 0 : 2 * 6.62607015e-34 * 299792458 ** 2 / wavelength ** 5 / Math.expm1(exponent);
}

export interface Equatorial { ra: number; dec: number }
export interface Horizontal { altitude: number; azimuth: number; hourAngle: number }
export function julianDate(dateUTC: Date): number { return dateUTC.getTime() / 86400000 + 2440587.5; }

/** Greenwich mean sidereal angle, degrees. UTC approximates UT1. */
export function siderealDegrees(dateUTC: Date): number {
  const d = julianDate(dateUTC) - 2451545;
  const t = d / 36525;
  return normalizeDegrees(280.46061837 + 360.98564736629 * d + 0.000387933 * t * t - t ** 3 / 38710000);
}

/** RA hours, Dec degrees of date; latitude north+, longitude east+. No refraction. */
export function raDecToHorizontal(raHours: number, decDegrees: number, dateUTC: Date, latitude: number, longitude: number): Horizontal {
  const hourAngle = normalizeDegrees(siderealDegrees(dateUTC) + longitude - raHours * 15 + 180) - 180;
  const east = -cos(decDegrees) * sin(hourAngle);
  const north = sin(decDegrees) * cos(latitude) - cos(decDegrees) * cos(hourAngle) * sin(latitude);
  const up = sin(decDegrees) * sin(latitude) + cos(decDegrees) * cos(hourAngle) * cos(latitude);
  return { altitude: Math.asin(clamp(up, -1, 1)) * RAD, azimuth: normalizeDegrees(Math.atan2(east, north) * RAD), hourAngle };
}

function eclipticToEquatorial(longitude: number, latitude: number, obliquity: number): Equatorial {
  const x = cos(longitude) * cos(latitude);
  const y = sin(longitude) * cos(latitude) * cos(obliquity) - sin(latitude) * sin(obliquity);
  const z = sin(longitude) * cos(latitude) * sin(obliquity) + sin(latitude) * cos(obliquity);
  return { ra: normalizeDegrees(Math.atan2(y, x) * RAD) / 15, dec: Math.atan2(z, Math.hypot(x, y)) * RAD };
}

function sunLongitude(dateUTC: Date): number {
  const d = julianDate(dateUTC) - 2451545;
  const g = 357.529 + 0.98560028 * d;
  return normalizeDegrees(280.459 + 0.98564736 * d + 1.915 * sin(g) + 0.020 * sin(2 * g));
}

/** USNO low-precision geocentric solar coordinates, equinox of date. */
export function sunEquatorial(dateUTC: Date): Equatorial {
  return eclipticToEquatorial(sunLongitude(dateUTC), 0, 23.439 - 0.00000036 * (julianDate(dateUTC) - 2451545));
}

/** Schlyter lunar elements with major perturbations; geocentric, equinox of date. */
function moonEcliptic(dateUTC: Date): { longitude: number; latitude: number; distance: number } {
  const d = julianDate(dateUTC) - 2451543.5;
  const node = normalizeDegrees(125.1228 - 0.0529538083 * d);
  const peri = normalizeDegrees(318.0634 + 0.1643573223 * d);
  const m = normalizeDegrees(115.3654 + 13.0649929509 * d);
  const ms = normalizeDegrees(356.0470 + 0.9856002585 * d);
  const ls = ms + 282.9404 + 4.70935e-5 * d;
  const lm = m + peri + node;
  const elongation = lm - ls;
  const f = lm - node;
  const e = 0.0549;
  let anomaly = m * DEG;
  for (let i = 0; i < 5; i++) anomaly -= (anomaly - e * Math.sin(anomaly) - m * DEG) / (1 - e * Math.cos(anomaly));
  const x = Math.cos(anomaly) - e;
  const y = Math.sqrt(1 - e * e) * Math.sin(anomaly);
  const v = Math.atan2(y, x) * RAD;
  const distance = Math.hypot(x, y) * 60.2666;
  const xe = cos(node) * cos(v + peri) - sin(node) * sin(v + peri) * cos(5.1454);
  const ye = sin(node) * cos(v + peri) + cos(node) * sin(v + peri) * cos(5.1454);
  const ze = sin(v + peri) * sin(5.1454);
  const longitude = Math.atan2(ye, xe) * RAD
    - 1.274 * sin(m - 2 * elongation) + 0.658 * sin(2 * elongation) - 0.186 * sin(ms)
    - 0.059 * sin(2 * m - 2 * elongation) - 0.057 * sin(m - 2 * elongation + ms)
    + 0.053 * sin(m + 2 * elongation) + 0.046 * sin(2 * elongation - ms)
    + 0.041 * sin(m - ms) - 0.035 * sin(elongation) - 0.031 * sin(m + ms)
    - 0.015 * sin(2 * f - 2 * elongation) + 0.011 * sin(m - 4 * elongation);
  const latitude = Math.atan2(ze, Math.hypot(xe, ye)) * RAD
    - 0.173 * sin(f - 2 * elongation) - 0.055 * sin(m - f - 2 * elongation)
    - 0.046 * sin(m + f - 2 * elongation) + 0.033 * sin(f + 2 * elongation) + 0.017 * sin(2 * m + f);
  return { longitude: normalizeDegrees(longitude), latitude, distance: distance - 0.58 * cos(m - 2 * elongation) - 0.46 * cos(2 * elongation) };
}

export function moonEquatorial(dateUTC: Date): Equatorial {
  const moon = moonEcliptic(dateUTC);
  return eclipticToEquatorial(moon.longitude, moon.latitude, 23.4393 - 3.563e-7 * (julianDate(dateUTC) - 2451543.5));
}

/** Approximate lunar topocentric altitude, including horizontal parallax. */
export function moonHorizontal(dateUTC: Date, latitude: number, longitude: number): Horizontal {
  const moon = moonEquatorial(dateUTC);
  const horizontal = raDecToHorizontal(moon.ra, moon.dec, dateUTC, latitude, longitude);
  return { ...horizontal, altitude: horizontal.altitude - Math.asin(1 / moonEcliptic(dateUTC).distance) * RAD * cos(horizontal.altitude) };
}

/** Moon-Sun ecliptic longitude difference, 0..360°, waxing 0..180°. */
export function lunarPhase(dateUTC: Date): number {
  return normalizeDegrees(moonEcliptic(dateUTC).longitude - sunLongitude(dateUTC));
}
