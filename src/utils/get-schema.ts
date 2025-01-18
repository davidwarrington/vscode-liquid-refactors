/**
 * @note Validation schemas in this module are intentionally loose and permissive.
 * We only need to check that we can inject the relevant data, not that they're
 * actually valid for Shopify
 */

import { evaluate } from 'silver-fleece';
import * as v from 'valibot';

const NamedBlockSchema = v.looseObject({
  name: v.string(),
  type: v.string(),
  settings: v.optional(v.array(v.unknown())),
});

export const SchemaSchema = v.looseObject({
  blocks: v.optional(v.array(v.unknown())),
  settings: v.optional(v.array(v.unknown())),
});

type NamedBlock = v.InferOutput<typeof NamedBlockSchema>;
type Schema = v.InferOutput<typeof SchemaSchema>;

export function isNamedBlock(
  block: NonNullable<Schema['blocks']>[number],
): block is NamedBlock {
  return v.safeParse(NamedBlockSchema, block).success;
}

export function getNamedBlocks(schema: Schema) {
  return (schema.blocks ?? []).filter(isNamedBlock);
}

export interface MatchedSchema {
  match: string;
  content: string;
  data: v.InferOutput<typeof SchemaSchema>;
  position: {
    start: number;
    end: number;
  };
}

export class SchemaError extends Error {}

export function getSchema(string: string) {
  const matchResult = string.match(
    /{%-?\s*schema\s*-?%}(.*){%-?\s*endschema\s*-?%}/s,
  );

  if (!matchResult || !matchResult.index) {
    throw new SchemaError('Cannot find schema');
  }

  const [match, content] = matchResult;
  const parseResult = v.safeParse(SchemaSchema, evaluate(content));

  if (!parseResult.success) {
    throw new SchemaError('Could not parse schema');
  }

  const matchedSchema: MatchedSchema = {
    match,
    content,
    data: parseResult.output,
    position: {
      start: matchResult.index,
      end: matchResult.index + matchResult[0].length,
    },
  };

  return matchedSchema;
}
