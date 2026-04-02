/**
 * Toast copy when a subscription is created from the hub modal.
 * Multi-product: first product name + count of additional line items.
 */
export function subscriptionCreatedSuccessMessage(args: {
  customerName: string;
  productNames: string[];
}): string {
  const customer =
    args.customerName.trim().length > 0 ? args.customerName.trim() : "Customer";
  const names = args.productNames.map((n) => n.trim()).filter((n) => n.length > 0);
  const productName = names[0] ?? "Product";

  if (names.length <= 1) {
    return `Subscription for ${customer} with ${productName} created`;
  }

  const productCountMinusOne = names.length - 1;
  return `Subscription for ${customer} with ${productName} and ${productCountMinusOne} more created`;
}
