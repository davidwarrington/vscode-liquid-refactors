/**
 * @note Validation schemas in this module are intentionally loose and permissive.
 * We only need to check that we can inject the relevant data, not that they're
 * actually valid for Shopify
 */

import { evaluate, parse } from 'silver-fleece';
import type {
  ArrayExpression,
  Comment,
  Literal,
  Node,
  ObjectExpression,
  Property,
  Value,
} from 'silver-fleece/dist/interfaces';
import * as v from 'valibot';
import type { Locale } from '../types';

type Identifier = Literal<string>;

const NamedBlockSchema = v.looseObject({
  name: v.string(),
  type: v.string(),
  settings: v.optional(v.array(v.unknown())),
});

const LocaleSchema: v.GenericSchema<Locale> = v.record(
  v.string(),
  v.lazy(() => v.union([v.string(), LocaleSchema])),
);

const LocalesSchema = v.record(v.string(), LocaleSchema);

export function getLocales(schema: Schema) {
  const result = v.safeParse(LocalesSchema, schema.locales);

  if (!result.success) {
    return;
  }

  return result.output;
}

export const SchemaSchema = v.looseObject({
  blocks: v.optional(v.array(v.unknown())),
  settings: v.optional(v.array(v.unknown())),
  locales: v.optional(v.unknown()),
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

class JsonCWalkError extends Error {
  node: Node;

  constructor(node: Node, message: string) {
    super(message);

    this.node = node;
  }
}

type Visitor<T extends Node> = (node: T, ancestors: Node[]) => void;

function walkJsonc(
  string: string,
  visitors: {
    onArray?: Visitor<ArrayExpression>;
    onComment?: Visitor<Comment>;
    onIdentifier?: Visitor<Identifier>;
    onLiteral?: Visitor<Literal>;
    onObject?: Visitor<ObjectExpression>;
    onProperty?: Visitor<Property>;
  } = {},
) {
  const nodes: Node[] = [];

  function ancestorNodes(node: Node) {
    return nodes.filter(({ end, start }) => isWithinNode(node, [start, end]));
  }

  parse(string, {
    onComment(node) {
      nodes.unshift(node);

      const ancestors = ancestorNodes(node);

      visitors.onComment?.(node, ancestors);
    },
    onValue(node) {
      nodes.unshift(node);

      const ancestors = ancestorNodes(node);

      switch (node.type) {
        case 'ArrayExpression': {
          visitors.onArray?.(node, ancestors);
          break;
        }
        case 'Literal': {
          visitors.onLiteral?.(node, ancestors);
          break;
        }
        case 'ObjectExpression': {
          visitors.onObject?.(node, ancestors);

          node.properties.forEach(property => {
            visitors.onProperty?.(property, ancestors);
            visitors.onIdentifier?.(property.key, ancestors);
          });
          break;
        }
        default: {
          throw new JsonCWalkError(node, 'Unhandled node type');
        }
      }
    },
  });
}

export function getCurrentSchemaNode(
  schema: MatchedSchema,
  [start, end]: [number, number],
) {
  const openingSchemaTag =
    schema.match.match(/{%-?\s*schema\s*-?%}/)?.[0] ?? '';
  const offset = openingSchemaTag.length;
  const range = [start - offset, end - offset] satisfies [number, number];

  let currentNode: Value | undefined;
  const nodes: Node[] = [];

  parse(schema.content, {
    onValue(value) {
      nodes.unshift(value);

      if (isWithinNode(value, range)) {
        currentNode = value;
      }
    },
  });

  if (!currentNode) {
    return;
  }

  return [currentNode, ...ancestorNodes(currentNode)];

  function ancestorNodes(node: Node) {
    return nodes.filter(({ end, start }) => isWithinNode(node, [start, end]));
  }
}

function isWithinNode(node: Node, [start, end]: [number, number]) {
  return node.start <= start && node.end >= end;
}
