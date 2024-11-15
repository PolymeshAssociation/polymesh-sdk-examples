import { getFungibleAsset } from '~/common/assets';
import { getClient } from '~/common/client';

/*
  This script showcases Checkpoints related functionality. It:
    - Creates a Checkpoint
    - Fetches asset's Checkpoints
    - Fetches Checkpoint details
    - Creates a Schedule
    - Fetches asset's Schedules
    - Fetches Schedule details
    - Fetches Checkpoints originated by a Schedule
    - Deletes a Schedule
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getSigningIdentity())!;
  console.log(`Connected! Signing Identity ID: ${identity.did}`);

  const assetInput = process.argv[2];

  if (!assetInput) {
    throw new Error('Please supply a ticker or Asset Id as an argument to the script');
  }

  const asset = await getFungibleAsset(api, assetInput);

  const details = await asset.details();
  console.log(`Asset found! Current asset name is: ${details.name}`);

  const createQ = await asset.checkpoints.create();
  const newCheckpoint = await createQ.run();

  const [createdAt, totalSupply] = await Promise.all([
    newCheckpoint.createdAt(),
    newCheckpoint.totalSupply(),
  ]);

  console.log('New checkpoint has been created:');
  console.log(`- Id: ${newCheckpoint.id}`);
  console.log(`- Asset ID: ${newCheckpoint.asset.id}`);
  console.log(`- Created at: ${createdAt}`);
  console.log(`- Total supply: ${totalSupply}`);

  const balanceAtCheckpoint = await newCheckpoint.balance({ identity });
  console.log(`Balance of ${identity.did} at checkpoint: ${balanceAtCheckpoint}`);

  console.log(`All balances at checkpoint:`);
  const allBalances = await newCheckpoint.allBalances();
  allBalances.data.forEach(({ identity, balance }) => {
    console.log(`- Balance of ${identity.did} at checkpoint: ${balance.toNumber()}`);
  });

  const checkpoints = await asset.checkpoints.get();
  console.log(`Current checkpoints: ${checkpoints.data.length}`);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const createScheduleQ = await asset.checkpoints.schedules.create({
    points: [tomorrow],
  });
  const newSchedule = await createScheduleQ.run();

  console.log('New schedule has been created:');
  console.log(`- Id: ${newSchedule.id}`);
  console.log(`- Asset ID: ${newSchedule.asset.id}`);
  console.log(`- Expiry date: ${newSchedule.expiryDate}`);

  const { nextCheckpointDate, remainingCheckpoints } = await newSchedule.details();
  console.log(`- Next checkpoint date: ${nextCheckpointDate}`);
  console.log(`- Remaining checkpoints: ${remainingCheckpoints}`);

  const createdCheckpoints = await newSchedule.getCheckpoints();
  console.log(`- Amount of checkpoints created by schedule: ${createdCheckpoints.length}`);

  const schedules = await asset.checkpoints.schedules.get();
  console.log(`Current schedules: ${schedules.length}`);

  const removeScheduleQ = await asset.checkpoints.schedules.remove({
    schedule: schedules[0].schedule,
  });
  await removeScheduleQ.run();
  console.log('Schedule has been deleted:');

  await api.disconnect();
})();
