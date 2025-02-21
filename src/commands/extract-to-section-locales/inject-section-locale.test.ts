import { describe, expect, it } from 'vitest';
import { injectSectionLocale } from './inject-section-locale';
import { getSchema } from '../../utils/get-schema';

describe(injectSectionLocale, () => {
  it('supports root level keys', () => {
    const file = `
{% schema %}
{
  "locales": {
    "en": {
      "foobar": "foo bar"
    }
  }
}
{% endschema %}
`;
    const input = injectSectionLocale(getSchema(file), 'foobaz', 'foo baz', []);
    const result = `
{% schema %}
{
  "locales": {
    "en": {
      "foobar": "foo bar",
      "foobaz": "foo baz"
    }
  }
}
{% endschema %}
`.trim();

    expect(input).toStrictEqual(result);
  });

  it('supports nested keys', () => {
    const file = `
{% schema %}
{
  "locales": {
    "en": {
      "foo": {
        "bar": "foo bar"
      }
    }
  }
}
{% endschema %}
`;
    const input = injectSectionLocale(
      getSchema(file),
      'foo.baz',
      'foo baz',
      [],
    );
    const result = `
{% schema %}
{
  "locales": {
    "en": {
      "foo": {
        "bar": "foo bar",
        "baz": "foo baz"
      }
    }
  }
}
{% endschema %}
`.trim();

    expect(input).toStrictEqual(result);
  });

  it(`automatically injects the "en" locale if none exist`, () => {
    const file = `
{% schema %}
{
  "locales": {}
}
{% endschema %}
`;
    const input = injectSectionLocale(getSchema(file), 'foobar', 'foo bar', []);
    const result = `
{% schema %}
{
  "locales": {
    "en": {
      "foobar": "foo bar"
    }
  }
}
{% endschema %}
`.trim();

    expect(input).toStrictEqual(result);
  });

  it(`automatically injects "locales" if property doesn't exist`, () => {
    const file = `
{% schema %}
{}
{% endschema %}
`;
    const input = injectSectionLocale(getSchema(file), 'foobar', 'foo bar', []);
    const result = `
{% schema %}
{
\t"locales": {
\t\t"en": {
\t\t\t"foobar": "foo bar"
\t\t}
\t}
}
{% endschema %}
`.trim();

    expect(input).toStrictEqual(result);
  });
});
