import { patch } from 'silver-fleece';
import { getLocales, type MatchedSchema } from '../../utils/get-schema';
import {
  replaceVariablesInSelection,
  type LocaleVariableMatch,
} from '../../utils/translate';
import { injectLocale } from '../../utils/inject-locale';

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

  const translationValue = replaceVariablesInSelection(value, variables);

  for (const locale in locales) {
    locales[locale] = injectLocale(
      locales[locale] ?? {},
      key.split('.'),
      translationValue,
    );
  }

  data.locales = locales;

  return schema.match.replace(schema.content, patch(schema.content, data));
}
