import { describe, expect, it } from 'vitest';
import { getSchema } from './get-schema';

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
});
