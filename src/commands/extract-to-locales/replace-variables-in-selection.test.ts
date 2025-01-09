import { describe, expect, it } from 'vitest';
import { replaceVariablesInSelection } from './replace-variables-in-selection';

type ReplaceVariablesInSelectionArgs = Parameters<
  typeof replaceVariablesInSelection
>;

describe(replaceVariablesInSelection, () => {
  it('Foo {{ bar }} => Foo {{ bar }}', () => {
    const input = [
      'Foo {{ bar }}',
      [
        {
          index: 4,
          match: '{{ bar }}',
          replacement: '{{ bar }}',
          variableName: 'bar',
          variableValue: 'bar',
        },
      ],
    ] satisfies ReplaceVariablesInSelectionArgs;
    const output = 'Foo {{ bar }}';

    expect(replaceVariablesInSelection(...input)).toBe(output);
  });

  it('Foo {{ bar }} {{ bar }} => Foo {{ bar }} {{ bar_1 }}', () => {
    const input = [
      'Foo {{ bar }} {{ bar }}',
      [
        {
          index: 4,
          match: '{{ bar }}',
          replacement: '{{ bar }}',
          variableName: 'bar',
          variableValue: 'bar',
        },
        {
          index: 14,
          match: '{{ bar }}',
          replacement: '{{ bar_1 }}',
          variableName: 'bar_1',
          variableValue: 'bar',
        },
      ],
    ] satisfies ReplaceVariablesInSelectionArgs;
    const output = 'Foo {{ bar }} {{ bar_1 }}';

    expect(replaceVariablesInSelection(...input)).toBe(output);
  });
});
