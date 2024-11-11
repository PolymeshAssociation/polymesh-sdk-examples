import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  ClaimType,
  ConditionTarget,
  ConditionType,
  ScopeType,
} from '@polymeshassociation/polymesh-sdk/types';

import { getClient } from '~/common/client';
import { isAssetId, toHumanObject } from '~/common/utils';

/*
  This script showcases Compliance related functionality. Covered functionality:
    - Setting Compliance rules 
    - Getting existing Compliance rules
    - Pausing Compliance rules
    - Unpausing Compliance rules
    - Adding new requirements to existing Compliance rules
    - Removing a Compliance rule
    - Setting trusted Claim issuers
    - Getting existing trusted Claim issuers
    - Adding a new Claim issuer
    - Removing a Claim issuer
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getSigningIdentity())!;
  console.log(`Connected! Signing Identity ID: ${identity.did}`);

  const assetInput = process.argv[2];

  if (!assetInput) {
    throw new Error('Please supply a ticker or Asset ID as an argument to the script');
  }

  // Get Asset for the given ticker
  let asset;

  if (isAssetId(assetInput)) {
    asset = await api.assets.getAsset({ assetId: assetInput });
  } else {
    asset = await api.assets.getAsset({ ticker: assetInput });
  }

  console.log(`\n\nAsset found! Current asset name is: ${(await asset.details()).name}`);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const bobDid = process.env.BOB_DID!;

  const {
    compliance: { requirements, trustedClaimIssuers },
  } = asset;

  // eslint-disable-next-line require-jsdoc
  const printExistingRequirements = async (): Promise<void> => {
    const existingRequirements = await requirements.get();
    console.log(JSON.stringify(toHumanObject(existingRequirements)));
  };

  console.log('\n\nSetting new set of Requirements ....');
  const setRequirements = await requirements.set({
    requirements: [
      [
        {
          type: ConditionType.IsIdentity,
          identity: bobDid,
          target: ConditionTarget.Both,
        },
      ],
      [
        {
          type: ConditionType.IsPresent,
          claim: {
            type: ClaimType.Accredited,
            scope: {
              type: ScopeType.Asset,
              value: '0x80df7c052682e2eaad949f225609f2dc',
            },
          },
          target: ConditionTarget.Both,
        },
      ],
    ],
  });
  await setRequirements.run();

  console.log(`New compliance requirements...`);
  await printExistingRequirements();

  console.log(`\n\nPausing Compliance Requirements...`);
  const pauseRequirements = await requirements.pause();
  await pauseRequirements.run();

  let arePaused = await requirements.arePaused();
  console.log(`Are compliance requirements paused ? ${arePaused}`);

  console.log(`\n\nUnpausing Compliance Requirements...`);
  const unpauseRequirements = await requirements.unpause();
  await unpauseRequirements.run();

  arePaused = await requirements.arePaused();
  console.log(`Are compliance requirements paused ? ${arePaused}`);

  console.log('\n\nAdding a new requirement to set of existing requirements .....');
  const addRequirements = await requirements.add({
    conditions: [
      {
        type: ConditionType.IsAbsent,
        claim: {
          type: ClaimType.Blocked,
          scope: {
            type: ScopeType.Asset,
            value: assetInput,
          },
        },
        target: ConditionTarget.Both,
      },
    ],
  });
  await addRequirements.run();

  console.log('New compliance requirements after addition -');
  await printExistingRequirements();

  console.log('\n\nRemoving the newly added requirement... ');
  // we can either pass the id of the requirement or the requirement itself
  const removeRequirement = await requirements.remove({ requirement: new BigNumber(2) });
  await removeRequirement.run();

  console.log('New compliance requirements after removal');
  await printExistingRequirements();

  // eslint-disable-next-line require-jsdoc
  const printExistingClaimIssuers = async (): Promise<void> => {
    const claimIssuers = await trustedClaimIssuers.get();
    claimIssuers.forEach(({ identity: { did }, trustedFor }, index) => {
      console.log(`${index + 1}. Identity - ${did}`);
      console.log(`  Trusted for - ${!trustedFor ? 'All' : trustedFor.join()}\n`);
    });
  };

  console.log('\n\nGetting existing claim issuers...');
  await printExistingClaimIssuers();

  console.log('\n\nSetting new set of trusted Claim issuers... ');
  const setTrustedClaimIssuers = await trustedClaimIssuers.set({
    claimIssuers: [
      {
        identity: bobDid,
        trustedFor: [ClaimType.Accredited, ClaimType.Affiliate],
      },
    ],
  });
  await setTrustedClaimIssuers.run();

  console.log('\n\n Fetching updated claim issuers...');
  await printExistingClaimIssuers();

  console.log('\n\nAdding a new claim issuer...');
  const addClaimIssuer = await trustedClaimIssuers.add({
    claimIssuers: [
      {
        identity,
        trustedFor: [ClaimType.Jurisdiction, ClaimType.CustomerDueDiligence, ClaimType.BuyLockup],
      },
    ],
  });
  await addClaimIssuer.run();

  console.log('\n\n Fetching updated claim issuers...');
  await printExistingClaimIssuers();

  console.log('\n\nRemoving a claim issuer....');
  const removeClaimIssuer = await trustedClaimIssuers.remove({ claimIssuers: [bobDid] });
  await removeClaimIssuer.run();

  console.log('\n\n Updated claim issuers...');
  await printExistingClaimIssuers();

  await api.disconnect();
})();
