import * as P from './protocol';
import { SaveStore } from './SaveStore';
import { Vm } from '../Vm';
import { Platform, memoryPlatform } from '../Platform';
import { InputPending, IBannerEvent } from '../io/Host';
import { readResources } from '../blocks/MRES';
import { GameHost, GameFileSystem, Reply } from './GameHost';

/*
 * The page side of the browser host, for any presentation: runs the VM,
 * passes its output and requests to the presentation's handlers, and sends
 * the replies. Saved games go to the browser's storage (and, if asked, a
 * download).
 *
 * The VM runs in a Web Worker when the page is cross-origin isolated (served
 * with COOP/COEP headers: the worker needs SharedArrayBuffer), so long turns
 * don't hold up the page. Otherwise it runs on the page itself, pausing
 * whenever it waits for input. That works on any web server, and on sites
 * such as itch.io that show games in an iframe.
 */

/** What a presentation implements. */
export interface GameHandlers {
  /** Formatted text ('\n' ends a line). */
  output(text: string): void;
  /** The status line. */
  status?(left: string, right: string): void;
  /** Clear the main window. */
  clear?(): void;
  /** A banner window was created, changed or removed (HTML mode). */
  banner?(event: IBannerEvent): void;
  /** A custom tag from the game (<x-name ...>): data for the presentation. */
  tag?(name: string, attrs: { [name: string]: string }, end: boolean): void;
  /** The game waits for a command: reply with sendLine(). */
  inputLine(): void;
  /** The game waits for a key: reply with sendKey(). */
  inputKey(): void;
  /** A "more" prompt: reply with sendKey() when the player is ready to go on. */
  more(): void;
  /** A file dialog: reply with sendFile() (see FileDialog for a ready-made one). */
  askFile(prompt: string, save: boolean, fileType: number): void;
  /** The game has ended (with an error message, if it failed). */
  end(error?: string): void;
}

export type Waiting = 'line' | 'key' | 'more' | 'file' | null;

/**
 * Where the VM runs: 'worker' (needs cross-origin isolation), 'page', or
 * 'auto' (the worker if possible).
 */
export type RunMode = 'auto' | 'worker' | 'page';

export class GameClient {
  /** What the game is waiting for. */
  public waiting: Waiting = null;
  /** Identifies the game (a hash of its image), for its saved games. */
  public gameID = '';
  /** The game's name (for download file names). */
  public gameName = '';
  /** Saved games in the browser (null if the browser has no storage). */
  public store: SaveStore = null;
  /** Where the VM runs (after start()). */
  public runsIn: 'worker' | 'page' = null;
  /** Present the game like an HTML TADS interpreter (set before start()). */
  public html = false;

  private image: Uint8Array = null;
  private resources: Map<string, { offset: number, size: number }> = null;
  private resourceURLs = new Map<string, string>();

  private pendingSave: { name: string, download: boolean } = null;
  // In a worker: the shared buffer for replies.
  private control: Int32Array;
  private shared: Uint8Array;
  // On the page: passes a reply to the paused VM.
  private replyInPage: (r: Reply) => void = null;

  /**
   * @param workerURL The VM's worker script (tads3js-worker.js), or null to
   *   always run the VM on the page
   * @param handlers The presentation
   * @param mode Where to run the VM
   */
  constructor(private workerURL: string | null, private handlers: GameHandlers, private mode: RunMode = 'auto') {}

  /**
   * Optional: make the page cross-origin isolated with the service worker in
   * coi-sw.js, if the server doesn't send the headers (this reloads the
   * page), so the VM can run in a worker. False if isolation isn't possible.
   */
  static async isolate(serviceWorkerURL = 'coi-sw.js'): Promise<boolean> {
    if((window as any).crossOriginIsolated) return true;
    if(!window.isSecureContext || !('serviceWorker' in navigator)) return false;
    if(sessionStorage.getItem('tads3js-isolate')) {
      sessionStorage.removeItem('tads3js-isolate');
      return false;
    }
    await navigator.serviceWorker.register(serviceWorkerURL);
    await navigator.serviceWorker.ready;
    sessionStorage.setItem('tads3js-isolate', '1');
    location.reload();
    return new Promise(() => {});
  }

  /** Fetch a game image. */
  static async fetchImage(url: string): Promise<Uint8Array> {
    let response = await fetch(url);
    if(!response.ok) throw new Error(response.status + ' ' + response.statusText);
    return new Uint8Array(await response.arrayBuffer());
  }

  /** Start the game. */
  async start(image: Uint8Array, name: string) {
    this.gameName = name.replace(/^.*\//, '').replace(/\.t3$/i, '');
    this.image = image;
    this.gameID = await GameClient.hashOf(image);
    try {
      this.store = await SaveStore.open();
    } catch(e) {
      this.store = null;
      console.warn('No browser storage for saved games:', e);
    }
    let canUseWorker = !!this.workerURL && !!(self as any).crossOriginIsolated
      && typeof SharedArrayBuffer != 'undefined';
    if(this.mode == 'worker' || (this.mode == 'auto' && canUseWorker)) this.startWorker(image);
    else this.startInPage(image);
  }

  /** Run the VM in a worker. */
  private startWorker(image: Uint8Array) {
    this.runsIn = 'worker';
    let buffer = new SharedArrayBuffer(P.SHARED_BYTES);
    this.control = new Int32Array(buffer, 0, 4);
    this.shared = new Uint8Array(buffer, P.HEADER_BYTES);
    let worker = new Worker(this.workerURL);
    worker.onmessage = (e: MessageEvent) => this.receive(e.data as P.WorkerMessage);
    worker.onerror = (e) => this.handlers.end(e.message);
    let start: P.StartMessage = { type: 'start', shared: buffer, image: image, html: this.html };
    worker.postMessage(start);
  }

  /** Run the VM on the page: it pauses when it waits for input, and resumes with the reply. */
  private startInPage(image: Uint8Array) {
    this.runsIn = 'page';
    const post = (msg: P.WorkerMessage) => this.receive(msg);
    let vm = Vm.getInstance();
    let host: GameHost = null;

    // Run the VM until it pauses or the game ends.
    const step = (run: () => void) => {
      try {
        run();
        if(vm.isPaused()) return;
        host.flush();
        post({ type: 'end' });
      } catch(ex) {
        host.flush();
        post({ type: 'error', message: ex instanceof Error ? ex.message : String(ex) });
        console.error(ex);
      }
    };

    // A request: the reply, if it has come; else send the request and pause.
    let reply: Reply = null, asked = false;
    const wait = (request: P.WorkerMessage): Reply => {
      if(reply) {
        let r = reply;
        reply = null;
        asked = false;
        return r;
      }
      if(!asked) {
        asked = true;
        post(request);
      }
      throw new InputPending();
    };
    // (Resume after the presentation's event handler has finished.)
    this.replyInPage = (r) => {
      reply = r;
      setTimeout(() => step(() => vm.resume()), 0);
    };

    // A delay: pause, and resume when the time is up.
    let slept = false, sleeping = false;
    const delay = (ms: number) => {
      if(slept) {
        slept = false;
        return;
      }
      if(!sleeping) {
        sleeping = true;
        setTimeout(() => { sleeping = false; slept = true; step(() => vm.resume()); }, ms);
      }
      throw new InputPending();
    };

    let fs = new GameFileSystem(post);
    Platform.set(memoryPlatform(fs));
    host = new GameHost(post, fs, wait, delay);
    host.html = this.html;
    vm.host = host;
    // (Start after the caller has finished setting up.)
    setTimeout(() => step(() => {
      vm.loadImage(image);
      vm.run();
    }), 0);
  }

  private receive(msg: P.WorkerMessage) {
    let h = this.handlers;
    switch(msg.type) {
      case 'output': h.output(msg.text); break;
      case 'status': if(h.status) h.status(msg.left, msg.right); break;
      case 'clear': if(h.clear) h.clear(); break;
      case 'tag': if(h.tag) h.tag(msg.name, msg.attrs, msg.end); break;
      case 'banner': if(h.banner) h.banner(msg.event); break;
      case 'input':
        this.waiting = msg.kind;
        if(msg.kind == 'line') h.inputLine();
        else if(msg.kind == 'more') h.more();
        else h.inputKey();
        break;
      case 'askFile': this.waiting = 'file'; h.askFile(msg.prompt, msg.save, msg.fileType); break;
      case 'fileWritten': this.fileWritten(msg.name, msg.data); break;
      case 'end': this.waiting = null; h.end(); break;
      case 'error': this.waiting = null; h.end(msg.message); break;
    }
  }

  /**
   * A URL for a resource embedded in the game image (an image, sound...),
   * or null if there's none of that name.
   */
  resourceURL(name: string): string | null {
    let key = name.toLowerCase();
    let url = this.resourceURLs.get(key);
    if(url) return url;
    if(!this.resources) this.resources = readResources(this.image);
    let r = this.resources.get(key);
    if(!r) return null;
    let ext = key.replace(/^.*\./, '');
    let type = RESOURCE_TYPES[ext] || 'application/octet-stream';
    url = URL.createObjectURL(new Blob([this.image.subarray(r.offset, r.offset + r.size)], { type: type }));
    this.resourceURLs.set(key, url);
    return url;
  }

  // Replies

  private reply(kind: number, text = '', data?: Uint8Array) {
    this.waiting = null;
    if(this.replyInPage) {
      this.replyInPage({ kind: kind, text: text, data: data || new Uint8Array(0) });
      return;
    }
    let t = new TextEncoder().encode(text);
    let length = data ? data.length : 0;
    if(t.length + length > P.SHARED_BYTES - P.HEADER_BYTES) throw new Error('reply too large');
    this.shared.set(t, 0);
    if(data) this.shared.set(data, t.length);
    this.control[1] = kind;
    this.control[2] = t.length;
    this.control[3] = length;
    Atomics.store(this.control, 0, 1);
    Atomics.notify(this.control, 0, 1);
  }

  /** Reply to inputLine(). */
  sendLine(line: string) {
    if(this.waiting == 'line') this.reply(P.REPLY_LINE, line);
  }

  /** Reply to inputKey() (a character, '\n', or a TADS key name like '[up]'), or to more(). */
  sendKey(key: string) {
    if(this.waiting == 'key' || this.waiting == 'more') this.reply(P.REPLY_KEY, key);
  }

  /**
   * Reply to askFile(): the file name ('' to cancel). A file to open comes
   * with its contents. For a file to save, 'download' says whether the
   * file is also downloaded (saved games are always kept in the browser,
   * if it can).
   */
  sendFile(name: string, data?: Uint8Array, download = false) {
    if(this.waiting != 'file') return;
    if(name && !data) this.pendingSave = { name: name, download: download };
    this.reply(P.REPLY_FILE, name, data);
  }

  /** A file the game wrote: a saved game goes to the browser's storage (and maybe a download). */
  private async fileWritten(name: string, data: Uint8Array) {
    if(!this.pendingSave || this.pendingSave.name != name) return;
    let download = this.pendingSave.download;
    this.pendingSave = null;
    if(this.store) {
      try {
        await this.store.put({ game: this.gameID, name: name, date: new Date(), data: data });
      } catch(e) {
        console.warn('The game could not be stored in the browser:', e);
        download = true;
      }
    } else {
      download = true;
    }
    if(download) GameClient.download(this.downloadName(name), data);
  }

  /** A file name for downloading a saved game. */
  downloadName(name: string) {
    return (this.gameName + ' - ' + name).replace(/[\\/:*?"<>|]/g, '_') + '.sav';
  }

  static download(name: string, data: Uint8Array) {
    let url = URL.createObjectURL(new Blob([data], { type: 'application/octet-stream' }));
    let a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  private static async hashOf(data: Uint8Array): Promise<string> {
    try {
      let digest = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
      return Array.from(digest.slice(0, 12)).map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch(e) {
      return 'size-' + data.length;
    }
  }
}

const RESOURCE_TYPES: { [ext: string]: string } = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', mng: 'video/x-mng',
  mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav', mid: 'audio/midi', midi: 'audio/midi', txt: 'text/plain',
};

/** TADS key names for keyboard events (for inputKey()); undefined for keys that aren't input. */
export function keyName(e: KeyboardEvent): string | undefined {
  if(e.key.length == 1) return e.key;
  return KEY_NAMES[e.key];
}

const KEY_NAMES: { [k: string]: string } = {
  Enter: '\n', Tab: '\t', Backspace: '[bksp]', Escape: '[esc]', Delete: '[del]',
  ArrowUp: '[up]', ArrowDown: '[down]', ArrowLeft: '[left]', ArrowRight: '[right]',
  Home: '[home]', End: '[end]', PageUp: '[page up]', PageDown: '[page down]',
  F1: '[f1]', F2: '[f2]', F3: '[f3]', F4: '[f4]', F5: '[f5]', F6: '[f6]',
  F7: '[f7]', F8: '[f8]', F9: '[f9]', F10: '[f10]',
};
