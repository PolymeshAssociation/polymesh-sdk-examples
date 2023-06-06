import { BigNumber, Polymesh } from '@polymeshassociation/polymesh-sdk';

import { wellKnown } from '~/consts';

/*
  This script showcases Transfer Restriction related functionality. It:
    - Adds a percentage restriction to the Asset
    - Sets (deletes existing and adds new) percentage restrictions on the Asset
    - Fetches all percentage restrictions on the Asset
    - Adds a count restriction to a Asset
    - Removes all count restrictions from the Asset

  If an Identity is in violation of a newly created Transfer Restriction they will only be able to trade the Asset
  in the direction that makes them more compliant. e.g. a majority holder able to sell but not buy
*/
export const transferRestrictions = async (sdk: Polymesh, ticker: string): Promise<void> => {
  const identity = await sdk.getSigningIdentity();
  if (!identity) {
    throw new Error('the SDK must have a signing identity');
  }

  const asset = await sdk.assets.getAsset({ ticker });

  /*
      Transfer Restrictions require their respective stats to be enabled. Enabling a stat will slightly increase gas fees for all transfers.
      Statistics can also be enabled during creation by passing  `initialStatistics` in the `sdk.assets.createAsset` call
    */
  const addPercentageStatTx = await asset.transferRestrictions.percentage.enableStat();
  await addPercentageStatTx.run();
  const addPercentageRestrictionTx = await asset.transferRestrictions.percentage.addRestriction({
    percentage: new BigNumber(10),
  });
  await addPercentageRestrictionTx.run();
  // Multiple restrictions can be set at once. This overrides existing "percentage" claims
  const setPercentageRestrictionsTx = await asset.transferRestrictions.percentage.setRestrictions({
    restrictions: [
      {
        percentage: new BigNumber(10),
        // (optional) investors can be exempt from any restriction, specified by an Identity or DID string
        exemptedIdentities: [identity],
      },
      {
        percentage: new BigNumber(30),
      },
    ],
  });
  await setPercentageRestrictionsTx.run();
  const { restrictions } = await asset.transferRestrictions.percentage.get();
  // All restrictions of a certain type can be removed
  const removeRestrictionsTx = await asset.transferRestrictions.percentage.removeRestrictions();
  await removeRestrictionsTx.run();
  // Statistics should be disabled if no Transfer Restriction is using them
  const disablePercentageStatTx = await asset.transferRestrictions.percentage.disableStat();
  await disablePercentageStatTx.run();
  /*
      "count" statistics must be initialized with a value. The chain only increments and decrements this value when Assets move.
      An improperly configured statistic will cause dependent Transfer Restrictions to function incorrectly
  
      IMPORTANT! there is a potential "time of check, time of use" bug. Trading should be paused during the count stat creation process
    */
  const count = await asset.investorCount();
  const enableCountStatTx = await asset.transferRestrictions.count.enableStat({ count });
  await enableCountStatTx.run();
  // Create a restriction to limit the Asset to have at most 10 holders
  const addCountRestrictionTx = await asset.transferRestrictions.count.addRestriction({
    count: new BigNumber(10),
    exemptedIdentities: [wellKnown.alice.did, identity],
  });
  await addCountRestrictionTx.run();
};
