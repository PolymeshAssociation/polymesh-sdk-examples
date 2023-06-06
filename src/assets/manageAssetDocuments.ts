import { blake2AsHex } from '@polkadot/util-crypto';
import { Polymesh } from '@polymeshassociation/polymesh-sdk';
import { Asset } from '@polymeshassociation/polymesh-sdk/types';
/*
  This function showcases adding and removing documents from an Asset. It:
    - Sets 2 documents to the Asset
    - Fetches the details of the documents
    - Removes a document from the Asset
*/
export const manageAssetDocuments = async (sdk: Polymesh, asset: Asset): Promise<void> => {
  const doc1 = {
    name: 'Document One',
    uri: 'https://example.com/one',
    contentHash: blake2AsHex('Example 1'),
  };
  const doc2 = {
    name: 'Document Two',
    uri: 'https://example.com/two',
    contentHash: blake2AsHex('Example 2'),
  };
  const documents = [doc1, doc2];

  // Prepare and execute a set documents transaction
  let setDocumentsTx = await asset.documents.set({ documents });
  await setDocumentsTx.run();
  // Note - the result is paginated in case there are many documents
  const addedDocs = await asset.documents.get();
  // Remove a document by calling `.set` without including it
  setDocumentsTx = await asset.documents.set({ documents: [doc2] });
  await setDocumentsTx.run();
  const updatedDocs = await asset.documents.get();
};
