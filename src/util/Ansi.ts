/** ANSI terminal colours for debugging output. */
const style = (code: number) => (s: string) => `\x1b[${code}m${s}\x1b[0m`;
export const gray = style(90);
export const yellow = style(33);
export const boldBlue = (s: string) => `\x1b[1;34m${s}\x1b[0m`;
export const boldMagenta = (s: string) => `\x1b[1;35m${s}\x1b[0m`;
