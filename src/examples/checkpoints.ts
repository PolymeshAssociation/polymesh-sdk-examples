import { CalendarUnit } from '@polymathnetwork/polymesh-sdk/types';

import { getClient } from '~/common/client';

/* 
  This script showcases Checkpoints related functonality. It:    
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
  const identity = (await api.getCurrentIdentity())!;
  console.log(`Connected! Current identity ID: ${identity.did}`);

  const ticker = process.argv[2];

  if (!ticker) {
    throw new Error('Please supply a ticker as an argument to the script');
  }

  const token = await api.getSecurityToken({ ticker });
  console.log(`Security Token found! Current token name is: ${(await token.details()).name}`);

  const createQ = await token.checkpoints.create();
  const newCheckpoint = await createQ.run();

  console.log('New checkpoint has been created:');
  console.log(`- Id: ${newCheckpoint.id}`);
  console.log(`- Ticker: ${newCheckpoint.ticker}`);
  console.log(`- Created at: ${await newCheckpoint.createdAt()}`);
  console.log(`- Total supply: ${await newCheckpoint.totalSupply()}`);

  const balanceAtCheckpoint = await newCheckpoint.balance({ identity });
  console.log(`Balance of ${identity.did} at checkpoint: ${balanceAtCheckpoint}`);

  console.log(`All balances at checkpoint:`);
  const allBalances = await newCheckpoint.allBalances();
  allBalances.data.forEach(({ identity, balance }) => {
    console.log(`- Balance of ${identity.did} at checkpoint: ${balance.toNumber()}`);
  });

  const checkpoints = await token.checkpoints.get();
  console.log(`Current checkpoints: ${checkpoints.length}`);

  const createScheduleQ = await token.checkpoints.createSchedule({
    start: new Date(),
    period: { unit: CalendarUnit.Week, amount: 1 },
    repetitions: 5,
  });
  const newSchedule = await createScheduleQ.run();
  console.log('New schedule has been created:');

  console.log(`- Id: ${newSchedule.id}`);
  console.log(`- Ticker: ${newSchedule.ticker}`);
  console.log(`- Start: ${newSchedule.start}`);
  console.log(`- Period: ${newSchedule.period}`);
  console.log(`- Expiry date: ${newSchedule.expiryDate}`);

  const { nextCheckpointDate, remainingCheckpoints } = await newSchedule.details();
  console.log(`- Next checkpoint date: ${nextCheckpointDate}`);
  console.log(`- Remaining checkpoints: ${remainingCheckpoints}`);

  const checkpointsSchedule = await newSchedule.getCheckpoints();
  console.log(`- Amount of checkpoints created by schedule: ${checkpointsSchedule}`);

  const schedules = await token.checkpoints.getSchedules();
  console.log(`Current schedules: ${schedules.length}`);

  const removeScheduleQ = await token.checkpoints.removeSchedule({
    schedule: schedules[0].schedule,
  });
  await removeScheduleQ.run();
  console.log('Schedule has been deleted:');
})();
