import { LocalSigningManager } from '@polymeshassociation/local-signing-manager';
import { BigNumber, Polymesh } from '@polymeshassociation/polymesh-sdk';
import { handleTxStatusChange } from './helpers';
import { KnownAssetType, VenueType } from '@polymeshassociation/polymesh-sdk/types';

// The identity associated with the EXCHANGE_MNEMONIC key should be permissioned as a CDD provider.
const EXCHANGE_MNEMONIC = process.env.EXCHANGE_MNEMONIC!;
//'oven rookie donkey state chair super satoshi old skill robot brain salt';

// For simplicity we're using derivation paths from the same mnemonic for Alice & Bob, but in practice these
// would be separate mnemonics
const ALICE_PATH = '//test1';
const BOB_PATH = '//test2';

// Connect to the testnet
const NODE_URL = process.env.POLYMESH_NODE_URL!; // e.g. 'wss://testnet-rpc.polymesh.live';

const main = async () => {
  try {
    // Create a local signing manager with all accounts
    // In practice this would likely be split into separate interactions, for each of
    // Exchange Entity, Alice & Bob
    const signingManager = await LocalSigningManager.create({
      accounts: [
        {
          mnemonic: EXCHANGE_MNEMONIC
        },
        {
          mnemonic: EXCHANGE_MNEMONIC,
          derivationPath: ALICE_PATH,
        },
        {
          mnemonic: EXCHANGE_MNEMONIC,
          derivationPath: BOB_PATH,
        },                
      ],
    });

    console.log('Connecting to Polymesh');

    // Connect to the Polymesh blockchain using the SDK
    const sdk = await Polymesh.connect({
      nodeUrl: NODE_URL,
      signingManager,
      polkadot: { noInitWarn: true },
    });

    // Retrieve network properties and log successful connection
    const networkProps = await sdk.network.getNetworkProperties();
    console.log('Successfully connected to', networkProps.name, '🎉');

    // Retrieve signing keys
    const signingKeys = await signingManager.getAccounts();
    const exchangeSigningKey = signingKeys[0];
    const aliceSigningKey = signingKeys[1];
    const bobSigningKey = signingKeys[2];

    // Use the SDK to create Account & Identity objects for Exchange Entity
    const exchangeAccount = await sdk.accountManagement.getAccount({
      address: exchangeSigningKey,
    });
    const exchangeIdentity = await exchangeAccount.getIdentity();

    // Exchange Entity onboards Alice
    const registerAliceTx = await sdk.identities.registerIdentity(
      {
        targetAccount: aliceSigningKey,
        createCdd: true,
      },
      { signingAccount: exchangeSigningKey },
    )
    const createdAliceIdentity = await registerAliceTx.run();
    console.log("Alice onboarded with key: ", aliceSigningKey, " and DID: ", createdAliceIdentity.did);

    // Exchange Entity onboards Bob
    const registerBobTx = await sdk.identities.registerIdentity(
      {
        targetAccount: bobSigningKey,
        createCdd: true,
      },
      { signingAccount: exchangeSigningKey },
    )
    const createdBobIdentity = await registerBobTx.run();
    console.log("Bob onboarded with key: ", bobSigningKey, " and DID: ", createdBobIdentity.did);

    // Use the SDK to create Account & Identity objects for Alice & Bob
    const aliceAccount = await sdk.accountManagement.getAccount({
      address: aliceSigningKey,
    });
    const aliceIdentity = await aliceAccount.getIdentity();

    const bobAccount = await sdk.accountManagement.getAccount({
      address: bobSigningKey,
    });
    const bobIdentity = await bobAccount.getIdentity();

    // Exchange Entity sends a bit of POLYX to Alice & Bob so they can pay for transactions
    // This could be done via a subsidiser relationship instead
    // NB - on testnet, newly onboarded keys get 100k POLYX, so not really needed on testnet either
    // NB - note use of `onStatusChange(handleTxStatusChange)` to monitor for errors / finalisation etc.
    const amount = new BigNumber(10);

    // Prepare a POLYX transfer to Alice
    const aliceTransferTx = await sdk.network.transferPolyx(
      {
        amount,
        to: aliceSigningKey,
      },
      { signingAccount: exchangeSigningKey },
    );

    console.log(`\nTransferring ${amount} POLYX to ${aliceSigningKey}`);

    // Subscribe to transaction status changes and handle status changes
    const aliceUnsub = aliceTransferTx.onStatusChange(handleTxStatusChange);

    try {
      // Execute the PolyX transfer transaction
      await aliceTransferTx.run();
    } catch (error) {
      console.log('Transaction Error:', (error as Error).message);
    } finally {
      // Unsubscribe from transaction status changes
      aliceUnsub();
    }

    // Prepare a POLYX transfer to Bob
    const bobTransferTx = await sdk.network.transferPolyx(
      {
        amount,
        to: bobSigningKey,
      },
      { signingAccount: exchangeSigningKey },
    );

    console.log(`\nTransferring ${amount} POLYX to ${bobSigningKey}`);

    // Subscribe to transaction status changes and handle status changes
    const bobUnsub = bobTransferTx.onStatusChange(handleTxStatusChange);

    try {
      // Execute the PolyX transfer transaction
      await bobTransferTx.run();
    } catch (error) {
      console.log('Transaction Error:', (error as Error).message);
    } finally {
      // Unsubscribe from transaction status changes
      bobUnsub();
    }

    // Alice & Bob assign portfolio creation permissions to Exchange Entity
    const alicePermissionsExchange = await sdk.identities.allowIdentityToCreatePortfolios(
      {
        did: exchangeIdentity!
      },
      { signingAccount: aliceSigningKey },
    )
    console.log("Assigning Portfolio creation permission to exchange for Alice");
    await alicePermissionsExchange.run();

    const bobPermissionsExchange = await sdk.identities.allowIdentityToCreatePortfolios(
      {
        did: exchangeIdentity!
      },
      { signingAccount: bobSigningKey },
    )
    console.log("Assigning Portfolio creation permission to exchange for Bob");
    await bobPermissionsExchange.run();

    // Exchange Entity create Trading Portfolios under Alice & Bob
    const aliceTrading = await sdk.identities.createPortfolio(
      {
        name: "Trading Portfolio",
        ownerDid: aliceIdentity!.did
      },
      { signingAccount: exchangeSigningKey },      
    )
    console.log("Exchange creates Trading Portfolio for Alice");
    await aliceTrading.run();

    const bobTrading = await sdk.identities.createPortfolio(
      {
        name: "Trading Portfolio",
        ownerDid: bobIdentity!.did
      },
      { signingAccount: exchangeSigningKey },      
    )
    console.log("Exchange creates Trading Portfolio for Bob");
    await bobTrading.run();

    // Create an ACME asset and distribute it to Alice default portfolio
    // As a short cut here, Alice just creates the asset and mints it to herself
    const ticker = generateRandomString(5);
    const assetCreate = await sdk.assets.createAsset(
      {
        ticker: ticker,
        name: ticker,
        isDivisible: true,
        assetType: KnownAssetType.EquityCommon,
        initialSupply: new BigNumber(3000),
      },
      { signingAccount: aliceSigningKey },
    )
    console.log("Creating Asset: ", ticker);
    const assetCreated = await assetCreate.run();
    console.log("Asset created: ", await assetCreated.details());

    // Alice deposits 50 ACME into Trading Portfolio
    const [aliceDefaultPortfolio, aliceTradingPortfolio] = await aliceIdentity!.portfolios.getPortfolios(); // First element is always the default Portfolio
    const [bobDefaultPortfolio, bobTradingPortfolio] = await bobIdentity!.portfolios.getPortfolios(); // First element is always the default Portfolio

    const moveAssets = await aliceDefaultPortfolio.moveFunds(
      {
        to: aliceTradingPortfolio,
        items: [{ asset: ticker, amount: new BigNumber(50) }],
      },
      { signingAccount: aliceSigningKey },
    )
    console.log("Depositing 50 ", ticker, " to Trading Portfolio");
    await moveAssets.run();
    console.log("Deposit complete");

    // Exchange Entity creates a settlement venue - this is only needed once
    const venueQ = await sdk.settlements.createVenue({
        description: 'Settlement',
        type: VenueType.Other,
      },
      { signingAccount: exchangeSigningKey },
    );
  
    console.log('Creating venue...');
    const venue = await venueQ.run();
    const { type, owner, description } = await venue.details();
    console.log('Venue created!');
    console.log(`Details:\n- Owner: ${owner?.did}\n- Type: ${type}\n- Description. ${description}`);
    
    // Exchange Entity settles 20 ACME from Alice to Bob
    const instructionQ = await venue.addInstruction({
        legs: [
          {
            from: aliceTradingPortfolio,
            to: bobTradingPortfolio,
            amount: new BigNumber(20),
            asset: ticker,
          },
        ],
      },
      // NB - note this is signed by exchange, Alice & Bob do not need to sign as they've assigned affirmation control
      // to the Exchange Entity  
      { signingAccount: exchangeSigningKey }
    );

    console.log('Creating Settlement Instruction...\n');
    const instruction = await instructionQ.run();
    console.log('Assets moved from Alice to Bob...\n');
  
    // Bob withdraws 20 ACME
    const withdrawAssets = await bobTradingPortfolio.moveFunds(
      {
        to: bobDefaultPortfolio,
        items: [{ asset: ticker, amount: new BigNumber(20) }],
      },
      // NB - note that this is signed by Exchange Entity, not by Bob, since it is moving funds from an custodied portfolio
      { signingAccount: exchangeSigningKey }, 
    )
    console.log("Bob withdraws assets from their Trading Portfolio");
    await withdrawAssets.run();

    // Disconnect from Polymesh and exit the process
    console.log('\nDisconnecting');
    await sdk.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charactersLength);
      result += characters[randomIndex];
  }

  return result;
}

main();
