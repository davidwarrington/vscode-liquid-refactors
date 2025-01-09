import { describe, expect, it } from 'vitest';
import {
  extractVariablesFromSelection,
  type LocaleVariableMatch,
} from './extract-variables-from-selection';

describe(extractVariablesFromSelection, () => {
  it('supports no variables', () => {
    const input = 'Foo bar';
    const expected: LocaleVariableMatch[] = [];

    expect(extractVariablesFromSelection(input)).toStrictEqual(expected);
  });

  it('supports simple variables', () => {
    const input = 'Foo {{ bar }}';
    const expected: LocaleVariableMatch[] = [
      {
        match: '{{ bar }}',
        replacement: '{{ bar }}',
        variableName: 'bar',
        variableValue: 'bar',
      },
    ];

    expect(extractVariablesFromSelection(input)).toStrictEqual(expected);
  });

  it('supports simple variables with no whitespace', () => {
    const input = 'Foo {{bar}}';
    const expected: LocaleVariableMatch[] = [
      {
        match: '{{bar}}',
        replacement: '{{ bar }}',
        variableName: 'bar',
        variableValue: 'bar',
      },
    ];

    expect(extractVariablesFromSelection(input)).toStrictEqual(expected);
  });

  it('supports simple variables with whitespace control handles', () => {
    const input = 'Foo {{bar}}';
    const expected: LocaleVariableMatch[] = [
      {
        match: '{{bar}}',
        replacement: '{{ bar }}',
        variableName: 'bar',
        variableValue: 'bar',
      },
    ];

    expect(extractVariablesFromSelection(input)).toStrictEqual(expected);
  });

  it('supports simple variables with whitespace control handles', () => {
    const input = 'Foo {{- bar -}}';
    const expected: LocaleVariableMatch[] = [
      {
        match: '{{- bar -}}',
        replacement: '{{ bar }}',
        variableName: 'bar',
        variableValue: 'bar',
      },
    ];

    expect(extractVariablesFromSelection(input)).toStrictEqual(expected);
  });

  it('supports underscores in variable names', () => {
    const input = 'Foo {{ bar_baz }}';
    const expected: LocaleVariableMatch[] = [
      {
        match: '{{ bar_baz }}',
        replacement: '{{ bar_baz }}',
        variableName: 'bar_baz',
        variableValue: 'bar_baz',
      },
    ];

    expect(extractVariablesFromSelection(input)).toStrictEqual(expected);
  });

  it('supports hyphens in variable names', () => {
    const input = 'Foo {{ bar-baz }}';
    const expected: LocaleVariableMatch[] = [
      {
        match: '{{ bar-baz }}',
        replacement: '{{ bar-baz }}',
        variableName: 'bar-baz',
        variableValue: 'bar-baz',
      },
    ];

    expect(extractVariablesFromSelection(input)).toStrictEqual(expected);
  });

  it('supports nested variable from an object property', () => {
    const input = 'Foo {{ bar.baz }}';
    const expected: LocaleVariableMatch[] = [
      {
        match: '{{ bar.baz }}',
        replacement: '{{ baz }}',
        variableName: 'baz',
        variableValue: 'bar.baz',
      },
    ];

    expect(extractVariablesFromSelection(input)).toStrictEqual(expected);
  });

  /** @todo confirm if translation variables can have question marks */
  it('supports question marks in an variable', () => {
    const input = 'Foo {{ bar? }}';
    const expected: LocaleVariableMatch[] = [
      {
        match: '{{ bar? }}',
        replacement: '{{ bar? }}',
        variableName: 'bar?',
        variableValue: 'bar?',
      },
    ];

    expect(extractVariablesFromSelection(input)).toStrictEqual(expected);
  });

  it('supports square brackets in an variable', () => {
    const input = "Foo {{ bar['baz'] }}";
    const expected: LocaleVariableMatch[] = [
      {
        match: `{{ bar['baz'] }}`,
        replacement: '{{ baz }}',
        variableName: `baz`,
        variableValue: `bar['baz']`,
      },
    ];

    expect(extractVariablesFromSelection(input)).toStrictEqual(expected);
  });

  it('supports spaces in square brackets in an variable', () => {
    const input = "{{ foo['bar baz'] }}";
    const expected: LocaleVariableMatch[] = [
      {
        match: `{{ foo['bar baz'] }}`,
        replacement: '{{ bar_baz }}',
        variableName: `bar_baz`,
        variableValue: `foo['bar baz']`,
      },
    ];

    expect(extractVariablesFromSelection(input)).toStrictEqual(expected);
  });

  it('supports multiline variables', () => {
    const input = `Foo {{
      bar
        .baz
        ['foo bar']
    }}`;
    const expected: LocaleVariableMatch[] = [
      {
        match: `{{
      bar
        .baz
        ['foo bar']
    }}`,
        replacement: '{{ foo_bar }}',
        variableName: `foo_bar`,
        variableValue: `bar.baz['foo bar']`,
      },
    ];

    expect(extractVariablesFromSelection(input)).toStrictEqual(expected);
  });

  it('supports multiple variable', () => {
    const input = 'Foo {{ bar }} {{ baz }}';
    const expected: LocaleVariableMatch[] = [
      {
        match: '{{ bar }}',
        replacement: '{{ bar }}',
        variableName: 'bar',
        variableValue: 'bar',
      },
      {
        match: '{{ baz }}',
        replacement: '{{ baz }}',
        variableName: 'baz',
        variableValue: 'baz',
      },
    ];

    expect(extractVariablesFromSelection(input)).toStrictEqual(expected);
  });

  it('deduplicates variables', () => {
    const input = 'Foo {{ bar }} {{ bar }}';
    const expected: LocaleVariableMatch[] = [
      {
        match: '{{ bar }}',
        replacement: '{{ bar }}',
        variableName: 'bar',
        variableValue: 'bar',
      },
      {
        match: '{{ bar }}',
        replacement: '{{ bar_1 }}',
        variableName: 'bar_1',
        variableValue: 'bar',
      },
    ];

    expect(extractVariablesFromSelection(input)).toStrictEqual(expected);
  });

  it('deduplicates variables correctly when existing variables conflict', () => {
    const input = 'Foo {{ bar }} {{ bar }} {{ bar_1 }}';
    const expected: LocaleVariableMatch[] = [
      {
        match: '{{ bar }}',
        replacement: '{{ bar }}',
        variableName: 'bar',
        variableValue: 'bar',
      },
      {
        match: '{{ bar }}',
        replacement: '{{ bar_2 }}',
        variableName: 'bar_2',
        variableValue: 'bar',
      },
      {
        match: '{{ bar_1 }}',
        replacement: '{{ bar_1 }}',
        variableName: 'bar_1',
        variableValue: 'bar_1',
      },
    ];

    expect(extractVariablesFromSelection(input)).toStrictEqual(expected);
  });
});
