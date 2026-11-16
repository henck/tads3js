import { IHost } from "./Host";

/** An input event from a script. */
export interface IInputEvent {
  type: string;   // 'line', 'key', 'dialog', 'file', ...
  text: string;
}

interface IScript {
  events: IInputEvent[];
  flags: number;
  isEvent: boolean;
}

export const ScriptFileQuiet = 1;
export const ScriptFileNonstop = 2;
export const ScriptFileEvent = 4;

/**
 * Input: from script files (which can be nested) while there are any, and
 * otherwise from the host. As in the reference interpreter, each kind of
 * input request takes the next script event of its kind, skipping others
 * (inputLine skips key events, inputKey skips line events), and input
 * read from a script is echoed unless the script is quiet.
 */
export class Input {
  private scripts: IScript[] = [];

  constructor(private host: IHost, private echo: (text: string) => void) {}

  /**
   * Parse a script: an event script (starting with <eventscript>) has a tag
   * on each line, e.g. <line>text or <key>k; in a command script, lines
   * starting with '>' are input lines and other lines are ignored.
   */
  static parseScript(text: string): { events: IInputEvent[], isEvent: boolean } {
    let lines = text.split(/\r?\n/);
    if(/^\s*<eventscript>/i.test(lines[0] ?? '')) {
      let events: IInputEvent[] = [];
      for(let l of lines.slice(1)) {
        let m = /^<([a-z]+)>(.*)$/i.exec(l);
        if(m) events.push({ type: m[1].toLowerCase(), text: m[2] });
      }
      return { events: events, isEvent: true };
    }
    return { events: lines.filter((l) => l.startsWith('>')).map((l) => ({ type: 'line', text: l.substr(1) })), isEvent: false };
  }

  pushScript(text: string, flags = 0) {
    let s = Input.parseScript(text);
    this.scripts.push({ events: s.events, flags: flags, isEvent: s.isEvent });
  }

  /** Stop reading the current script (returning to the enclosing one, if any). */
  popScript() {
    this.scripts.pop();
  }

  /** The current script's flags (ScriptFileXxx), or null when not reading a script. */
  scriptStatus(): number | null {
    let s = this.scripts[this.scripts.length - 1];
    if(!s) return null;
    return s.flags | (s.isEvent ? ScriptFileEvent : 0);
  }

  /** Is output being suppressed by a quiet script? */
  isQuiet(): boolean {
    return this.scripts.some((s) => (s.flags & ScriptFileQuiet) != 0);
  }

  /** The next script event of one of the given types (skipping others), or null. */
  private fromScript(types: string[]): IInputEvent | null {
    while(this.scripts.length) {
      let s = this.scripts[this.scripts.length - 1];
      while(s.events.length) {
        let e = s.events.shift();
        if(types.includes(e.type)) return e;
      }
      this.scripts.pop();
    }
    return null;
  }

  readLine(): string | null {
    let e = this.fromScript(['line']);
    if(e) {
      if(!this.isQuiet()) this.echo(e.text + '\n');
      return e.text;
    }
    return this.host.readLine();
  }

  readKey(): string | null {
    let e = this.fromScript(['key']);
    if(e) return e.text;
    return this.host.readKey();
  }

  /**
   * The next script event, if it's of the given type (e.g. 'dialog' or
   * 'file'), or null. Other events are left for later input requests.
   */
  scriptEvent(type: string): string | null {
    while(this.scripts.length) {
      let s = this.scripts[this.scripts.length - 1];
      if(s.events.length) {
        if(s.events[0].type != type) return null;
        return s.events.shift().text;
      }
      this.scripts.pop();
    }
    return null;
  }
}
