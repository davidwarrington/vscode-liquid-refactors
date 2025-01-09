import snakeCase from 'lodash.snakecase';

function normaliseValue(value: string) {
  return value
    .split('\n')
    .map(line => line.trim())
    .join('');
}

export interface LocaleVariableMatch {
  match: string;
  replacement: string;
  variableName: string;
  variableValue: string;
}

export function extractVariablesFromSelection(
  selection: string,
): LocaleVariableMatch[] {
  const regexp = /{{-?(?:\s*)([a-zA-Z0-9_\-\s[\]'".?]*)(?:\s*)-?}}/gs;
  const matches = selection.match(regexp);

  if (!matches) {
    return [];
  }

  const extractedVariables = matches
    .map(match => {
      const value = normaliseValue(
        match.replaceAll(/(^{{-?\s*)|(\s*-?}}$)/g, ''),
      );

      let variableName = value.split('.').at(-1);

      if (value.endsWith(']')) {
        const name = value.match(/\[\s*(?:'(.+)')|(?:"(.+)")\s*]$/s)?.[1];

        if (!name) {
          return;
        }

        variableName = snakeCase(name);
      }

      if (!variableName) {
        return;
      }

      return {
        match,
        replacement: `{{ ${variableName} }}`,
        variableName,
        variableValue: value,
      };
    })
    .filter(result => result !== undefined);

  const reservedNames = new Set<string>(
    extractedVariables.map(({ variableName }) => variableName),
  );
  const usedVariableNames = new Set<string>();
  const deduplicatedVariables = extractedVariables.map(variable => {
    let index = 0;
    const variableName = () =>
      index === 0 ? variable.variableName : `${variable.variableName}_${index}`;

    if (usedVariableNames.has(variableName())) {
      while (
        usedVariableNames.has(variableName()) ||
        reservedNames.has(variableName())
      ) {
        index += 1;
      }
    }

    const finalVariableName = variableName();

    usedVariableNames.add(finalVariableName);

    return {
      ...variable,
      replacement: `{{ ${finalVariableName} }}`,
      variableName: finalVariableName,
    };
  });

  return deduplicatedVariables;
}
