import snakeCase from 'lodash.snakecase';
import { patch } from 'silver-fleece';
import { Range, window, type TextEditor } from 'vscode';
import { type Command } from '../../types';
import { getCommandId } from '../../utils/get-command-id';
import {
  getNamedBlocks,
  getSchema,
  isNamedBlock,
  SchemaError,
  type MatchedSchema,
} from '../../utils/get-schema';

function injectBlockSetting(
  schema: MatchedSchema,
  blockName: string,
  name: string,
  id: string,
  value: string,
) {
  const { data } = schema;
  data.blocks ??= [];
  const block = data.blocks
    .filter(isNamedBlock)
    .find(block => block.name === blockName);

  if (!block) {
    throw new Error(`Cannot find ${JSON.stringify(blockName)} block`);
  }

  block.settings ??= [];
  block.settings.push({
    type: 'text',
    id,
    label: name,
    default: value,
  });

  return schema.match.replace(schema.content, patch(schema.content, data));
}

export const extractToBlockSetting: Command = Object.assign(
  async function extractToBlockSetting(
    editor: TextEditor,
  ): Promise<Disposable | void> {
    try {
      if (editor.selection.isEmpty) {
        throw new Error('Cannot refactor empty string');
      }

      const highlightedText = editor.document.getText(editor.selection);
      const schema = getSchema(editor.document.getText());

      const blockName = await window.showQuickPick(
        getNamedBlocks(schema.data).map(block => block.name),
      );

      if (blockName === undefined) {
        console.log('[extract-to-block-setting] Cancelled');
        return;
      }

      const settingName = await window.showInputBox({
        placeHolder: 'Setting name',
      });

      const isCancelled = settingName === undefined;

      if (isCancelled) {
        console.log('[extract-to-block-setting] Cancelled');
        return;
      }

      if (settingName === '') {
        throw new Error('Setting name must not be blank');
      }

      const settingId = snakeCase(settingName);

      const start = editor.document.positionAt(schema.position.start);
      const end = editor.document.positionAt(schema.position.end);
      const newSchema = injectBlockSetting(
        schema,
        blockName,
        settingName,
        settingId,
        highlightedText,
      );

      editor.edit(edit => {
        edit.replace(editor.selection, `{{ block.settings.${settingId} }}`);
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
      title: 'Extract to block setting',
      id: getCommandId('extractToBlockSetting'),
      isAvailable(editor: TextEditor) {
        try {
          const schema = getSchema(editor.document.getText());

          const blocks = getNamedBlocks(schema.data);

          return blocks.length > 0 && !editor.selection.isEmpty;
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
