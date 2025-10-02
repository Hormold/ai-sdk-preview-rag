import type { MessagePart } from "../types";

const REDIRECT_TYPES = [
  'tool-redirectToDocs',
  'tool-redirectToSlack',
  'tool-redirectToExternalURL',
  'tool-openTester'
];

/**
 * Reorders message parts to move redirect buttons after text content
 * This improves UX when redirect buttons arrive before the actual text response
 */
export function reorderMessageParts(parts: MessagePart[], isUser: boolean): MessagePart[] {
  if (isUser) return parts;

  // Separate redirect buttons from other parts
  const redirectButtons: MessagePart[] = [];
  const otherParts: MessagePart[] = [];

  parts.forEach((part) => {
    if (REDIRECT_TYPES.includes(part.type)) {
      redirectButtons.push(part);
    } else {
      otherParts.push(part);
    }
  });

  // If no redirects or no other parts, return as is
  if (redirectButtons.length === 0 || otherParts.length === 0) {
    return parts;
  }

  // Find the LAST text part to insert redirects after it
  let lastTextIndex = -1;
  for (let i = otherParts.length - 1; i >= 0; i--) {
    if (otherParts[i].type === 'text') {
      lastTextIndex = i;
      break;
    }
  }

  // If no text found, just append redirects at the end
  if (lastTextIndex === -1) {
    return [...otherParts, ...redirectButtons];
  }

  // Insert all redirect buttons after the last text part
  const result = [...otherParts];
  result.splice(lastTextIndex + 1, 0, ...redirectButtons);
  return result;
}

export function getToolLabel(type: string): string {
  switch (type) {
    case 'tool-getInformation':
      return 'Searching knowledge base';
    case 'tool-addResource':
      return 'Adding resource';
    case 'tool-understandQuery':
      return 'Understanding query';
    case 'tool-knowledgeSearch':
      return 'Searching documents';
    case 'tool-getFullDocument':
      return 'Reading documentation';
    case 'tool-getSDKChangelog':
      return 'Exploring changelog';
    default:
      return 'Processing';
  }
}
