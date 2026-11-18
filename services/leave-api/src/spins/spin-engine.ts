import { randomInt } from 'node:crypto';

export const BET_SIZES = [1, 5, 10, 25, 50] as const;
export type BetSize = (typeof BET_SIZES)[number];

export const SYMBOLS = ['Cherry', 'Bell', 'Bar', 'Seven'] as const;
export type Symbol = (typeof SYMBOLS)[number];

export type Reels = Symbol[][];

export type SpinOutcome = {
  bet: BetSize;
  reels: Reels;
  outcome: 'win' | 'loss';
  amountWon: number;
  winningCells: [number, number][];
};

const DIAGONAL: [number, number][] = [
  [0, 0],
  [1, 1],
  [2, 2],
];
const DIAGONAL_MULTIPLIER = 2;

export function isBetSize(value: unknown): value is BetSize {
  return BET_SIZES.some((size) => size === value);
}

export function evaluateSpin(bet: BetSize, reels: Reels): SpinOutcome {
  const [first, ...rest] = DIAGONAL.map(([row, col]) => reels[row][col]);
  if (rest.every((symbol) => symbol === first)) {
    return {
      bet,
      reels,
      outcome: 'win',
      amountWon: bet * DIAGONAL_MULTIPLIER,
      winningCells: DIAGONAL.map(([row, col]) => [row, col]),
    };
  }
  return { bet, reels, outcome: 'loss', amountWon: 0, winningCells: [] };
}

export function drawReels(random: (max: number) => number = (max) => randomInt(max)): Reels {
  return Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => SYMBOLS[random(SYMBOLS.length)]));
}
