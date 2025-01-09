import type { LocaleVariableMatch } from './extract-variables-from-selection';

export function replaceVariablesInSelection(
  selection: string,
  variables: LocaleVariableMatch[],
) {
  const reversedVariables = variables.toReversed();

  return reversedVariables.reduce((modifiedSelection, variable) => {
    const lastIndex = variable.index;

    const start = modifiedSelection.slice(0, lastIndex);
    const end = modifiedSelection.slice(variable.match.length + lastIndex);

    return `${start}${variable.replacement}${end}`;
  }, selection);
}
