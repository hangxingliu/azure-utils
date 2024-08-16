export type MatchedTag = {
  content: string;
  next: number;
};

export function matchXMLTag(
  str: string,
  required: true,
  tagName: string,
  startPos?: number
): MatchedTag;

export function matchXMLTag(
  str: string,
  required: false,
  tagName: string,
  startPos?: number
): MatchedTag | undefined;

export function matchXMLTag(
  str: string,
  required: boolean,
  tagName: string,
  startPos = 0
): MatchedTag | undefined {
  const openTag = `<${tagName}>`;
  const closeTag = `</${tagName}>`;

  let i = str.indexOf(openTag, startPos);
  if (i < 0) {
    if (!required) return;
    throw new Error(`Failed to match the tag ${openTag} in "${diagnosis(str, startPos)}"`);
  }

  i += openTag.length;
  const j = str.indexOf(closeTag, i);
  if (j < 0) {
    if (!required) return;
    throw new Error(`Failed to match the tag ${closeTag} in "${diagnosis(str, i)}"`);
  }

  return { content: str.slice(i, j), next: j + closeTag.length };
}

function diagnosis(str: string, startPos: number) {
  if (startPos > 0) str = str.slice(startPos);
  if (str.length > 64) return str.slice(0, 64) + "...";
  return str;
}
