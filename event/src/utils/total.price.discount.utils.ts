import { DiscountOnTotalPrice } from '@commercetools/platform-sdk';
import { CreateTransactionModel } from 'avatax/lib/models/CreateTransactionModel';

/**
 * Passes a `totalPrice` cart discount on to Avalara as a document discount.
 *
 * Line item, custom line item and shipping discounts are already deducted from
 * the amounts sent per line. A `totalPrice` discount is not: commercetools keeps
 * it in `discountOnTotalPrice` and leaves the line totals untouched. Without
 * this, Avalara taxes the undiscounted amount and the shopper is overcharged by
 * the tax on the discount.
 *
 * Every line is flagged `discounted`, so Avalara spreads the discount over all
 * of them in proportion to their amounts. commercetools distributes the
 * discount across line items, custom line items and shipping the same way.
 *
 * @param taxDocument the document whose lines are already set
 * @param discountOnTotalPrice `discountOnTotalPrice` of the cart or order
 */
export function applyTotalPriceDiscount(
  taxDocument: CreateTransactionModel,
  discountOnTotalPrice: DiscountOnTotalPrice | undefined
): CreateTransactionModel {
  const discountedCentAmount =
    discountOnTotalPrice?.discountedAmount?.centAmount ?? 0;

  if (discountedCentAmount <= 0 || !taxDocument.lines?.length) {
    return taxDocument;
  }

  // Cent amounts are divided by 100, as for every other amount sent.
  taxDocument.discount = discountedCentAmount / 100;
  taxDocument.lines.forEach((line) => {
    line.discounted = true;
  });

  return taxDocument;
}
