import { LocalSigningManager } from '@polymeshassociation/local-signing-manager';
import { Polymesh } from '@polymeshassociation/polymesh-sdk';

let api: Polymesh;

/**
 * @hidden
 */
export async function getClient(mnemonics?: string | string[]): Promise<Polymesh> {
  let localSigningManager: LocalSigningManager;
  if (!mnemonics) {
    localSigningManager = await LocalSigningManager.create({
      accounts: [{ uri: '//Alice' }],
    });
  } else if (typeof mnemonics === 'string') {
    localSigningManager = await LocalSigningManager.create({
      accounts: [{ mnemonic: mnemonics }],
    });
  } else {
    localSigningManager = await LocalSigningManager.create({
      accounts: mnemonics.map(mnemonic => ({ mnemonic })),
    });
  }

  if (!api) {
    api = await Polymesh.connect({
      /* eslint-disable @typescript-eslint/no-non-null-assertion */
      nodeUrl: process.env.POLYMESH_NODE_URL!,
      middlewareV2: {
        link: process.env.MIDDLEWARE_LINK!,
        key: process.env.MIDDLEWARE_KEY!,
        /* eslint-enable @typescript-eslint/no-non-null-assertion */
      },
      signingManager: localSigningManager,
    });
  }

  return api;
}
