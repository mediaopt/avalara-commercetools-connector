import { CartDiscountReference, Money } from '@commercetools/platform-sdk';
import { LineItemModel } from 'avatax/lib/models/LineItemModel';
import { getDiscountInfo } from '../../client/data.client';

export async function discount(
  item: {
    discount: CartDiscountReference;
    discountedAmount: Money;
  },
  discountsInfo: Array<{
    id: string;
    name: string;
    taxCode: string;
  }>
): Promise<LineItemModel> {
  const lineItem = new LineItemModel();
  const discountInfo = discountsInfo.find((x) => x.id === item.discount.id);
  lineItem.quantity = 1;
  lineItem.amount = -item.discountedAmount.centAmount / 100;
  lineItem.itemCode = 'Discount';
  lineItem.description = discountInfo?.name as string;
  lineItem.taxIncluded = false;
  lineItem.taxCode = discountInfo?.taxCode as string;
  return lineItem;
}
