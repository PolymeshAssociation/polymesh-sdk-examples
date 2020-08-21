import { getClient } from '~/common/client';

/* 
  This script queries the current identity's signing keys
    and removes the first one
*/
(async () => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  const identity = api.getIdentity();
  console.log(`Connected! Current identity ID: ${identity.did}`);

  let signingKeys = await api.getMySigningKeys();

  console.log('Signing keys:');
  signingKeys.forEach(({ type, value }) => {
    console.log(`- Type: ${type}, Value: ${value}`);
  });

  const removeKeysQ = await api.removeMySigningKeys({ signers: signingKeys.slice(0, 1) });

  console.log('Removing first key');
  await removeKeysQ.run();

  signingKeys = await api.getMySigningKeys();

  console.log('Signing keys (after removing):');
  signingKeys.forEach(({ type, value }) => {
    console.log(`- Type: ${type}, Value: ${value}`);
  });
})();
