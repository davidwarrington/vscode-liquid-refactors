import { describe, expect, it } from 'vitest';
import { getCurrentSchemaNode, getSchema } from './get-schema';
import { Selection } from 'vscode';

describe(getSchema, () => {
  it('Can detect a schema block', () => {
    const input = 'Foo bar {% schema %}{ "name": "Foo" }{% endschema %}';
    const output = {
      match: '{% schema %}{ "name": "Foo" }{% endschema %}',
      content: '{ "name": "Foo" }',
      data: { name: 'Foo' },
      position: {
        start: 8,
        end: 52,
      },
    };

    expect(getSchema(input)).toStrictEqual(output);
  });

  it('Supports non-standard, but parseable schemas', () => {
    const input =
      'Foo bar {% schema %}{ "name": "Foo", "settings": [true, 123] }{% endschema %}';
    const output = {
      match:
        '{% schema %}{ "name": "Foo", "settings": [true, 123] }{% endschema %}',
      content: '{ "name": "Foo", "settings": [true, 123] }',
      data: { name: 'Foo', settings: [true, 123] },
      position: {
        start: 8,
        end: 77,
      },
    };

    expect(getSchema(input)).toStrictEqual(output);
  });
});

describe(getCurrentSchemaNode, () => {
  it('works', () => {
    const schema = getSchema(`
Hello world

{% schema %}
{
  "name": "Foo",
  "settings": [
    {
      "label": "Bar"
    }
  ]
}
{% endschema %}
`);
    const result = getCurrentSchemaNode(schema, [70, 73]);

    expect(result).toBe(false);
  });
});
