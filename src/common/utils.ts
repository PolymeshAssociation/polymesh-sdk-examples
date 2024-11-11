import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ClaimData, FungibleLeg, Leg, NftLeg } from '@polymeshassociation/polymesh-sdk/types';
import { isEntity, isHexUuid, isUuid } from '@polymeshassociation/polymesh-sdk/utils';

/**
 * @hidden
 */
export function toHumanObject(obj: unknown): unknown {
  if (isEntity(obj)) {
    return obj.toHuman();
  }

  if (Array.isArray(obj)) {
    return obj.map(toHumanObject);
  }

  if (obj instanceof BigNumber && !obj.isNaN()) {
    return obj.toString();
  }

  if (obj && typeof obj === 'object') {
    return Object.keys(obj).reduce(
      (r, v) => Object.assign(r, { [v]: toHumanObject(obj[v as keyof typeof obj]) }),
      {}
    );
  }

  return obj;
}

/**
 * @hidden
 */
export function parseArgs<T>(args: string[]): T {
  // parse args
  const parsedArgs = args.reduce((acc, arg) => {
    const [key, value] = arg.split('=');

    return Object.assign(acc, {
      [key]: !isNaN(parseInt(value)) && isFinite(Number(value)) ? parseInt(value) : value,
    });
  }, {});

  return parsedArgs as T;
}

/**
 * @hidden
 */
export const renderClaim = (
  { target, issuer, issuedAt, expiry, claim }: ClaimData,
  pos: number
): void => {
  const issuedAtText = issuedAt ? `issued at ${issuedAt}` : '';
  console.log(`Claim #${pos} ${issuedAtText}`);
  console.log(`Target: ${target.did}`);
  console.log(`Issuer: ${issuer.did}`);
  if (expiry) {
    console.log(`Expiry date: ${expiry}`);
  }
  console.log(`Claim: ${claim.type}`);
  console.log('\n');
};

/**
 * @hidden
 */
export const isFungibleLeg = (leg: Leg): leg is FungibleLeg => {
  return (leg as FungibleLeg).amount !== undefined;
};

/**
 * @hidden
 */
export const isNftLeg = (leg: Leg): leg is NftLeg => {
  return (leg as NftLeg).nfts !== undefined;
};

/**
 * @hidden
 */
export const isAssetId = (asset: string): boolean => {
  return isUuid(asset) || isHexUuid(asset);
};
