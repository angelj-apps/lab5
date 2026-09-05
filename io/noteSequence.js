/**
 * @typedef {Object} NoteEvent
 * @property {number} pitch
 * @property {number} startTime
 * @property {number} endTime
 * @property {number} [velocity]
 */

/**
 * @typedef {Object} Composition
 * @property {NoteEvent[]} notes
 * @property {number} totalTime
 * @property {Object} [meta]
 */

/** @param {{ notes: NoteEvent[], totalTime?: number }} ns */
export function noteSequenceToEvents(ns) {
  const notes = [...ns.notes]
    .sort((a, b) => a.startTime - b.startTime || a.pitch - b.pitch)
    .map((n) => ({
      pitch: n.pitch,
      startTime: n.startTime,
      endTime: n.endTime,
      velocity: n.velocity ?? 80,
    }));
  const totalTime =
    ns.totalTime ?? (notes.length ? notes[notes.length - 1].endTime : 0);
  return { notes, totalTime };
}

/** Collapse simultaneous notes to a single voice (highest pitch per onset). */
export function toMonophonicEvents(events) {
  const sorted = [...events].sort(
    (a, b) => a.startTime - b.startTime || a.pitch - b.pitch
  );
  const ONSET_EPS = 0.03;
  /** @type {NoteEvent[]} */
  const mono = [];
  /** @type {NoteEvent[]} */
  let group = [];

  const flush = () => {
    if (!group.length) return;
    mono.push(group.reduce((best, n) => (n.pitch > best.pitch ? n : best)));
    group = [];
  };

  for (const note of sorted) {
    if (group.length && note.startTime - group[0].startTime > ONSET_EPS) {
      flush();
    }
    group.push(note);
  }
  flush();
  return mono;
}

/** @param {NoteEvent[]} events */
export function extractPitchSequence(events) {
  return toMonophonicEvents(events).map((e) => e.pitch);
}

/** @param {NoteEvent[]} events */
export function extractInterOnsetIntervals(events) {
  const sorted = [...events].sort((a, b) => a.startTime - b.startTime);
  const iois = [];
  for (let i = 1; i < sorted.length; i++) {
    iois.push(sorted[i].startTime - sorted[i - 1].startTime);
  }
  return iois;
}

/**
 * Map pitch tokens to NoteEvents using a rhythm template from training data.
 * @param {number[]} pitches
 * @param {NoteEvent[]} rhythmTemplate
 */
export function pitchesToEvents(pitches, rhythmTemplate) {
  const notes = [];
  let time = 0;
  const template = rhythmTemplate.length ? rhythmTemplate : [{ startTime: 0, endTime: 0.5 }];

  for (let i = 0; i < pitches.length; i++) {
    const ref = template[Math.min(i, template.length - 1)];
    const refNext =
      i + 1 < template.length
        ? template[i + 1]
        : { startTime: ref.endTime, endTime: ref.endTime + (ref.endTime - ref.startTime) };

    const duration = ref.endTime - ref.startTime;
    const ioi =
      i + 1 < template.length
        ? template[i + 1].startTime - ref.startTime
        : duration;

    notes.push({
      pitch: pitches[i],
      startTime: time,
      endTime: time + duration,
      velocity: ref.velocity ?? 80,
    });
    time += ioi;
  }

  return {
    notes,
    totalTime: notes.length ? notes[notes.length - 1].endTime : 0,
  };
}

/** @param {Composition} composition */
export function compositionLabel(composition) {
  return composition.meta?.label ?? 'Sequence';
}
