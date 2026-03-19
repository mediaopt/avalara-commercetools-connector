import { describe, expect, it } from '@jest/globals';

function calcRate(taxCalculated: number, totalAmount: number): number {
  return Math.round((10000 * taxCalculated) / totalAmount) / 10000;
}

describe('calcRate', () => {
  it('should round to 4 decimal places', () => {
    expect(calcRate(7, 100)).toBe(0.07);
    expect(calcRate(1, 3)).toBeCloseTo(0.3333, 4);
    expect(calcRate(2, 3)).toBeCloseTo(0.6667, 4);
    expect(calcRate(1942, 38776)).toBeCloseTo(0.0501, 4);
  });
});
