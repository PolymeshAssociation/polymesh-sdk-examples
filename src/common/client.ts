import { Polymesh } from '@polymathnetwork/polymesh-sdk';

let api: Polymesh;

export async function getClient(mnemonic?: string): Promise<Polymesh> {
  if (!api) {
    api = await Polymesh.connect({
      nodeUrl: 'wss://pmf.polymath.network',
      accountUri: mnemonic ?? '//Alice',
      middleware: {
        link: process.env.MIDDLEWARE_LINK!,
        key: process.env.MIDDLEWARE_KEY!,
      },
    });
  }

  return api;
}
