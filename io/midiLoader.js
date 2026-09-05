import { noteSequenceToEvents, toMonophonicEvents } from './noteSequence.js';

/** @returns {typeof import('@magenta/music')|null} */
function getMagenta() {
  return /** @type {typeof globalThis & { mm?: typeof import('@magenta/music') }} */ (
    globalThis
  ).mm ?? null;
}

function getBlobToNoteSequence(mm) {
  return mm.blobToNoteSequence ?? mm.sequence?.blobToNoteSequence ?? null;
}

/**
 * Parse a MIDI file with @magenta/music (parse only — no generation).
 * @param {File} file
 */
export async function loadMidiFile(file) {
  const mm = getMagenta();
  const blobToNoteSequence = mm ? getBlobToNoteSequence(mm) : null;
  if (!blobToNoteSequence) {
    throw new Error(
      'Magenta.js failed to load. Hard-refresh (Ctrl+Shift+R). If it persists, disable ad blockers for this page — they sometimes block cdn.jsdelivr.net.'
    );
  }

  const buffer = await file.arrayBuffer();
  const ns = await blobToNoteSequence(
    new Blob([buffer], { type: file.type || 'audio/midi' })
  );

  const raw = noteSequenceToEvents({
    notes: (ns.notes ?? [])
      .filter((n) => !n.isDrum && Number.isFinite(n.pitch) && n.pitch >= 0)
      .map((n) => ({
        pitch: n.pitch,
        startTime: n.startTime ?? 0,
        endTime: n.endTime ?? (n.startTime ?? 0) + 0.25,
        velocity: n.velocity ?? 80,
      })),
    totalTime: ns.totalTime,
  });

  if (raw.notes.length === 0) {
    throw new Error('No melodic notes found in that MIDI file.');
  }

  const monoNotes = toMonophonicEvents(raw.notes);
  const trimmed =
    ns.totalTime && ns.totalTime > 0
      ? monoNotes.filter((n) => n.startTime < ns.totalTime + 0.01)
      : monoNotes;

  if (trimmed.length === 0) {
    throw new Error('Could not extract a monophonic melody from that MIDI file.');
  }

  return {
    notes: trimmed,
    totalTime: trimmed[trimmed.length - 1].endTime,
    meta: {
      label: `${file.name} (MIDI)`,
      source: 'midi',
      fileName: file.name,
      rawNoteCount: raw.notes.length,
      monoNoteCount: trimmed.length,
    },
  };
}

export function isMagentaReady() {
  const mm = getMagenta();
  return Boolean(mm && getBlobToNoteSequence(mm));
}
