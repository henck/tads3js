import { Platform } from '../Platform';

const files = () => Platform.get().fs;
import { IHost, IBannerEvent } from "./Host";
import { TextFormatter } from "./Formatter";
import { Input } from "./Input";

// Log file types (setLogFile).
export const LogTypeTranscript = 1;
export const LogTypeCommand = 2;
export const LogTypeScript = 3;

/** The special logConsoleSay() handle for the main window's transcript. */
export const MainWindowLogHandle = -1;

interface IBanner {
  handle: number;
  parent: number;
  align: number;
  size: number;
  sizeUnits: number;
  autoSize: boolean;
  dirty: boolean;      // changed since the host was last told
  style: number;
  text: string;
  html: string;
  formatter: TextFormatter;
}

interface ILogConsole {
  formatter: TextFormatter;
  file: string;
}

/**
 * The main console: output through the text formatter to the host (and a
 * transcript file, if one is being recorded), input from scripts or the
 * host, the status line, and log consoles.
 */
export class Console {
  public readonly host: IHost;
  public readonly input: Input;
  private formatter: TextFormatter;

  private transcript: string = null;   // names of the log files being recorded
  private commandLog: string = null;
  private commandLogType = LogTypeCommand;

  private statusMode = 0;
  private statusText = '';
  private statusRightText = '';

  private banners = new Map<number, IBanner>();
  private nextBannerHandle = 1;

  private logConsoles = new Map<number, ILogConsole>();
  private nextLogHandle = 1;
  private promptShown: string = null;   // a prompt shown, waiting for the response

  constructor(host: IHost) {
    this.host = host;
    let width = host.lineWidth === undefined ? 80 : host.lineWidth || 1000000000;
    this.formatter = new TextFormatter((s) => this.display(s), width);
    this.formatter.hideBanners = !!host.html;
    if(host.tag) this.formatter.extTag = (name, attrs, end) => {
      let obj: { [name: string]: string } = {};
      attrs.forEach((v, k) => obj[k] = v);
      host.tag(name, obj, end);
    };
    this.input = new Input(host, (s) => this.display(s));
  }

  /** Display text in the main window (or the status line, in status mode). */
  say(text: string) {
    if(this.statusMode == 1) this.statusText += text;
    else this.formatter.say(text);
  }

  /** Formatted output, to the host and the transcript. */
  private display(text: string) {
    if(!this.input.isQuiet()) this.host.write(text);
    if(this.transcript !== null) files().appendFile(this.transcript, text);
  }

  /** Clear the screen, if the host can. */
  clearScreen() {
    this.formatter.trimPartial();
    if(this.host.clear) this.host.clear();
  }

  /** At the end of the program. */
  finish() {
    this.formatter.finish();
    this.setLogFile(null, LogTypeTranscript);
    this.setLogFile(null, LogTypeCommand);
    for(let h of Array.from(this.logConsoles.keys())) this.logConsoleClose(h);
  }

  // Input

  /** Read a line of input (null at the end of input). */
  readLine(): string | null {
    this.formatter.flushPartial();
    this.flushBanners();
    let fromScript = this.input.scriptStatus() !== null;
    let line = this.input.readLine();
    if(line !== null) {
      // Input typed at the console is echoed by the terminal: log it.
      if(!fromScript && this.transcript !== null) files().appendFile(this.transcript, line + '\n');
      this.logCommand('line', line);
    }
    return line;
  }

  /** A "more" prompt: wait for a key, if the host can (input scripts don't answer it). */
  morePrompt() {
    if(!this.host.morePrompt || this.input.scriptStatus() !== null) return;
    this.formatter.flushPartial();
    this.flushBanners();
    this.host.morePrompt();
  }

  readKey(): string | null {
    this.formatter.flushPartial();
    this.flushBanners();
    let key = this.input.readKey();
    if(key !== null) this.logCommand('key', key);
    return key;
  }

  /**
   * The response to a dialog or file prompt: a script event of that type
   * (taken without showing the prompt), or else a line read from the host
   * after showing the prompt. (Like the reference interpreter, this
   * doesn't read lines from a command script.)
   */
  readResponse(prompt: string, type: string, ask?: () => string | null): string | null {
    let r = this.input.scriptEvent(type);
    if(r === null) this.flushBanners();
    if(r === null && ask) {
      this.formatter.flushPartial();
      r = ask();
    } else if(r === null) {
      // (If the host makes the program pause for the response, this runs
      // again when it resumes: show the prompt only once.)
      if(this.promptShown !== prompt) {
        this.formatter.say(prompt);
        this.formatter.flushPartial();
        this.promptShown = prompt;
      }
      r = this.host.readLine();
      this.promptShown = null;
    }
    if(r !== null) this.logCommand(type, r);
    return r;
  }

  private logCommand(type: string, text: string) {
    if(this.commandLog === null) return;
    if(this.commandLogType == LogTypeScript) files().appendFile(this.commandLog, `<${type}>${text}\n`);
    else if(type == 'line') files().appendFile(this.commandLog, `>${text}\n`);
  }

  // Status line

  setStatusMode(mode: number) {
    if(this.statusMode == 1 && mode != 1) this.updateStatus();
    if(mode == 1) this.statusText = '';
    this.statusMode = mode;
  }

  setStatusRight(text: string) {
    this.statusRightText = text;
    this.updateStatus();
  }

  private updateStatus() {
    if(this.host.setStatus) this.host.setStatus(Console.plainText(this.statusText), Console.plainText(this.statusRightText));
  }

  /** Text formatted on a single line (for the status line). */
  static plainText(text: string): string {
    let out = '';
    let f = new TextFormatter((s) => out += s, 100000);
    f.say(text);
    f.finish();
    return out.replace(/\n+/g, ' ').trim();
  }

  // Banner windows (only when the host is in HTML mode)

  bannerCreate(parent: number, where: number, other: number, align: number, size: number, sizeUnits: number, style: number): number | null {
    if(!this.host.html) return null;
    if(parent && !this.banners.has(parent)) return null;
    let b: IBanner = { handle: this.nextBannerHandle++, parent: parent, align: align, size: size, sizeUnits: sizeUnits,
                       autoSize: false, dirty: false, style: style, text: '', html: '', formatter: null };
    b.formatter = new TextFormatter((s) => b.text += s, 1000000000);
    this.banners.set(b.handle, b);
    if(this.host.banner) this.host.banner({ op: 'create', handle: b.handle, parent: parent, where: where, other: other,
                                            align: align, size: size, sizeUnits: sizeUnits, style: style });
    return b.handle;
  }

  private bannerEvent(op: 'delete' | 'update', b: IBanner) {
    if(!this.host.banner) return;
    let e: IBannerEvent = { op: op, handle: b.handle };
    if(op == 'update') Object.assign(e, { size: b.size, sizeUnits: b.sizeUnits, autoSize: b.autoSize, text: b.text, html: b.html });
    this.host.banner(e);
  }

  /** A banner window, or null if the handle isn't valid. */
  private banner(handle: number): IBanner | null {
    return this.banners.get(handle) || null;
  }

  bannerDelete(handle: number) {
    let b = this.banner(handle);
    if(!b) return;
    for(let child of Array.from(this.banners.values())) if(child.parent == handle) this.bannerDelete(child.handle);
    this.banners.delete(handle);
    this.bannerEvent('delete', b);
  }

  bannerClear(handle: number) {
    let b = this.banner(handle);
    if(!b) return;
    b.formatter = new TextFormatter((s) => b.text += s, 1000000000);
    b.text = b.html = '';
    b.dirty = true;
  }

  bannerSay(handle: number, text: string) {
    let b = this.banner(handle);
    if(!b) return;
    b.html += text;
    b.formatter.say(text);
    b.dirty = true;
  }

  bannerFlush(handle: number) {
    let b = this.banner(handle);
    if(!b) return;
    b.formatter.flushPartial();
    b.dirty = false;
    this.bannerEvent('update', b);
  }

  /**
   * Show what has changed in the banners (as an HTML interpreter does
   * whenever the program waits for input or pauses).
   */
  flushBanners() {
    this.banners.forEach((b) => { if(b.dirty) this.bannerFlush(b.handle); });
  }

  /** Pause (timeDelay), if the host can. */
  sleep(ms: number) {
    if(!this.host.sleep) return;
    this.formatter.flushPartial();
    this.flushBanners();
    this.host.sleep(ms);
  }

  bannerSetSize(handle: number, size: number, sizeUnits: number) {
    let b = this.banner(handle);
    if(!b) return;
    b.size = size;
    b.sizeUnits = sizeUnits;
    b.autoSize = false;
    this.bannerEvent('update', b);
  }

  /** Make the banner just big enough for its contents. */
  bannerSizeToContents(handle: number) {
    let b = this.banner(handle);
    if(!b) return;
    b.autoSize = true;
    this.bannerFlush(handle);
  }

  /** [align, style, rows, columns, pixel height, pixel width], or null. */
  bannerInfo(handle: number): number[] | null {
    let b = this.banner(handle);
    if(!b) return null;
    let rows = Math.max(1, b.text.split('\n').length);
    return [b.align, b.style, rows, 80, rows * 16, 640];
  }

  // Logging

  /** Start (or, with a null name, stop) a transcript or command log. */
  setLogFile(name: string | null, type: number): boolean {
    let isTranscript = type == LogTypeTranscript;
    if(isTranscript) this.transcript = null; else this.commandLog = null;
    if(name === null) return true;
    try {
      files().writeFile(name, type == LogTypeScript ? '<eventscript>' + String.fromCharCode(10) : '');
    } catch(e) {
      return false;
    }
    if(isTranscript) this.transcript = name;
    else {
      this.commandLog = name;
      this.commandLogType = type;
    }
    return true;
  }

  logConsoleCreate(name: string, width: number): number {
    files().writeFile(name, '');
    let handle = this.nextLogHandle++;
    this.logConsoles.set(handle, { file: name, formatter: new TextFormatter((s) => files().appendFile(name, s), width) });
    return handle;
  }

  /** Write to a log console; returns false if the handle isn't valid. */
  logConsoleSay(handle: number, text: string): boolean {
    if(handle == MainWindowLogHandle) {
      if(this.transcript !== null) {
        let file = this.transcript;
        let f = new TextFormatter((s) => files().appendFile(file, s));
        f.say(text);
        f.flushPartial();
      }
      return true;
    }
    let c = this.logConsoles.get(handle);
    if(!c) return false;
    c.formatter.say(text);
    return true;
  }

  logConsoleClose(handle: number): boolean {
    let c = this.logConsoles.get(handle);
    if(!c) return false;
    c.formatter.finish();
    this.logConsoles.delete(handle);
    return true;
  }
}
