import {
  toLiquidAST,
  walk,
  type LiquidArgument,
} from '@shopify/liquid-html-parser';

export function parseTranslateTag(tag: string) {
  const ast = toLiquidAST(tag);
  const parameters: LiquidArgument[] = [];

  walk(ast, node => {
    // If we've already captured arguments we must have stepped into a separate `t` filter.
    if (parameters.length > 0) {
      return;
    }

    const isTranslateFilter =
      node?.type === 'LiquidFilter' && node.name === 't';

    if (!isTranslateFilter) {
      return;
    }

    parameters.push(...node.args);
  });

  return {
    parameters,
    tag,
  };
}
