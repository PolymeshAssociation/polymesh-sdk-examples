import { Polymesh } from '@polymeshassociation/polymesh-sdk';
import {
  GenericPolymeshTransaction,
  TransactionStatus,
} from '@polymeshassociation/polymesh-sdk/types';

// Helper function to retrieve an account and check its Compliance Due Diligence (CDD) status.
export const getAccountAndCheckCDD = async (
  sdk: Polymesh,
  signingKey: string,
) => {
  // Retrieve the account using the signing key
  const account = await sdk.accountManagement.getAccount({
    address: signingKey,
  });
  // Retrieve the identity associated with the account
  const identity = await account?.getIdentity();

  // Check if the identity exists
  if (!identity) {
    throw new Error(
      `Key ${signingKey} is not associated with an on-chain identity`,
    );
  }

  // Check if the identity has a valid CDD status
  const cddStatus = identity?.hasValidCdd();

  if (!cddStatus) {
    throw new Error(`Key ${signingKey} does not have a valid CDD Status`);
  }

  return account;
};

// Helper function to split a tag string into a more readable format
export function splitTag(inputString: string): string {
  // Split the input string by '.'
  const firstSplit = inputString.split('.');

  // Split the module name and call name into words
  const moduleNameWords = firstSplit[0].split(/(?=[A-Z])/);
  const callWords = firstSplit[1].split(/(?=[A-Z])/);

  // Capitalize the words and join them to create a readable result
  const capitalizedModuleArray = moduleNameWords.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1),
  );
  const capitalizedCallArray = callWords.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1),
  );

  const result = `Transaction Type: ${capitalizedModuleArray.join(
    ' ',
  )}, ${capitalizedCallArray.join(' ')}`;

  return result;
}

// Helper function to handle the status change of a Polymesh transaction
export const handleTxStatusChange = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: GenericPolymeshTransaction<any, any>,
) => {
  // Switch statement to handle different transaction status scenarios
  switch (tx.status) {
    case TransactionStatus.Unapproved:
      console.log(`\n⌛ Transaction pending signing`);
      break;

    case TransactionStatus.Rejected:
      console.log('\n❌ Transaction rejected by signer');
      break;

    case TransactionStatus.Running:
      console.log('\n✍️  Transaction signed and submitted');
      console.log('Transaction hash', tx.txHash?.toString());
      console.log('Awaiting result...');
      break;

    case TransactionStatus.Failed:
      console.log('\n❗ Transaction failed');
      console.log('Included in Block number', tx.blockNumber?.toString());
      console.log('Transaction Index:', tx.txIndex?.toString());
      console.log('Block hash', tx.blockHash?.toString());
      break;

    case TransactionStatus.Succeeded:
      console.log('\n✅ Transaction successful');
      console.log('Included in Block number', tx.blockNumber?.toString());
      console.log('Transaction Index:', tx.txIndex?.toString());
      console.log('Block hash', tx.blockHash?.toString());
      break;

    case TransactionStatus.Aborted:
      console.log("\n❗ Aborted, the transaction couldn't be broadcast");
      break;

    default:
      break;
  }
};
