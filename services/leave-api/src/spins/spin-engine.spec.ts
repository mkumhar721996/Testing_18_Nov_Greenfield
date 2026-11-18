import { describe, expect, it } from 'vitest';
import { BET_SIZES, SYMBOLS, drawReels, evaluateSpin, isBetSize, type Reels } from './spin-engine';

describe('spin engine', () => {
  it('offers only the bet sizes 1, 5, 10, 25 and 50', () => {
    expect(BET_SIZES).toEqual([1, 5, 10, 25, 50]);
    expect(isBetSize(25)).toBe(true);
    expect(isBetSize(2)).toBe(false);
    expect(isBetSize('25')).toBe(false);
  });

  it('draws a 3x3 grid of known symbols from the injected source', () => {
    const reels = drawReels(() => 0);
    expect(reels).toHaveLength(3);
    reels.forEach((row) => expect(row).toHaveLength(3));
    expect(reels.flat().every((s) => SYMBOLS.includes(s))).toBe(true);
  });

  it('pays 2x the bet for a matching diagonal', () => {
    const reels: Reels = [
      ['Cherry', 'Bell', 'Cherry'],
      ['Bar', 'Cherry', 'Seven'],
      ['Bell', 'Bar', 'Cherry'],
    ];
    expect(evaluateSpin(25, reels)).toEqual({
      bet: 25,
      reels,
      outcome: 'win',
      amountWon: 50,
      winningCells: [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
    });
  });

  it('loses with nothing won when the diagonal does not match', () => {
    const reels: Reels = [
      ['Bell', 'Seven', 'Bar'],
      ['Cherry', 'Bar', 'Seven'],
      ['Bar', 'Cherry', 'Bell'],
    ];
    expect(evaluateSpin(25, reels)).toMatchObject({ outcome: 'loss', amountWon: 0, winningCells: [] });
  });
});
