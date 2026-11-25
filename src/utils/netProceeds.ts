export interface NetProceedsInputs {
  price: number;
  payoff: number;
  commission: number;
  closing: number;
  credits: number;
}

/** Estimate proceeds using the existing percentage and dollar deductions. */
export function calculateNetProceeds({ price, payoff, commission, closing, credits }: NetProceedsInputs) {
  const items = [
    { label: 'Mortgage payoff', value: payoff },
    { label: `Commission (${commission}%)`, value: (price * commission) / 100 },
    { label: `Title, attorney & closing (${closing}%)`, value: (price * closing) / 100 },
    { label: 'Repairs or buyer credits', value: credits },
  ];
  const costs = items.reduce((sum, item) => sum + item.value, 0);
  const net = price - costs;
  if (![costs, net, ...items.map((item) => item.value)].every(Number.isFinite)) return null;
  return { items, costs, net };
}
