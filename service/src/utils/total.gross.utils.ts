/**
 * Computes the value to send as `externalTotalGross` on `setCartTotalTax` /
 * `setOrderTotalTax`.
 *
 * commercetools re-applies a `totalPrice` cart discount to whatever gross is
 * supplied, scaling it by `totalPrice / (totalPrice + discountedAmount)`.
 * Sending `totalPrice + totalTax` directly therefore has the discount deducted
 * a second time, which pushes `totalGross` below `totalNet` and drives
 * `totalTax` negative - the shopper is undercharged by roughly the whole tax.
 *
 * Scaling the value up by the inverse ratio makes the platform's
 * re-application land on the intended gross. Measured against the platform for
 * both relative and absolute discounts; an absolute discount is re-applied
 * proportionally too, so subtracting a fixed amount does not work. See
 * Redmine #40596 and GitHub issue #31.
 *
 * `discountedAmount` is read from the incoming cart or order, where it is
 * already present. `discountedGrossAmount` is not usable here: it exists only
 * once a `taxedPrice` does, and it is derived from the value sent.
 *
 * @param totalPriceCentAmount `totalPrice` of the cart or order, discount already deducted
 * @param totalTaxCentAmount sum of the tax amounts applied to the individual lines
 * @param discountedAmountCentAmount `discountOnTotalPrice.discountedAmount`, 0 when absent
 */
export function externalTotalGrossCentAmount(
  totalPriceCentAmount: number,
  totalTaxCentAmount: number,
  discountedAmountCentAmount = 0
): number {
  const intendedGross = totalPriceCentAmount + totalTaxCentAmount;

  // No total-price discount, or nothing left to scale against: the platform
  // uses the supplied value as-is.
  if (discountedAmountCentAmount <= 0 || totalPriceCentAmount <= 0) {
    return intendedGross;
  }

  return Math.round(
    (intendedGross * (totalPriceCentAmount + discountedAmountCentAmount)) /
      totalPriceCentAmount
  );
}
