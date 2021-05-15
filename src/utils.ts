import fs from 'fs';
import path from 'path';
import { compile } from 'handlebars';
import { AddressBalance } from './query';

export const configureFormatters = (locale: string, currency: string) => ({
  numberFormatter: new Intl.NumberFormat(locale),
  currencyFormatter: new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }),
});

export const computeTotal = (balances: AddressBalance[]) =>
  balances.reduce(
    (sum, { balance }) =>
      sum + balance.reduce((tokenSum, { value }) => tokenSum + value, 0),
    0,
  );

export const templatePath = path.resolve(
  __dirname,
  process.env.MESSAGE_TEMPLATE_PATH || '../templates/default.hbs',
);

export interface TemplateResultData {
  address: string;
  network: string;
  balance: {
    name: string;
    symbol: string;
    balance: string;
    value: string;
  }[];
}

export interface TemplateData {
  result: TemplateResultData[];
  total: string;
}

export const getMarkdown = compile<TemplateData>(
  fs.readFileSync(templatePath, 'utf8'),
);
