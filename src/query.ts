import { GraphQLClient } from 'graphql-request';
import gql from 'graphql-tag';
import { EthereumNetwork, getSdk } from './generated/graphql';

const ETH_WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const ETH_USDT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const BSC_WBNB_ADDRESS = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';
const BSC_USDT_ADDRESS = '0x55d398326f99059ff775485246999027b3197955';

const client = new GraphQLClient('https://graphql.bitquery.io', {
  headers: {
    'x-api-key': process.env.BITQUERY_API_KEY,
  },
});
const sdk = getSdk(client);

export interface TokenBalance {
  name: string;
  symbol: string;
  balance: number;
  value: number;
}

export interface AddressBalance {
  address: string;
  balance: TokenBalance[];
}

export interface NetworkAddresses {
  main: string;
  usd: string;
}

const networksAddresses: Partial<Record<EthereumNetwork, NetworkAddresses>> = {
  [EthereumNetwork.ETHEREUM]: {
    main: ETH_WETH_ADDRESS,
    usd: ETH_USDT_ADDRESS,
  },
  [EthereumNetwork.BSC]: {
    main: BSC_WBNB_ADDRESS,
    usd: BSC_USDT_ADDRESS,
  },
};

export const getAddressesBalances = async (
  network: EthereumNetwork,
  addresses: string[],
): Promise<AddressBalance[]> => {
  if (!networksAddresses[network]) {
    throw new Error('Unsupported network');
  }

  const balances = await sdk.getAddressesBalances({
    network,
    addresses,
  });

  const tokens = Array.from(
    new Set(
      balances.ethereum?.address.flatMap(
        ({ balances }) =>
          balances
            ?.filter(
              ({ currency }) => currency?.address && currency?.address !== '-',
            )
            .map(({ currency }) => currency!.address!) || [],
      ) || [],
    ),
  );

  const [mainTokenValue, ...tokensEntries] = (await Promise.all([
    sdk
      .getTokenValue({
        network,
        inputToken: networksAddresses[network]!.main,
        outputToken: networksAddresses[network]!.usd,
      })
      .then(result => result.ethereum?.dexTrades?.[0].quotePrice),
    ...tokens.map(inputToken =>
      sdk
        .getTokenValue({
          network,
          inputToken,
          outputToken: networksAddresses[network]!.main,
        })
        .then(result => [
          inputToken,
          result.ethereum?.dexTrades?.[0].quotePrice,
        ]),
    ),
  ] as any)) as [
    number | null | undefined,
    ...[string, number | null | undefined][]
  ];

  if (!mainTokenValue) {
    throw new Error("Couldn't retrieve main token value");
  }

  const tokensValue = Object.fromEntries(tokensEntries);

  return (
    balances.ethereum?.address.map(({ balances }, index) => ({
      address: addresses[index],
      balance:
        balances
          ?.filter(
            ({ currency = null, value = null }) =>
              currency !== null && value !== null,
          )
          .sort((a, b) => {
            if (a.currency?.address === '-') {
              return -1;
            }

            if (b.currency?.address === '-') {
              return 1;
            }

            return 0;
          })
          .map(({ currency, value }) => ({
            name: currency!.name!,
            symbol: currency!.symbol,
            balance: value!,
            value:
              value! *
              mainTokenValue *
              (currency!.address === '-'
                ? 1
                : tokensValue[currency!.address!]!),
          })) || [],
    })) || []
  );
};
