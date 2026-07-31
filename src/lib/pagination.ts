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

// `history[k-1]` is the cursor that was used to fetch page k (history[0] is
// always START_CURSOR by construction — see nextLinkParams). Jumping back to
// an earlier page the user has actually visited is therefore free: no Convex
// call, just slicing the stack already accumulated while browsing forward.
// Only reliable for pages reached by normal forward navigation — a page
// reached via a direct jump (see jumpToLastPage) has no such history to pop,
// so this safely falls back to page 1 rather than guessing.
export function backNPagesParams(history: string[], currentPage: number, n: number) {
  const targetPage = Math.max(1, currentPage - n);
  if (targetPage <= 1) return { cursor: START_CURSOR, h: "" };
  return {
    cursor: history[targetPage - 1] ?? START_CURSOR,
    h: history.slice(0, targetPage - 1).join(","),
  };
}
