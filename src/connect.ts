import { LocalSigningManager } from '@polymeshassociation/local-signing-manager';
import { Polymesh } from '@polymeshassociation/polymesh-sdk';

import { config } from '~/config';

const { nodeUrl } = config;

let sdk: Polymesh;

/**
 * This function shows how to create a Polymesh SDK instance configured with `//Alice` as the default signing key
 */
export async function getPolymeshSdk(): Promise<Polymesh> {
  // Note, different signing managers can be found [here](https://github.com/PolymeshAssociation/signing-managers#projects)
  const signingManager = await LocalSigningManager.create({
    accounts: [{ uri: '//Alice' }],
  });

  if (!sdk) {
    sdk = await Polymesh.connect({
      nodeUrl,
      signingManager,
    });
  }

  return sdk;
}
