import { evaluate } from 'silver-fleece';
import * as v from 'valibot';

const SettingSchema = v.looseObject({
  id: v.string(),
  label: v.string(),
  type: v.string(),
});

const NamedBlockSchema = v.looseObject({
  name: v.string(),
  type: v.string(),
  settings: v.optional(v.array(SettingSchema)),
});

export type NamedBlock = v.InferOutput<typeof NamedBlockSchema>;

export const SectionSchema = v.looseObject({
  blocks: v.optional(
    v.array(
      v.union([
        NamedBlockSchema,
        v.looseObject({
          type: v.union([v.literal('@app'), v.literal('@theme')]),
        }),
      ]),
    ),
  ),
  settings: v.optional(v.array(SettingSchema)),
});

export interface MatchedSchema {
  match: string;
  content: string;
  data: v.InferOutput<typeof SectionSchema>;
  position:
    | {
        start: number;
        end: number;
      }
    | undefined;
}

export function getSchema(string: string) {
  const matchResult = string.match(
    /{%-?\s*schema\s*-?%}(.*){%-?\s*endschema\s*-?%}/s,
  );

  if (!matchResult || !matchResult.index) {
    return;
  }

  const [match, content] = matchResult;
  const parseResult = v.safeParse(SectionSchema, evaluate(content));

  if (!parseResult.success) {
    return;
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
