import { describe, expect, it } from '@jest/globals';
import { externalTotalGrossCentAmount } from '../src/utils/total.gross.utils';

// Figures measured against commercetools (avalara-demo), one setCartTotalTax
// call per freshly created cart. See Redmine #40596 / GitHub issue #31.
describe('externalTotalGrossCentAmount', () => {
  it('is unchanged when there is no total-price discount', () => {
    expect(externalTotalGrossCentAmount(17425, 2150, 0)).toBe(19575);
    expect(externalTotalGrossCentAmount(17425, 2150)).toBe(19575);
  });

  it('scales up for a relative total-price discount', () => {
    // totalPrice 174.25 after a 15% discount of 30.75, tax 21.50.
    // Sending 195.75 returned gross 166.39 and tax -7.86; sending 230.29
    // returned gross 195.75 and tax 21.50.
    expect(externalTotalGrossCentAmount(17425, 2150, 3075)).toBe(23029);
  });

  it('scales up for an absolute total-price discount', () => {
    // totalPrice 175.00 after a flat 30.00 discount, tax 21.50.
    // An absolute discount is re-applied proportionally too, so a fixed
    // add-back would be wrong here.
    expect(externalTotalGrossCentAmount(17500, 2150, 3000)).toBe(23019);
  });

  it('round-trips through the platform formula', () => {
    // The platform computes: gross = sent * totalPrice / (totalPrice + discountedAmount)
    for (const [totalPrice, tax, discount] of [
      [17425, 2150, 3075],
      [17500, 2150, 3000],
      [10000, 1000, 5000],
      [9999, 777, 1],
    ]) {
      const sent = externalTotalGrossCentAmount(totalPrice, tax, discount);
      const gross = Math.round((sent * totalPrice) / (totalPrice + discount));
      expect(gross).toBeCloseTo(totalPrice + tax, -1);
    }
  });

  it('does not divide by zero on a fully discounted total', () => {
    expect(externalTotalGrossCentAmount(0, 0, 5000)).toBe(0);
    expect(externalTotalGrossCentAmount(0, 150, 5000)).toBe(150);
  });

  it('ignores a negative or missing discounted amount', () => {
    expect(externalTotalGrossCentAmount(17425, 2150, -100)).toBe(19575);
    expect(externalTotalGrossCentAmount(17425, 2150, undefined)).toBe(19575);
  });
});
