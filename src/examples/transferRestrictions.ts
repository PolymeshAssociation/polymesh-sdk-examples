import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { FungibleAsset } from '@polymeshassociation/polymesh-sdk/types';

import { getClient } from '~/common/client';
import { isAssetId } from '~/common/utils';

/*
  This script showcases Transfer Restriction related functionality. It:
    - Adds a count restriction to a Asset
    - Adds a percentage restriction to the Asset
    - Sets (deletes existing and adds new) percentage restrictions on the Asset
    - Removes all count restrictions from the Asset
    - Fetches all percentage restrictions on the Asset
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  const assetInput = process.argv[2];

  if (!assetInput) {
    throw new Error('Please supply a ticker or Asset ID as an argument to the script');
  }

  let asset: FungibleAsset;

  if (isAssetId(assetInput)) {
    asset = await api.assets.getFungibleAsset({ assetId: assetInput });
  } else {
    asset = await api.assets.getFungibleAsset({ ticker: assetInput });
  }

  const addCountRestrictionQ = await asset.transferRestrictions.count.addRestriction({
    count: new BigNumber(10),
    // unique investor scope IDs can be exempted from the restriction
    // exempted: ['SOME_SCOPE_ID']
  });

  let restrictionAmount = await addCountRestrictionQ.run();

  console.log(`Count restriction added! There are now ${restrictionAmount} restrictions`); // 1

  const addPercentageRestrictionQ = await asset.transferRestrictions.percentage.addRestriction({
    percentage: new BigNumber(35),
  });

  restrictionAmount = await addPercentageRestrictionQ.run();

  console.log(`Percentage restriction added! There are now ${restrictionAmount} restrictions`); // 2

  // throws an error if setting these restrictions would surpass the maximum amount of restrictions
  const setPercentageRestrictionsQ = await asset.transferRestrictions.percentage.setRestrictions({
    restrictions: [
      {
        percentage: new BigNumber(25),
        // can also have exemptions
      },
      {
        percentage: new BigNumber(30),
        // can have a different set of exemptions
      },
    ],
  });

  restrictionAmount = await setPercentageRestrictionsQ.run();

  console.log(`Percentage restrictions set! There are now ${restrictionAmount} restrictions`); // 3

  const removeCountRestrictionsQ = await asset.transferRestrictions.count.removeRestrictions();

  restrictionAmount = await removeCountRestrictionsQ.run();

  console.log(`Count restrictions removed! There are now ${restrictionAmount} restrictions`); // 2

  const { availableSlots, restrictions } = await asset.transferRestrictions.percentage.get();

  console.log(`There are ${availableSlots} available restriction slots`); // 2

  restrictions.forEach(({ percentage, exemptedIds = [] }, index) => {
    console.log(
      `Restriction Nº ${index}: percentage: ${percentage.toNumber()}, exempted: ${exemptedIds}`
    );
  });

  await api.disconnect();
})();
