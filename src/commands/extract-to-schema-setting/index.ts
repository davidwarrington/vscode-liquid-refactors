import snakeCase from 'lodash.snakecase';
import { patch } from 'silver-fleece';
import { Range, window, type TextEditor } from 'vscode';
import { Command } from '../../types';
import { getCommandId } from '../../utils/get-command-id';
import {
  getSchema,
  SchemaError,
  type MatchedSchema,
} from '../../utils/get-schema';

function injectSchemaSetting(
  schema: MatchedSchema,
  name: string,
  id: string,
  value: string,
) {
  const { data } = schema;

  data.settings ??= [];
  data.settings.push({
    type: 'text',
    id,
    label: name,
    default: value,
  });

  return schema.match.replace(schema.content, patch(schema.content, data));
}

export const extractToSchemaSetting: Command = Object.assign(
  async function extractToSchemaSetting(
    editor: TextEditor,
  ): Promise<Disposable | void> {
    try {
      if (editor.selection.isEmpty) {
        throw new Error('Cannot refactor empty string.');
      }

      const highlightedText = editor.document.getText(editor.selection);
      const schema = getSchema(editor.document.getText());

      const settingName = await window.showInputBox({
        placeHolder: 'Setting name',
      });

      const isCancelled = settingName === undefined;

      if (isCancelled) {
        console.log('[extract-to-schema-setting] Cancelled');
        return;
      }

      if (settingName === '') {
        throw new Error('Setting name must not be blank');
      }

      const settingId = snakeCase(settingName);
      const parentDirectory = editor.document.fileName.split('/').at(-2);
      const type = parentDirectory === 'sections' ? 'section' : 'block';

      const start = editor.document.positionAt(schema.position.start);
      const end = editor.document.positionAt(schema.position.end);
      const newSchema = injectSchemaSetting(
        schema,
        settingName,
        settingId,
        highlightedText,
      );

      editor.edit(edit => {
        edit.replace(editor.selection, `{{ ${type}.settings.${settingId} }}`);
        edit.replace(new Range(start, end), newSchema);
      });
    } catch (error) {
      if (error instanceof Error) {
        window.showErrorMessage(error.message);
      }

      throw error;
    }
  },
  {
    meta: {
      title: 'Extract to schema setting',
      id: getCommandId('extractToSchemaSetting'),
      isAvailable(editor: TextEditor) {
        try {
          getSchema(editor.document.getText());

          return !editor.selection.isEmpty;
        } catch (error) {
          if (error instanceof SchemaError) {
            return false;
          }

          throw error;
        }
      },
    },
  },
);
