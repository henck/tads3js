/**
 * How the page and the VM's worker talk to each other.
 *
 * Worker → page: postMessage() with a WorkerMessage.
 * Page → worker: at start, a StartMessage; after that the worker is usually
 * blocked waiting for input, so replies to input requests go through a
 * SharedArrayBuffer: the page writes the reply and wakes the worker with
 * Atomics.notify().
 *
 * Shared buffer layout: Int32 [0] state (0 = waiting, 1 = reply ready),
 * [1] reply kind, [2] text length, [3] data length (bytes); from byte 16 the
 * reply's text (UTF-8), then its data.
 */

import { IBannerEvent } from '../io/Host';

export const REPLY_EOF = 0;     // end of input
export const REPLY_LINE = 1;    // text = the line
export const REPLY_KEY = 2;     // text = the key
export const REPLY_FILE = 3;    // text = file name ('' = cancel), data = the file's contents (if any)

export const HEADER_BYTES = 16;
export const SHARED_BYTES = 32 * 1024 * 1024;

export interface StartMessage {
  type: 'start';
  shared: SharedArrayBuffer;
  image: Uint8Array;
  /** Don't seed the random number generator (for testing, like t3run -norand). */
  norand?: boolean;
  /** Commands to run first (an input script, as for the -i option). */
  script?: string;
  /** Present the game like an HTML TADS interpreter (IHost.html). */
  html?: boolean;
}

export type WorkerMessage =
  | { type: 'output', text: string }
  | { type: 'status', left: string, right: string }
  | { type: 'clear' }
  | { type: 'tag', name: string, attrs: { [name: string]: string }, end: boolean }
  | { type: 'banner', event: IBannerEvent }
  | { type: 'input', kind: 'line' | 'key' | 'more' }
  | { type: 'askFile', prompt: string, save: boolean, fileType: number }
  | { type: 'fileWritten', name: string, data: Uint8Array }
  | { type: 'end' }
  | { type: 'error', message: string };

/** TADS file types (inputFile). */
export const FileTypeT3Save = 15;
