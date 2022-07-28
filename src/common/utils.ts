import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { isEntity } from '@polymeshassociation/polymesh-sdk/utils';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Object.keys(obj).reduce(
      (r, v) => Object.assign(r, { [v]: toHumanObject(obj[v as keyof typeof obj]) }),
      {}
    );
  }

  return obj;
}
