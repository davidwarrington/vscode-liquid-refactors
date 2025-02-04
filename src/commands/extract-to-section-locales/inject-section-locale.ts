import { patch } from 'silver-fleece';
import type { Locale } from '../../types';
import { getLocales, type MatchedSchema } from '../../utils/get-schema';
import {
  replaceVariablesInSelection,
  type LocaleVariableMatch,
} from '../../utils/translate';

function injectLocale(
  key: string,
  value: string,
  base: Locale,
  variables: LocaleVariableMatch[],
): Locale {
  const [firstKey, ...remainingKeys] = key.split('.');

  if (firstKey in base && remainingKeys.length === 0) {
    throw new Error('Key already exists');
  }

  const nextObject = base[firstKey] ?? {};

  if (typeof nextObject !== 'object') {
    // eslint-disable-next-line unicorn/prefer-type-error
    throw new Error('Key already exists');
  }

  if (remainingKeys.length > 0) {
    return {
      ...base,
      [firstKey]: injectLocale(
        remainingKeys.join('.'),
        value,
        nextObject,
        variables,
      ),
    };
  }

  base[key] = replaceVariablesInSelection(value, variables);

  return base;
}

export function injectSectionLocale(
  schema: MatchedSchema,
  key: string,
  value: string,
  variables: LocaleVariableMatch[],
) {
  const { data } = schema;

  const locales = getLocales(data) ?? {};

  if (Object.keys(locales).length === 0) {
    locales.en = {};
  }

  if (!locales) {
    throw new Error('[extract-to-section-locales] invalid section locales');
  }

  for (const locale in locales) {
    locales[locale] = injectLocale(
      key,
      value,
      locales[locale] ?? {},
      variables,
    ) as Record<string, Locale>;
  }

  data.locales = locales;

  return schema.match.replace(schema.content, patch(schema.content, data));
}
