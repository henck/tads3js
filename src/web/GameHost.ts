import { IHost, IBannerEvent } from '../io/Host';
import { MemoryFileSystem } from '../Platform';
import * as P from './protocol';

/*
 * The VM's host in a browser: output and requests go to the page as
 * WorkerMessages (see protocol.ts). How a request waits for its reply
 * depends on where the VM runs:
 *   - in a Web Worker: it blocks on a SharedArrayBuffer (worker.ts);
 *   - on the page itself: the VM pauses (InputPending) and is resumed when
 *     the reply comes (client.ts).
 */

export interface Reply {
  kind: number;        // P.REPLY_...
  text: string;
  data: Uint8Array;
}

export type Post = (msg: P.WorkerMessage, transfer?: Transferable[]) => void;

/** Files in memory; files written (saved games, ...) are sent to the page too. */
export class GameFileSystem extends MemoryFileSystem {
  constructor(private post: Post) { super(); }

  writeFile(name: string, data: Uint8Array | string) {
    super.writeFile(name, data);
    let copy = this.files.get(name).slice();
    this.post({ type: 'fileWritten', name: name, data: copy }, [copy.buffer]);
  }
}

export class GameHost implements IHost {
  public lineWidth = 0;   // the page wraps lines
  public html = false;    // HTML mode (banner windows, images...)
  private out = '';

  /**
   * @param post Sends a message to the page
   * @param fs The files (a file to open comes with the reply to its dialog)
   * @param wait Sends a request and returns the reply (blocking, or pausing the VM)
   * @param delay Waits for a number of milliseconds
   */
  constructor(private post: Post, private fs: MemoryFileSystem,
              private wait: (msg: P.WorkerMessage) => Reply, private delay: (ms: number) => void) {}

  write(text: string) {
    this.out += text;
    if(this.out.length > 16384) this.flush();
  }

  flush() {
    if(this.out) this.post({ type: 'output', text: this.out });
    this.out = '';
  }

  setStatus(left: string, right: string) {
    this.flush();
    this.post({ type: 'status', left: left, right: right });
  }

  tag(name: string, attrs: { [name: string]: string }, end: boolean) {
    this.flush();
    this.post({ type: 'tag', name: name, attrs: attrs, end: end });
  }

  banner(e: IBannerEvent) {
    this.flush();
    this.post({ type: 'banner', event: e });
  }

  clear() {
    this.out = '';
    this.post({ type: 'clear' });
  }

  sleep(ms: number) {
    this.flush();
    this.delay(ms);
  }

  private request(msg: P.WorkerMessage): Reply {
    this.flush();
    return this.wait(msg);
  }

  readLine(): string | null {
    let r = this.request({ type: 'input', kind: 'line' });
    return r.kind == P.REPLY_EOF ? null : r.text;
  }

  readKey(): string | null {
    let r = this.request({ type: 'input', kind: 'key' });
    return r.kind == P.REPLY_EOF ? null : r.text;
  }

  morePrompt() {
    this.request({ type: 'input', kind: 'more' });
  }

  askFile(prompt: string, save: boolean, fileType: number): string | null {
    let r = this.request({ type: 'askFile', prompt: prompt, save: save, fileType: fileType });
    if(r.kind == P.REPLY_EOF) return null;
    // A file to open comes with its contents.
    if(r.text && !save) this.fs.files.set(r.text, r.data);
    return r.text;
  }
}
