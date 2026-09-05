import { playComposition } from './synth.js';

/** @type {AudioContext|null} */
let audioCtx = null;
/** @type {number|null} */
let stopTimer = null;

export function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

export async function ensureAudioRunning() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  return ctx;
}

/** @param {import('../io/noteSequence.js').Composition} composition */
export async function scheduleComposition(composition) {
  stopPlayback();
  const ctx = await ensureAudioRunning();
  const endAt = playComposition(ctx, composition);
  stopTimer = window.setTimeout(() => {
    stopTimer = null;
  }, (endAt - ctx.currentTime) * 1000 + 100);
}

export function stopPlayback() {
  if (stopTimer !== null) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
}

export function disposeAudio() {
  stopPlayback();
  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
  }
}
