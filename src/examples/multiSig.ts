import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { getClient } from '~/common/client';

/*
  This script showcases MultiSig related functionality. It:
    - Demonstrates signing with different accounts using derivation paths
    - Creates a MultiSig
    - Accept MultiSig authorizations
    - Joins the MultiSig to an Identity
    - Signing transactions with different accounts
*/
(async (): Promise<void> => {
  console.log('\n----------------------------------------------------------------------\n');
  console.log('💡 Creating and using a MultiSig account:\n');
  const accountSeed = '//Alice';

  // Note: addresses assume `//Alice` as base
  const creatorAddress = '5Ge4F7x6oVYQtNzyK2Y9tVWeeRoNMeWU8Rh5LbQ8A7KzpzGt';
  const signerOne = '5EeaL92sHzBXti4oDQJLKbHjAAJzzHLVBgYK7pG9KpRKtXHd';
  const signerTwo = '5DRygDgq77PN6z9sBkjhDEAoXtWNpSzn2F8yWY3CzUuWAFV6';

  console.log('🔌 Connecting to the node...\n');
  const api = await getClient([
    accountSeed,
    `${accountSeed}/creator`, // 5Ge4F7x6oVYQtNzyK2Y9tVWeeRoNMeWU8Rh5LbQ8A7KzpzGt (if seed is //Alice)
    `${accountSeed}/signerOne`, // 5EeaL92sHzBXti4oDQJLKbHjAAJzzHLVBgYK7pG9KpRKtXHd (if seed is //Alice)
    `${accountSeed}/signerTwo`, // 5DRygDgq77PN6z9sBkjhDEAoXtWNpSzn2F8yWY3CzUuWAFV6 (if seed is //Alice)
  ]);

  // The creator of the MultiSig has to go through a KYC process
  const registerCreator = await api.identities.registerIdentity({
    targetAccount: creatorAddress,
    createCdd: true,
  });
  const creatorId = await registerCreator.run();

  // Transfer POLYX to the creator. Note: The creator's primary key is responsible for all of the MultiSig's fees
  const transfer = await api.network.transferPolyx({
    to: creatorAddress,
    amount: new BigNumber(5000),
  });
  await transfer.run();
  console.log(
    `🚀 Creator account DID ("${creatorId.did}") created and account was seeded with POLYX\n`
  );

  const [signerOneAccount, signerTwoAccount] = await Promise.all([
    api.accountManagement.getAccount({ address: signerOne }),
    api.accountManagement.getAccount({ address: signerTwo }),
  ]);

  const createMultiSig = await api.accountManagement.createMultiSigAccount(
    {
      signers: [signerOneAccount, signerTwoAccount],
      requiredSignatures: new BigNumber(2),
    },
    {
      signingAccount: creatorAddress,
    }
  );
  const multiSig = await createMultiSig.run();

  console.log(`ℹ️ multiSig created. Address: "${multiSig.address}"\n`);

  // Each signer has to accept joining the MultiSig, here we perform both actions in parallel
  const [signerOneAuths, signerTwoAuths] = await Promise.all([
    signerOneAccount.authorizations.getReceived(),
    signerTwoAccount.authorizations.getReceived(),
  ]);

  const [signerOneAccept, signerTwoAccept] = await Promise.all([
    signerOneAuths[0].accept({ signingAccount: signerOne }),
    signerTwoAuths[0].accept({ signingAccount: signerTwo }),
  ]);

  await Promise.all([await signerOneAccept.run(), await signerTwoAccept.run()]);
  console.log('👥 Signers accepted the MultiSig authorization\n');
  /**
   * Before the MultiSig can perform actions it needs to be associated with a CDD claim
   *
   * Here we use a convenience method to attach the MultiSig directly to the creator account.
   * To attach to a different DID the MultiSig can be treated like any other account and be
   * targeted with `api.accountManagement.inviteAccount`.
   *
   * The creator's primary key is always responsible for the MultiSig's fees. If the multiSig
   * joins as a primary key, it will be responsible for its own fees, otherwise the primary
   * key will need to maintain adequate POLYX balance to ensure extrinsics are able to be
   * submitted.
   *
   * Here the MultiSig joins the creator's identity as a secondary key with full permissions
   *
   */
  const joinCreator = await multiSig.joinCreator(
    { asPrimary: false, permissions: { assets: null, transactions: null, portfolios: null } },
    { signingAccount: creatorAddress }
  );
  await joinCreator.run();
  console.log('🔗 MultiSig joined creator as a secondary key\n');

  /**
   * Submitting transactions for a MultiSig is a bit different compared to regular accounts.
   *
   * Because the signing account is a multiSig signer, the transaction needs to be wrapped as
   * a proposal, which will then need to be accepted. `runAsProposal` must be called instead of
   * the usual `.run`.
   *
   * Generically the procedure's `.multiSig` param can be checked, if set the `runAsProposal`
   * should be called
   */
  const createPortfolio = await api.identities.createPortfolio(
    {
      name: 'MultiSig Portfolio',
    },
    { signingAccount: signerOne }
  );

  console.log('📝 submitting proposal for MultiSig', createPortfolio.multiSig?.address); // Since `.multiSig` is set, `runAsProposal` should be used
  const portfolioProposal = await createPortfolio.runAsProposal();
  console.log(`ℹ️ proposal created id: ${portfolioProposal.id.toString()}\n`);

  /**
   * Accepting and rejecting proposal transactions will not be wrapped even though the
   * signer is a MultiSig signer the transaction will not be wrapped as a proposal.
   */
  const acceptProposal = await portfolioProposal.approve({ signingAccount: signerTwo });
  // acceptProposal.multiSig - will be null, since approve is not wrapped as a proposal
  await acceptProposal.run();
  console.log(`✅ Account: ${signerTwo} approved proposal ${portfolioProposal.id.toString()}\n`);

  const reserveTicker = await api.assets.reserveTicker(
    {
      ticker: 'MULTI',
    },
    { signingAccount: signerOne }
  );

  const reserveProposal = await reserveTicker.runAsProposal();
  console.log(`ℹ️ proposal created id: ${reserveProposal.id.toString()}\n`);

  /**
   * Rejecting a proposal is similar to accepting one
   */
  const rejectProposal = await reserveProposal.reject({ signingAccount: signerTwo });
  await rejectProposal.run();
  console.log(`❌ Account: ${signerTwo} rejected proposal: ${reserveProposal.id.toString()}`);

  console.log('🔌 Disconnecting from the node...\n');
  await api.disconnect();
})();
