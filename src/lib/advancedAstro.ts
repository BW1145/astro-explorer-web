import { clamp, stellarLifetime, luminosity, transitDepth } from './astro';

/** Teaching HR population; shared birth time, no binary stars or metallicity spread. */
export function clusterTurnoffMass(ageGyr: number): number { return (10 / ageGyr) ** .4; }
export function clusterPopulation(ageGyr: number) {
  return Array.from({ length: 116 }, (_, i) => {
    const mass = .3 * (15 / .3) ** (i / 115);
    const lifetime = stellarLifetime(mass);
    const elapsed = ageGyr / lifetime;
    const stage = elapsed <= 1 ? 'main-sequence' : elapsed < 1.16 ? 'giant' : 'remnant';
    // Remnants are counted separately, not assigned a common (unphysical) HR position.
    const temperature = stage === 'main-sequence' ? 5772 * mass ** .5 : stage === 'giant' ? 4500 - 1000 * Math.min(1, (elapsed - 1) / .16) : 0;
    const light = stage === 'main-sequence' ? luminosity(mass) : stage === 'giant' ? luminosity(mass) * (2 + 30 * (elapsed - 1) / .16) : 0;
    return { mass, lifetime, stage, temperature, luminosity: light };
  });
}

const gaussian = (x: number, centre: number, width: number) => Math.exp(-.5 * ((x - centre) / width) ** 2);
/** Synthetic Na/K/H2O representative bands, never a measured exoplanet spectrum. */
export function atmosphericBand(wavelengthNm: number): number {
  return .9 * gaussian(wavelengthNm, 589, 10) + .7 * gaussian(wavelengthNm, 770, 15) + 1.4 * gaussian(wavelengthNm, 940, 28);
}
export function transmissionDepth(wavelengthNm: number, radiusEarth: number, atmosphere: boolean, strength = 1): number {
  const effectiveRadius = radiusEarth + (atmosphere ? .15 * strength * atmosphericBand(wavelengthNm) : 0);
  return transitDepth(effectiveRadius);
}

/** Two antipodal beams, fixed observer. Angles measured from the spin axis. */
export function pulsarSignal(phaseDegrees: number, viewAngle: number, beamTilt: number): number {
  const r = Math.PI / 180;
  const dot = Math.sin(viewAngle * r) * Math.sin(beamTilt * r) * Math.cos(phaseDegrees * r) + Math.cos(viewAngle * r) * Math.cos(beamTilt * r);
  const angle = Math.acos(clamp(Math.abs(dot), 0, 1)) / r;
  return Math.exp(-.5 * (angle / 7) ** 4);
}
/** Circular equal-mass inspiral scaling. Separation/time are normalized teaching units. */
export function inspiralState(progress: number) {
  const separation = 1 - .8 * clamp(progress, 0, 1);
  const orbitalFrequency = separation ** -1.5;
  const waveFrequency = 2 * orbitalFrequency;
  const amplitude = 1 / separation;
  // Integral of orbital frequency over the normalized progress coordinate.
  const phase = Math.PI * 12 * 2 / .8 * (separation ** -.5 - 1);
  return { separation, orbitalFrequency, waveFrequency, amplitude, phase, strain: amplitude * Math.sin(2 * phase) };
}

/** Flat FLRW luminosity distance, Mpc; fixed H0=70 by default, radiation neglected at z≤1.5. */
export function luminosityDistance(z: number, omegaMatter: number, H0 = 70): number {
  if (z < 0 || omegaMatter < 0 || omegaMatter > 1 || H0 <= 0) throw new RangeError('Invalid flat cosmology');
  const n = 512, step = z / n;
  const integrand = (x: number) => 1 / Math.sqrt(omegaMatter * (1 + x) ** 3 + 1 - omegaMatter);
  let sum = integrand(0) + integrand(z);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * integrand(i * step);
  return 299792.458 / H0 * (1 + z) * sum * step / 3;
}
export const supernovaModulus = (z: number, omegaMatter: number): number => 5 * Math.log10(luminosityDistance(z, omegaMatter)) + 25;
export const syntheticSupernovaModulus = (z: number): number => supernovaModulus(z, .3) + .045 * Math.sin((z - .035) / (1.41 / 21) * 2.39);
export const syntheticSupernovae = Array.from({ length: 22 }, (_, i) => {
  const z = .035 + i * 1.41 / 21;
  return { z, mu: syntheticSupernovaModulus(z), uncertainty: .09 };
});
