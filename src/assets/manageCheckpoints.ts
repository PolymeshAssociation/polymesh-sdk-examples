import { BigNumber, Polymesh } from '@polymeshassociation/polymesh-sdk';
import { CalendarUnit } from '@polymeshassociation/polymesh-sdk/types';

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
export const manageCheckpoints = async (sdk: Polymesh, ticker: string): Promise<void> => {
  const signingIdentity = await sdk.getSigningIdentity();
  if (!signingIdentity) {
    throw new Error('The SDK must have a signing identity');
  }

  // The signing identity should be an agent of the Asset and have appropriate permission
  const asset = await sdk.assets.getAsset({ ticker });

  // prepare and run a create checkpoint transaction
  const createCheckpointTx = await asset.checkpoints.create();
  const newCheckpoint = await createCheckpointTx.run();

  // fetch checkpoint details
  const [createdAt, totalSupply] = await Promise.all([
    newCheckpoint.createdAt(),
    newCheckpoint.totalSupply(),
  ]);
  // get an Identity's balance at the checkpoint
  const currentBalance = await signingIdentity.getAssetBalance({ ticker });
  const balanceAtCheckpoint = await newCheckpoint.balance({ identity: signingIdentity });
  const { data: allBalances } = await newCheckpoint.allBalances({
    start: undefined,
    size: new BigNumber(10),
  });
  const { data: checkpoints } = await asset.checkpoints.get();
  // A schedule will create checkpoints on a regular cadence. e.g. for a monthly dividend
  const start = new Date();
  start.setMonth(start.getMonth() + 1); // start on the first of next month
  const createScheduleTx = await asset.checkpoints.schedules.create({
    start,
    period: { unit: CalendarUnit.Month, amount: new BigNumber(1) },
    repetitions: new BigNumber(12),
  });
  const newSchedule = await createScheduleTx.run();
  // fetch schedule details
  const { nextCheckpointDate, remainingCheckpoints } = await newSchedule.details();
  // fetch Checkpoints created by the schedule
  const createdCheckpoints = await newSchedule.getCheckpoints();
  // fetch active schedules for an asset
  const activeSchedules = await asset.checkpoints.schedules.get();
  // A schedule can be removed if its no longer needed
  const removeScheduleTx = await asset.checkpoints.schedules.remove({
    schedule: newSchedule,
  });
  await removeScheduleTx.run();
};
