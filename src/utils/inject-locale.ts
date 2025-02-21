import type { Locale } from '../types';

export function injectLocale(
  root: Locale,
  keys: string[],
  value: string,
): Locale {
  const [firstKey, ...remainingKeys] = keys;

  if (firstKey in root && remainingKeys.length === 0) {
    throw new Error('Key already exists');
  }

  const nextObject = root[firstKey] ?? {};

  if (typeof nextObject !== 'object') {
    // eslint-disable-next-line unicorn/prefer-type-error
    throw new Error('Key already exists');
  }

  if (remainingKeys.length > 0) {
    return {
      ...root,
      [firstKey]: injectLocale(nextObject, remainingKeys, value),
    };
  }

  root[firstKey] = value;

  return root;
}
