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
