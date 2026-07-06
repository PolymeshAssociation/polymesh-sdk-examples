import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { StatType, TransferRestrictionType } from '@polymeshassociation/polymesh-sdk/types';

import { getFungibleAsset } from '~/common/assets';
import { getClient } from '~/common/client';

/*
  This script showcases Transfer Restriction related functionality. It:
    - Enables required stats and sets a count restriction
    - Adds a percentage restriction
    - Replaces percentage restrictions on the Asset
    - Removes count restrictions
    - Fetches active transfer restrictions
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  const assetInput = process.argv[2];

  if (!assetInput) {
    throw new Error('Please supply a ticker or Asset ID as an argument to the script');
  }

  const asset = await getFungibleAsset(api, assetInput);
  const investorCount = await asset.investorCount();

  const enableCountStatQ = await asset.transferRestrictions.setStats({
    stats: [{ type: StatType.Count, count: investorCount }],
  });
  await enableCountStatQ.run();

  let setRestrictionsQ = await asset.transferRestrictions.setRestrictions({
    restrictions: [{ type: TransferRestrictionType.Count, count: new BigNumber(10) }],
  });
  await setRestrictionsQ.run();

  let { restrictions } = await asset.transferRestrictions.getRestrictions();
  console.log(`Count restriction added! There are now ${restrictions.length} restrictions`); // 1

  const enablePercentageStatQ = await asset.transferRestrictions.setStats({
    stats: [
      { type: StatType.Count, count: investorCount },
      { type: StatType.Balance },
    ],
  });
  await enablePercentageStatQ.run();

  setRestrictionsQ = await asset.transferRestrictions.setRestrictions({
    restrictions: [
      { type: TransferRestrictionType.Count, count: new BigNumber(10) },
      { type: TransferRestrictionType.Percentage, percentage: new BigNumber(35) },
    ],
  });
  await setRestrictionsQ.run();

  ({ restrictions } = await asset.transferRestrictions.getRestrictions());
  console.log(`Percentage restriction added! There are now ${restrictions.length} restrictions`); // 2

  setRestrictionsQ = await asset.transferRestrictions.setRestrictions({
    restrictions: [
      { type: TransferRestrictionType.Count, count: new BigNumber(10) },
      { type: TransferRestrictionType.Percentage, percentage: new BigNumber(25) },
      { type: TransferRestrictionType.Percentage, percentage: new BigNumber(30) },
    ],
  });
  await setRestrictionsQ.run();

  ({ restrictions } = await asset.transferRestrictions.getRestrictions());
  console.log(`Percentage restrictions set! There are now ${restrictions.length} restrictions`); // 3

  setRestrictionsQ = await asset.transferRestrictions.setRestrictions({
    restrictions: [
      { type: TransferRestrictionType.Percentage, percentage: new BigNumber(25) },
      { type: TransferRestrictionType.Percentage, percentage: new BigNumber(30) },
    ],
  });
  await setRestrictionsQ.run();

  ({ restrictions } = await asset.transferRestrictions.getRestrictions());
  console.log(`Count restrictions removed! There are now ${restrictions.length} restrictions`); // 2

  restrictions.forEach((restriction, index) => {
    if (restriction.type === TransferRestrictionType.Percentage) {
      console.log(`Restriction Nº ${index}: percentage: ${restriction.value.toNumber()}`);
    }
  });

  await api.disconnect();
})();
