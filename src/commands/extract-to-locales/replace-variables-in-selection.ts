import type { LocaleVariableMatch } from './extract-variables-from-selection';

export function replaceVariablesInSelection(
  selection: string,
  variables: LocaleVariableMatch[],
) {
  const variablesInSelection = [
    ...selection.matchAll(/{{-?\s*(?:.+?)\s*-?}}/gs),
  ].reverse();
  const variableSet = new Set(variables.reverse());

  return variablesInSelection.reduce((modifiedSelection, match) => {
    const variable = [...variableSet].find(
      variable => variable.match === match[0],
    );

    if (!variable) {
      return modifiedSelection;
    }

    variableSet.delete(variable);

    const lastIndex = match.index;

    const start = modifiedSelection.slice(0, lastIndex);
    const end = modifiedSelection.slice(match[0].length + lastIndex);

    return `${start}${variable.replacement}${end}`;
  }, selection);
}
