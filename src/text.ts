import { escapeHtml } from './format';

export function noPermissionText(chatName?: string): string {
  const where = chatName ? `in <b>${escapeHtml(chatName)}</b>` : 'in this chat';
  return `<i>I can't send messages ${where} — an admin needs to grant me the Send Messages permission.</i>`;
}
