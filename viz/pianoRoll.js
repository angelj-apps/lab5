/** @param {CanvasRenderingContext2D} ctx */
function drawGrid(ctx, width, height, minPitch, maxPitch, totalTime) {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);

  const pitchRange = maxPitch - minPitch + 1;
  const rowH = height / pitchRange;
  const pxPerSec = width / Math.max(totalTime, 0.1);

  ctx.strokeStyle = '#2a2a4a';
  ctx.lineWidth = 1;
  for (let p = minPitch; p <= maxPitch; p++) {
    const y = height - (p - minPitch + 1) * rowH;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  for (let t = 0; t <= totalTime; t += 0.5) {
    const x = t * pxPerSec;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  return { rowH, pxPerSec, pitchRange };
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {import('../io/noteSequence.js').Composition|null} training
 * @param {import('../io/noteSequence.js').Composition|null} generated
 */
export function drawPianoRoll(canvas, training, generated) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  const allNotes = [
    ...(training?.notes ?? []),
    ...(generated?.notes ?? []),
  ];

  if (allNotes.length === 0) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#888';
    ctx.font = '14px sans-serif';
    ctx.fillText('Train and generate to see the piano roll.', 16, 28);
    return;
  }

  const minPitch = Math.min(...allNotes.map((n) => n.pitch)) - 2;
  const maxPitch = Math.max(...allNotes.map((n) => n.pitch)) + 2;
  const totalTime = Math.max(
    training?.totalTime ?? 0,
    generated?.totalTime ?? 0,
    0.1
  );

  const splitX = generated ? width * 0.45 : width;
  const trainW = generated ? splitX - 8 : width;
  const genW = width - splitX - 8;

  ctx.clearRect(0, 0, width, height);

  if (training) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, trainW, height);
    ctx.clip();
    const grid = drawGrid(ctx, trainW, height, minPitch, maxPitch, training.totalTime);
    drawNotes(ctx, training.notes, minPitch, grid, '#6c9eff');
    ctx.restore();

    ctx.fillStyle = '#ccc';
    ctx.font = '12px sans-serif';
    ctx.fillText('Training', 8, 16);
  }

  if (generated) {
    ctx.save();
    ctx.translate(splitX + 8, 0);
    ctx.beginPath();
    ctx.rect(0, 0, genW, height);
    ctx.clip();
    const grid = drawGrid(ctx, genW, height, minPitch, maxPitch, generated.totalTime);
    drawNotes(ctx, generated.notes, minPitch, grid, '#ff8a6c');
    ctx.restore();

    ctx.fillStyle = '#ccc';
    ctx.font = '12px sans-serif';
    ctx.fillText('Generated', splitX + 16, 16);
  }

  if (training && generated) {
    ctx.strokeStyle = '#444';
    ctx.beginPath();
    ctx.moveTo(splitX + 4, 0);
    ctx.lineTo(splitX + 4, height);
    ctx.stroke();
  }
}

/** @param {CanvasRenderingContext2D} ctx @param {import('../io/noteSequence.js').NoteEvent[]} notes */
function drawNotes(ctx, notes, minPitch, grid, color) {
  const { rowH, pxPerSec } = grid;
  ctx.fillStyle = color;
  for (const n of notes) {
    const x = n.startTime * pxPerSec;
    const w = Math.max(2, (n.endTime - n.startTime) * pxPerSec - 1);
    const y = ctx.canvas.height - (n.pitch - minPitch + 1) * rowH + 1;
    ctx.fillRect(x, y, w, rowH - 2);
  }
}
