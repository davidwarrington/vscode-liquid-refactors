import { describe, expect, it } from 'vitest';
import { parseTranslateTag } from './parse-translate-tag';

describe(parseTranslateTag, () => {
  it.skip('works', () => {
    expect(
      parseTranslateTag(
        `{{ 'pagination.page_x_of_y' | t: x: 12, y: collection.products.size }}`,
      ),
    ).toBe(false);
  });
});
