import { getClient } from '~/common/privateClient';

/* 
  This script showcases Confidential Account related functionality. It:
    - it will add a public key to a given account 
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n');
  const account = process.argv[2];
  const publicKey = process.argv[3];
  if (!account || !publicKey) {
    throw new Error('Please specify both account and public key for creating confidential account');
  }
  const api = await getClient(process.env[account]);

  const signingIdentity = await api.getSigningIdentity();
  if (!signingIdentity) {
    throw new Error(`Account information not found for ${account}`);
  }
  console.log(`\n💡 Adding a public key - ${publicKey} to ${account} DID - ${signingIdentity.did}`);

  const createTx = await api.confidentialAccounts.createConfidentialAccount({ publicKey });

  const createdConfidentialAccount = await createTx.run();

  console.log(
    `\n✅ New confidential account created with key ${createdConfidentialAccount.publicKey}`
  );

  await api.disconnect();
})();
