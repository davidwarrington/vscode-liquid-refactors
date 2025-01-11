import { evaluate } from 'silver-fleece';

export interface MatchedSchema {
  match: string;
  content: string;
  data: Record<string, unknown>;
  position:
    | {
        start: number;
        end: number;
      }
    | undefined;
}

export function getSchema(content: string) {
  const match = content.match(
    /{%-?\s*schema\s*-?%}(.*){%-?\s*endschema\s*-?%}/s,
  );

  if (!match) {
    return;
  }

  const matchedSchema: MatchedSchema = {
    match: match[0],
    content: match[1],
    data: evaluate(match[1]),
    position:
      match.index === undefined
        ? undefined
        : {
            start: match.index,
            end: match.index + match[0].length,
          },
  };

  return matchedSchema;
}
