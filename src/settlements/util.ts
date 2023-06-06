import {
  Asset,
  ClaimType,
  ConditionTarget,
  ConditionType,
  ScopeType,
} from '@polymeshassociation/polymesh-sdk/types';

// Helper function - Assets need compliance requirements configured before they can traded
export const addIsNotBlocked = async (asset: Asset, signingAccount?: string): Promise<unknown> => {
  const tx = await asset.compliance.requirements.add(
    {
      conditions: [
        {
          type: ConditionType.IsAbsent,
          claim: {
            type: ClaimType.Blocked,
            scope: {
              type: ScopeType.Ticker,
              value: asset.ticker,
            },
          },
          target: ConditionTarget.Both,
        },
      ],
    },
    {
      signingAccount,
    }
  );

  return tx.run();
};
