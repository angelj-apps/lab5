const MIDI_A4 = 440;

/** @param {number} midi */
export function midiToFrequency(midi) {
  return MIDI_A4 * Math.pow(2, (midi - 69) / 12);
}

/**
 * @param {AudioContext} ctx
 * @param {number} pitch
 * @param {number} start
 * @param {number} end
 * @param {number} [velocity=80]
 */
export function playNote(ctx, pitch, start, end, velocity = 80) {
  if (!Number.isFinite(pitch) || !Number.isFinite(start) || !Number.isFinite(end)) {
    return;
  }

  const duration = Math.max(end - start, 0.05);
  end = start + duration;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.value = midiToFrequency(pitch);

  const peak = Math.max((velocity / 127) * 0.35, 0.001);
  const attack = Math.min(0.01, duration * 0.2);
  const release = Math.min(0.08, duration * 0.4);
  const sustainEnd = Math.min(Math.max(start + attack, end - release), end - 0.001);

  gain.gain.setValueAtTime(0.001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + attack);
  if (sustainEnd > start + attack) {
    gain.gain.setValueAtTime(peak, sustainEnd);
  }
  gain.gain.exponentialRampToValueAtTime(0.001, end);

  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(end + 0.05);
}

/** @param {AudioContext} ctx @param {import('../io/noteSequence.js').Composition} composition */
export function playComposition(ctx, composition) {
  const t0 = ctx.currentTime + 0.05;
  for (const note of composition.notes) {
    playNote(
      ctx,
      note.pitch,
      t0 + note.startTime,
      t0 + note.endTime,
      note.velocity ?? 80
    );
  }
  return t0 + composition.totalTime;
}
