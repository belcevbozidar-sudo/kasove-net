// Convex pagination is cursor-based (no cheap "jump to page N" at 35k+ rows),
// so listing pages page. forward/back mode instead. `cursor` in the URL is the
// token for the page currently on ("start" = first page); `h` is the
// comma-separated stack of ancestor tokens, used to build the "Previous" link.
export const START_CURSOR = "start";

export function decodeCursor(token?: string): string | null {
  if (!token || token === START_CURSOR) return null;
  return token;
}

export function decodeHistory(param?: string): string[] {
  if (!param) return [];
  return param.split(",").filter(Boolean);
}

export function nextLinkParams(currentToken: string | undefined, history: string[], continueCursor: string) {
  return {
    cursor: continueCursor,
    h: [...history, currentToken ?? START_CURSOR].join(","),
  };
}

export function prevLinkParams(history: string[]) {
  const cursor = history[history.length - 1] ?? START_CURSOR;
  const h = history.slice(0, -1).join(",");
  return { cursor, h };
}
