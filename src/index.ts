import TelegramBot from 'node-telegram-bot-api';
import { EthereumNetwork } from './generated/graphql';
import { getAddressesBalances } from './query';
import { computeTotal, currencyFormatter, numberFormatter } from './utils';
import config from './config.json';

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true,
});

bot.onText(/^\/balance/, async msg => {
  const chatConfig = config[msg.chat.id.toString()];

  if (!chatConfig) {
    return;
  }

  bot.sendChatAction(msg.chat.id, 'typing');

  const allBalances = (
    await Promise.all(
      Object.entries(chatConfig).map(async ([network, addresses]) => {
        const balances = await getAddressesBalances(
          network as EthereumNetwork,
          addresses,
        );

        return balances.map(balance => ({
          ...balance,
          network: network as EthereumNetwork,
        }));
      }),
    )
  ).flat();

  await bot.sendMessage(
    msg.chat.id,
    `${allBalances
      .map(
        ({ network, address, balance }) =>
          `*Address 0x…${address.slice(
            -4,
          )} (${network.toUpperCase()}):*\n\n${balance
            .map(
              ({ name, symbol, balance: tokenBalance, value }) =>
                `*${name}:*\n\`${numberFormatter.format(
                  tokenBalance,
                )} ${symbol}\` (\`${currencyFormatter.format(value)}\`)`,
            )
            .join('\n\n')}`,
      )
      .join('\n\n---\n\n')}\n\n---\n\n*TOTAL:*\n\`${currencyFormatter.format(
      computeTotal(allBalances),
    )}\``.replace(/[,.()-]/g, '\\$&'),
    {
      parse_mode: 'MarkdownV2',
    },
  );
});
