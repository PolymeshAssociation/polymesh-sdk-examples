import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { getClient } from '~/common/client';

/* 
  This script showcases Transfer Restriction related functonality. It: 
    - Adds a count restriction to a Security Token
    - Adds a percentage restriction to the Token
    - Sets (deletes existing and adds new) percentage restrictions on the Token
    - Removes all count restrictions from the Token
    - Fetches all percentage restrictions on the Token
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  const ticker = process.argv[2];

  if (!ticker) {
    throw new Error('Please supply a ticker as an argument to the script');
  }

  const token = await api.getSecurityToken({ ticker });

  const addCountRestrictionQ = await token.transferRestrictions.count.addRestriction({
    count: new BigNumber(10),
    // unique investor scope IDs can be exempted from the restriction
    // exempted: ['SOME_SCOPE_ID']
  });

  let restrictionAmount = await addCountRestrictionQ.run();

  console.log(`Count restriction added! There are now ${restrictionAmount} restrictions`); // 1

  const addPercentageRestrictionQ = await token.transferRestrictions.percentage.addRestriction({
    percentage: new BigNumber(35),
  });

  restrictionAmount = await addPercentageRestrictionQ.run();

  console.log(`Percentage restriction added! There are now ${restrictionAmount} restrictions`); // 2

  // throws an error if setting these restrictions would surpass the maximum amount of restrictions
  const setPercentageRestrictionsQ = await token.transferRestrictions.percentage.setRestrictions({
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

  const removeCountRestrictionsQ = await token.transferRestrictions.count.removeRestrictions();

  restrictionAmount = await removeCountRestrictionsQ.run();

  console.log(`Count restrictions removed! There are now ${restrictionAmount} restrictions`); // 2

  const { availableSlots, restrictions } = await token.transferRestrictions.percentage.get();

  console.log(`There are ${availableSlots} available restriction slots`); // 2

  restrictions.forEach(({ percentage, exemptedScopeIds = [] }, index) => {
    console.log(
      `Restriction Nº ${index}: percentage: ${percentage.toNumber()}, exempted: ${exemptedScopeIds}`
    );
  });

  await api.disconnect();
})();
