import { Polymesh } from '@polymathnetwork/polymesh-sdk';

let api: Polymesh;

/**
 * @hidden
 */
export async function getClient(mnemonic?: string): Promise<Polymesh> {
  if (!api) {
    api = await Polymesh.connect({
      nodeUrl: 'wss://pmf.polymath.network',
      accountUri: mnemonic ?? '//Alice',
      middleware: {
        /* eslint-disable @typescript-eslint/no-non-null-assertion */
        link: process.env.MIDDLEWARE_LINK!,
        key: process.env.MIDDLEWARE_KEY!,
        /* eslint-enable @typescript-eslint/no-non-null-assertion */
      },
    });
  }

  return api;
}
