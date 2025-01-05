import { name as extensionName } from '../../package.json';

export function getCommandId(name: string) {
  return `${extensionName}.${name}`;
}
