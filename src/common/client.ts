import { LocalSigningManager } from '@polymathnetwork/local-signing-manager';
import { Polymesh } from '@polymathnetwork/polymesh-sdk';

let api: Polymesh;

/**
 * @hidden
 */
export async function getClient(mnemonic?: string): Promise<Polymesh> {
  const localSigningManager = await LocalSigningManager.create({
    accounts: [{ mnemonic: mnemonic || '//Alice' }],
  });

  if (!api) {
    api = await Polymesh.connect({
      /* eslint-disable @typescript-eslint/no-non-null-assertion */
      nodeUrl: process.env.POLYMESH_NODE_URL!,
      middleware: {
        link: process.env.MIDDLEWARE_LINK!,
        key: process.env.MIDDLEWARE_KEY!,
        /* eslint-enable @typescript-eslint/no-non-null-assertion */
      },
      signingManager: localSigningManager,
    });
  }

  return api;
}
