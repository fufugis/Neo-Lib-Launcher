export const LOUNGE_SAMPLE_GROUPS = Object.freeze({
  'Buttons': Object.freeze(['ButtonA', 'ButtonB', 'ButtonC', 'ButtonD', 'ButtonE', 'ButtonF']),
  'Clicks': Object.freeze(['ClickA', 'ClickB', 'ClickC', 'ClickD', 'ClickE']),
  'Reactions': Object.freeze(['complete1', 'complete2', 'cool1', 'cool2', 'damn1', 'damn2', 'explor1', 'explor2', 'extrovert1', 'extrovert2', 'fine1', 'fine2', 'hmm1', 'hmm2', 'mystic1', 'mystic2', 'neg1', 'neg2', 'ok1', 'ok2', 'oops1', 'oops2', 'pos1', 'pos2', 'under1', 'under2']),
});

export const LOUNGE_SAMPLE_ROLES = Object.freeze({
  move: 'Move between games',
  confirm: 'OK / button press',
  back: 'Back / close',
  explore: 'Open game details',
});

export const DEFAULT_LOUNGE_SAMPLES = Object.freeze({ move: 'ClickA', confirm: 'ButtonA', back: 'ClickB', explore: 'explor1' });
const sampleIds = new Set(Object.values(LOUNGE_SAMPLE_GROUPS).flat());

export function normalizeLoungeSamples(value) {
  const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return Object.fromEntries(Object.keys(LOUNGE_SAMPLE_ROLES).map(role => [role, input[role] === 'off' || sampleIds.has(input[role]) ? input[role] : DEFAULT_LOUNGE_SAMPLES[role]]));
}

// Analyze each decoded clip only when used. Quiet clips are never boosted;
// unusually loud peaks or sustained levels are attenuated individually.
export function loungeSampleAttenuation(buffer) {
  if (!buffer || !Number.isInteger(buffer.numberOfChannels) || buffer.numberOfChannels < 1) return 1;
  let peak = 0;
  let energy = 0;
  let count = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const samples = buffer.getChannelData(channel);
    for (let index = 0; index < samples.length; index += 1) {
      const value = samples[index];
      if (!Number.isFinite(value)) continue;
      peak = Math.max(peak, Math.abs(value));
      energy += value * value;
      count += 1;
    }
  }
  const rms = count ? Math.sqrt(energy / count) : 0;
  return Math.min(1, peak > 0 ? 0.85 / peak : 1, rms > 0 ? 0.18 / rms : 1);
}

export function loungeSampleStart(buffer) {
  if (!buffer || !Number.isFinite(buffer.sampleRate) || buffer.sampleRate <= 0 || !buffer.numberOfChannels) return 0;
  const samples = buffer.getChannelData(0);
  let peak = 0;
  for (let index = 0; index < samples.length; index += 1) peak = Math.max(peak, Math.abs(samples[index]));
  const threshold = Math.max(0.006, peak * 0.08);
  for (let index = 0; index < samples.length; index += 1) if (Math.abs(samples[index]) >= threshold) return index / buffer.sampleRate;
  return 0;
}
