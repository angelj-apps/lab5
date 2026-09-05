import { DEFAULT_MELODY_ID, getMelody, MELODIES } from './data/melodies.js?v=6';
import { MarkovChain } from './generator/markovChain.js';
import { loadMidiFile, isMagentaReady } from './io/midiLoader.js';
import {
  extractPitchSequence,
  noteSequenceToEvents,
  pitchesToEvents,
} from './io/noteSequence.js';
import { scheduleComposition, stopPlayback } from './playback/scheduler.js';
import { drawPianoRoll } from './viz/pianoRoll.js';

/** @type {import('./io/noteSequence.js').Composition} */
let trainingComposition = buildTrainingComposition(DEFAULT_MELODY_ID);
/** @type {number[]} */
let trainingPitches = extractPitchSequence(trainingComposition.notes);
/** @type {{ notes: import('./io/noteSequence.js').NoteEvent[], totalTime: number }} */
let trainingEvents = noteSequenceToEvents(getMelody(DEFAULT_MELODY_ID).sequence);
/** @type {'builtin'|'midi'} */
let trainingSource = 'builtin';

/** @type {MarkovChain|null} */
let chain = null;
/** @type {import('./io/noteSequence.js').Composition|null} */
let lastGenerated = null;

const els = {
  melody: document.getElementById('melody'),
  midiUpload: document.getElementById('midiUpload'),
  midiFileName: document.getElementById('midiFileName'),
  order: document.getElementById('order'),
  orderVal: document.getElementById('orderVal'),
  length: document.getElementById('length'),
  temperature: document.getElementById('temperature'),
  tempVal: document.getElementById('tempVal'),
  seedDisplay: document.getElementById('seedDisplay'),
  contextCount: document.getElementById('contextCount'),
  status: document.getElementById('status'),
  melodyListHint: document.getElementById('melodyListHint'),
  pianoRoll: document.getElementById('pianoRoll'),
  playTrainingBtn: document.getElementById('playTrainingBtn'),
  trainBtn: document.getElementById('trainBtn'),
  generateBtn: document.getElementById('generateBtn'),
  stopBtn: document.getElementById('stopBtn'),
};

/** @param {string} melodyId */
function buildTrainingComposition(melodyId) {
  const melody = getMelody(melodyId);
  const events = noteSequenceToEvents(melody.sequence);
  return {
    ...events,
    meta: { label: `${melody.name} (training)`, melodyId: melody.id, source: 'builtin' },
  };
}

function getTrainingLabel() {
  if (trainingSource === 'midi') {
    return trainingComposition.meta?.fileName ?? 'Custom MIDI';
  }
  return getActiveMelody().name;
}

function getActiveMelody() {
  return getMelody(els.melody.value);
}

function updatePlayTrainingLabel() {
  els.playTrainingBtn.textContent = `Play Training (${getTrainingLabel()})`;
}

function setTrainingMelody(melodyId) {
  trainingSource = 'builtin';
  const melody = getMelody(melodyId);
  trainingEvents = noteSequenceToEvents(melody.sequence);
  trainingComposition = buildTrainingComposition(melodyId);
  trainingPitches = extractPitchSequence(trainingComposition.notes);
  lastGenerated = null;
  els.midiUpload.value = '';
  els.midiFileName.textContent = '';
  updatePlayTrainingLabel();
}

/** @param {import('./io/noteSequence.js').Composition} composition */
function setTrainingFromMidi(composition) {
  trainingSource = 'midi';
  trainingComposition = composition;
  trainingEvents = { notes: composition.notes, totalTime: composition.totalTime };
  trainingPitches = extractPitchSequence(composition.notes);
  lastGenerated = null;
  updatePlayTrainingLabel();
}

function setStatus(msg, isError = false) {
  els.status.textContent = msg;
  els.status.style.color = isError ? '#c44' : '#333';
}

function refreshLabels() {
  els.orderVal.textContent = els.order.value;
  els.tempVal.textContent = Number(els.temperature.value).toFixed(1);
}

function refreshPianoRoll() {
  drawPianoRoll(els.pianoRoll, trainingComposition, lastGenerated);
}

function trainChain() {
  const order = Number(els.order.value);
  const label = getTrainingLabel();
  try {
    chain = new MarkovChain(order);
    chain.train(trainingPitches);
    const seed = chain.defaultSeed(trainingPitches);
    els.seedDisplay.textContent = `[${seed.join(', ')}]`;
    els.contextCount.textContent = String(chain.getContextCount());
    const monoHint =
      trainingSource === 'midi' && trainingComposition.meta?.rawNoteCount
        ? ` · ${trainingComposition.meta.monoNoteCount} mono notes from ${trainingComposition.meta.rawNoteCount} MIDI notes`
        : '';
    setStatus(
      `Trained order-${order} chain on ${label} (${chain.getContextCount()} contexts)${monoHint}.`
    );
    refreshPianoRoll();
  } catch (err) {
    chain = null;
    setStatus(err.message, true);
  }
}

function onMelodyChange() {
  stopPlayback();
  setTrainingMelody(els.melody.value);
  trainChain();
}

async function onMidiUpload() {
  const file = els.midiUpload.files?.[0];
  if (!file) return;

  stopPlayback();
  els.midiFileName.textContent = file.name;

  try {
    const composition = await loadMidiFile(file);
    setTrainingFromMidi(composition);
    trainChain();
    setStatus(
      `Loaded ${file.name} — using highest pitch at each onset for monophonic training.`
    );
  } catch (err) {
    els.midiFileName.textContent = '';
    els.midiUpload.value = '';
    setStatus(err.message, true);
  }
}

async function playTraining() {
  try {
    await scheduleComposition(trainingComposition);
    setStatus(`Playing training sequence (${getTrainingLabel()}).`);
  } catch (err) {
    setStatus(err.message, true);
  }
}

async function generateAndPlay() {
  if (!chain) {
    setStatus('Train the chain first.', true);
    return;
  }

  const length = Number(els.length.value);
  const temperature = Number(els.temperature.value);

  try {
    const pitches = chain.generate(length, null, temperature);
    lastGenerated = {
      ...pitchesToEvents(pitches, trainingEvents.notes),
      meta: { label: 'Generated', pitches, temperature },
    };
    refreshPianoRoll();
    await scheduleComposition(lastGenerated);
    setStatus(
      `Generated ${length} notes (T=${temperature}). Pitches: [${pitches.join(', ')}]`
    );
  } catch (err) {
    setStatus(err.message, true);
  }
}

function populateMelodySelect() {
  els.melody.innerHTML = '';
  for (const melody of MELODIES) {
    const option = document.createElement('option');
    option.value = melody.id;
    option.textContent = melody.name;
    els.melody.appendChild(option);
  }
  els.melody.value = DEFAULT_MELODY_ID;

  const magentaReady = isMagentaReady();
  els.melodyListHint.textContent = [
    `${MELODIES.length} built-in melodies`,
    magentaReady
      ? 'MIDI upload ready'
      : 'MIDI upload unavailable — Magenta.js did not load (try Ctrl+Shift+R or disable ad blocker)',
  ].join(' · ');
}

function init() {
  populateMelodySelect();
  setTrainingMelody(DEFAULT_MELODY_ID);
  refreshLabels();
  refreshPianoRoll();
  trainChain();

  els.melody.addEventListener('change', onMelodyChange);
  els.midiUpload.addEventListener('change', onMidiUpload);
  els.order.addEventListener('input', () => {
    refreshLabels();
    trainChain();
  });
  els.temperature.addEventListener('input', refreshLabels);
  els.playTrainingBtn.addEventListener('click', playTraining);
  els.trainBtn.addEventListener('click', trainChain);
  els.generateBtn.addEventListener('click', generateAndPlay);
  els.stopBtn.addEventListener('click', () => {
    stopPlayback();
    setStatus('Stopped.');
  });
}

init();
