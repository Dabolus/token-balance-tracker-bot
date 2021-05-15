import { AddressBalance } from './query';

export const numberFormatter = new Intl.NumberFormat('en');
export const currencyFormatter = new Intl.NumberFormat('en', {
  style: 'currency',
  currency: 'USD',
});

export const computeTotal = (balances: AddressBalance[]) =>
  balances.reduce(
    (sum, { balance }) =>
      sum + balance.reduce((tokenSum, { value }) => tokenSum + value, 0),
    0,
  );
