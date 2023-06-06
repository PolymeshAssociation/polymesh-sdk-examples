import { Polymesh } from '@polymeshassociation/polymesh-sdk';
import { KnownAssetType } from '@polymeshassociation/polymesh-sdk/types';
/*
  This function showcases ticker reservation related functionality. It:
    - Reserves a Asset with the specified ticker
    - Fetches its details
    - Creates the Asset
*/
export const tickerReservation = async (sdk: Polymesh, ticker: string): Promise<void> => {
  const identity = await sdk.getSigningIdentity();
  if (!identity) {
    throw new Error('the SDK must have a signing identity');
  }

  const { account: signingAccount } = await identity.getPrimaryAccount();

  // Prepare the reservation transaction. Note, this call will validate the ticker is available
  const reserveTx = await sdk.assets.reserveTicker(
    {
      ticker,
    },
    { signingAccount }
  );

  // Reserve the ticker
  const reservation = await reserveTx.run();
  // the Reservation has methods to get its details, or to finish creating the Asset
  const { expiryDate, owner } = await reservation.details();
  // Prepare and run the create Asset transaction
  const createAssetTx = await reservation.createAsset(
    {
      name: 'Reservation Demo',
      isDivisible: true,
      assetType: KnownAssetType.EquityCommon,
    },
    { signingAccount }
  );
  await createAssetTx.run();
  // Fetch the Reservation details after the Asset has been created
  const { expiryDate: expiryAfterCreate } = await reservation.details();
};
