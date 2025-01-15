import snakeCase from 'lodash.snakecase';
import { patch } from 'silver-fleece';
import { Range, window, type TextEditor } from 'vscode';
import { type Command } from '../../types';
import { getCommandId } from '../../utils/get-command-id';
import {
  getSchema,
  type MatchedSchema,
  type NamedBlock,
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
  const block = data.blocks.find(
    (block): block is NamedBlock => block.name === blockName,
  );

  if (!block) {
    throw new Error(
      `[extract-to-block-settings] cannot find ${JSON.stringify(blockName)} block`,
    );
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

function canInjectBlockSetting(schema: Record<string, unknown>) {
  if (!('blocks' in schema) || !Array.isArray(schema.blocks)) {
    return false;
  }

  return schema.blocks.every(block => {
    if (typeof block !== 'object') {
      return false;
    }

    if (block.type === '@app') {
      return true;
    }

    if (block.type === '@theme') {
      return false;
    }

    return Object.keys(block).some(key => key !== 'type');
  });
}

function getValidBlocks(schema: MatchedSchema['data']) {
  return (schema.blocks ?? []).filter(
    (block): block is NamedBlock => 'name' in block,
  );
}

export const extractToBlockSetting: Command = Object.assign(
  async function extractToBlockSetting(
    editor: TextEditor,
  ): Promise<Disposable | void> {
    try {
      if (editor.selection.isEmpty) {
        throw new Error('Cannot refactor empty string.');
      }

      const highlightedText = editor.document.getText(editor.selection);
      const schema = getSchema(editor.document.getText());

      if (!schema || !schema.position) {
        throw new Error('Cannot find schema.');
      }

      if (!canInjectBlockSetting(schema.data)) {
        throw new Error('Cannot inject block setting');
      }

      const blockName = await window.showQuickPick(
        getValidBlocks(schema.data).map(block => block.name),
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
        const schema = getSchema(editor.document.getText());

        if (!schema) {
          return false;
        }

        const blocks = getValidBlocks(schema.data);

        return blocks.length > 0 && !editor.selection.isEmpty;
      },
    },
  },
);
