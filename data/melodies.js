import { TWINKLE_TWINKLE } from './twinkle.js';

/** @typedef {{ id: string, name: string, sequence: { notes: import('../io/noteSequence.js').NoteEvent[], totalTime: number } }} Melody */

/** @type {Melody[]} */
export const MELODIES = [
  {
    id: 'twinkle',
    name: 'Twinkle Twinkle Little Star',
    sequence: TWINKLE_TWINKLE,
  },
  {
    id: 'mary',
    name: 'Mary Had a Little Lamb',
    sequence: {
      notes: [
        { pitch: 64, startTime: 0.0, endTime: 0.5 },
        { pitch: 62, startTime: 0.5, endTime: 1.0 },
        { pitch: 60, startTime: 1.0, endTime: 1.5 },
        { pitch: 62, startTime: 1.5, endTime: 2.0 },
        { pitch: 64, startTime: 2.0, endTime: 2.5 },
        { pitch: 64, startTime: 2.5, endTime: 3.0 },
        { pitch: 64, startTime: 3.0, endTime: 3.5 },
        { pitch: 62, startTime: 3.5, endTime: 4.0 },
        { pitch: 62, startTime: 4.0, endTime: 4.5 },
        { pitch: 62, startTime: 4.5, endTime: 5.0 },
        { pitch: 64, startTime: 5.0, endTime: 5.5 },
        { pitch: 67, startTime: 5.5, endTime: 6.0 },
        { pitch: 67, startTime: 6.0, endTime: 6.5 },
        { pitch: 64, startTime: 6.5, endTime: 7.0 },
        { pitch: 62, startTime: 7.0, endTime: 7.5 },
        { pitch: 60, startTime: 7.5, endTime: 8.0 },
        { pitch: 62, startTime: 8.0, endTime: 8.5 },
        { pitch: 64, startTime: 8.5, endTime: 9.0 },
        { pitch: 64, startTime: 9.0, endTime: 9.5 },
        { pitch: 64, startTime: 9.5, endTime: 10.0 },
        { pitch: 62, startTime: 10.0, endTime: 10.5 },
        { pitch: 62, startTime: 10.5, endTime: 11.0 },
        { pitch: 64, startTime: 11.0, endTime: 11.5 },
        { pitch: 62, startTime: 11.5, endTime: 12.0 },
        { pitch: 60, startTime: 12.0, endTime: 12.5 },
      ],
      totalTime: 12.5,
    },
  },
  {
    id: 'tetris',
    name: 'Tetris (Korobeiniki)',
    sequence: (() => {
      const pitches = [
        76, 71, 72, 74, 72, 71, 69,
        69, 72, 76, 74, 72, 71,
        71, 72, 74, 76,
        72, 69, 69,
      ];
      const beat = 0.36;
      /** @type {import('../io/noteSequence.js').NoteEvent[]} */
      const notes = [];
      let time = 0;
      for (let i = 0; i < pitches.length; i++) {
        const dur = i === pitches.length - 1 ? beat * 2.5 : beat;
        notes.push({
          pitch: pitches[i],
          startTime: time,
          endTime: time + dur,
        });
        time += dur;
      }
      return { notes, totalTime: time };
    })(),
  },
  {
    id: 'happy',
    name: 'Happy Birthday',
    sequence: {
      notes: [
        { pitch: 60, startTime: 0.0, endTime: 0.4 },
        { pitch: 60, startTime: 0.4, endTime: 0.8 },
        { pitch: 62, startTime: 0.8, endTime: 1.4 },
        { pitch: 60, startTime: 1.4, endTime: 2.0 },
        { pitch: 65, startTime: 2.0, endTime: 2.6 },
        { pitch: 64, startTime: 2.6, endTime: 3.6 },
        { pitch: 60, startTime: 3.6, endTime: 4.0 },
        { pitch: 60, startTime: 4.0, endTime: 4.4 },
        { pitch: 62, startTime: 4.4, endTime: 5.0 },
        { pitch: 60, startTime: 5.0, endTime: 5.6 },
        { pitch: 67, startTime: 5.6, endTime: 6.2 },
        { pitch: 65, startTime: 6.2, endTime: 7.2 },
        { pitch: 60, startTime: 7.2, endTime: 7.6 },
        { pitch: 60, startTime: 7.6, endTime: 8.0 },
        { pitch: 72, startTime: 8.0, endTime: 8.8 },
        { pitch: 69, startTime: 8.8, endTime: 9.6 },
        { pitch: 65, startTime: 9.6, endTime: 10.0 },
        { pitch: 64, startTime: 10.0, endTime: 10.4 },
        { pitch: 62, startTime: 10.4, endTime: 11.2 },
      ],
      totalTime: 11.2,
    },
  },
];

/** @param {string} id */
export function getMelody(id) {
  return MELODIES.find((m) => m.id === id) ?? MELODIES[0];
}

export const DEFAULT_MELODY_ID = 'twinkle';
