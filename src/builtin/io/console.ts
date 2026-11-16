import { Platform } from '../../Platform';
import { VmData, VmInt, VmNil, VmTrue, VmSstring, VmList } from "../../types";
import { Vm } from "../../Vm";
import { VmRuntimeError, VmErr } from "../../VmErrors";
import { LogTypeTranscript } from "../../io/Console";
import { sayText } from "./tadsSay";

const InEvtKey = 1, InEvtEof = 5, InEvtLine = 6;
const InFileSuccess = 0, InFileFailure = 1, InFileCancel = 2;
const InFileSave = 2;
const ScriptReqGetStatus = 0x7000;

function con() { return Vm.getInstance().console; }
function str(s: string | null): VmData { return s === null ? new VmNil() : new VmSstring(s); }
function bool(b: boolean): VmData { return b ? new VmTrue() : new VmNil(); }

/** A file name argument (a string, or a FileName object); null for nil. */
function fileName(v: VmData): string | null {
  if(!v || v instanceof VmNil) return null;
  let s = v.unpack();
  return typeof(s) == 'string' ? s : v.toStr();
}

// Input

/** inputLine(): read a line of input; nil at the end of input. */
export function builtin_inputLine(): VmData {
  return str(con().readLine());
}

/** inputKey(): read a keystroke. */
export function builtin_inputKey(): VmData {
  let key = con().readKey();
  return new VmSstring(key === null ? '[eof]' : key);
}

/** inputEvent(timeout?): wait for an event: [InEvtKey, key], or [InEvtEof]. */
export function builtin_inputEvent(timeout?: VmData): VmData {
  let key = con().readKey();
  if(key === null) return new VmList([new VmInt(InEvtEof)]);
  return new VmList([new VmInt(InEvtKey), new VmSstring(key)]);
}

/**
 * inputLineTimeout(timeout?): read a line: [InEvtLine, text], or
 * [InEvtEof]. Timeouts aren't supported, so this simply waits.
 */
export function builtin_inputLineTimeout(timeout?: VmData): VmData {
  let line = con().readLine();
  if(line === null) return new VmList([new VmInt(InEvtEof)]);
  return new VmList([new VmInt(InEvtLine), new VmSstring(line)]);
}

/** inputLineCancel(reset): nothing to cancel, as inputLineTimeout() doesn't time out. */
export function builtin_inputLineCancel(reset: VmData): VmData {
  return new VmNil();
}

const STANDARD_BUTTONS: { [k: number]: string[] } = {
  1: ['&Ok'], 2: ['&Ok', '&Cancel'], 3: ['&Yes', '&No'], 4: ['&Yes', '&No', '&Cancel'],
};
const BUTTON_LABELS: { [k: number]: string } = { 1: '&Ok', 2: '&Cancel', 3: '&Yes', 4: '&No' };

/**
 * inputDialog(icon, prompt, buttons, defaultButton, cancelButton): in text
 * mode, show the prompt and the buttons (e.g. "Save? (Y)es/(N)o >") and
 * read a response: a button's shortcut letter, its label, or its number.
 * Returns the button number (from 1), the default button for an empty
 * response, or 0 if the response doesn't match a button.
 */
export function builtin_inputDialog(icon: VmData, prompt: VmData, buttons: VmData, defButton: VmData, cancelButton: VmData): VmData {
  let labels: string[] = buttons instanceof VmInt
    ? (STANDARD_BUTTONS[buttons.value] ?? [])
    : (buttons.unpack() as VmData[]).map((b) => b instanceof VmInt ? (BUTTON_LABELS[b.value] ?? '') : b.toStr());
  let shown = labels.map((l) => l.replace(/&(.)/, '($1)'));
  let response = con().readResponse(prompt.toStr() + ' ' + shown.join('/') + ' >', 'dialog');
  if(response === null) return new VmInt(0);
  response = response.trim().toLowerCase();
  if(response == '') return defButton instanceof VmInt ? defButton : new VmInt(0);
  if(/^[0-9]+$/.test(response)) {
    let n = parseInt(response);
    return new VmInt(n >= 1 && n <= labels.length ? n : 0);
  }
  for(let i = 0; i < labels.length; i++) {
    let plain = labels[i].replace('&', '').toLowerCase();
    let m = /&(.)/.exec(labels[i]);
    if(response == plain || (m && response == m[1].toLowerCase())) return new VmInt(i + 1);
  }
  return new VmInt(0);
}

/**
 * inputFile(prompt, dialogType, fileType, flags): in text mode, show the
 * prompt and read a file name: [InFileSuccess, name, nil, nil], or
 * [InFileCancel] for an empty response. At the end of input, the result is
 * success with an empty name (as in the reference interpreter).
 */
export function builtin_inputFile(prompt: VmData, dialogType: VmData, fileType: VmData, flags: VmData): VmData {
  let save = dialogType instanceof VmInt && dialogType.value == InFileSave;
  let type = fileType instanceof VmInt ? fileType.value : 0;
  let name = con().readResponse(prompt.toStr() + ' >', 'file',
    con().host.askFile ? () => con().host.askFile(prompt.toStr(), save, type) : undefined);
  if(name === null) name = '';
  else if(name.trim() == '') return new VmList([new VmInt(InFileCancel)]);
  return new VmList([new VmInt(InFileSuccess), new VmSstring(name.trim()), new VmNil(), new VmNil()]);
}

/** morePrompt(): wait for a key, if the host shows a "more" prompt (otherwise, nothing to wait for). */
export function builtin_morePrompt(): VmData {
  con().morePrompt();
  return new VmNil();
}

/** timeDelay(ms): pause. */
export function builtin_timeDelay(ms: VmData): VmData {
  if(ms instanceof VmInt && ms.value > 0) con().sleep(ms.value);
  return new VmNil();
}

// Output

/** clearScreen(): clear the main window, if the host can. */
export function builtin_clearScreen(): VmData {
  con().clearScreen();
  return new VmNil();
}

/** flushOutput(): output is written a line at a time, so there's nothing to do. */
export function builtin_flushOutput(): VmData {
  return new VmNil();
}

/** statusMode(mode): StatModeStatus (1) sends text to the status line. */
export function builtin_statusMode(mode: VmData): VmData {
  con().setStatusMode(mode instanceof VmInt ? mode.value : 0);
  return new VmNil();
}

/** statusRight(txt): set the right part of the status line. */
export function builtin_statusRight(txt: VmData): VmData {
  con().setStatusRight(txt instanceof VmNil ? '' : txt.toStr());
  return new VmNil();
}

/** resExists(name): is there a resource of that name embedded in the image? */
export function builtin_resExists(name: VmData): VmData {
  return bool(Vm.getInstance().resource(name.toStr()) !== null);
}

/** getLocalCharSet(which): we use UTF-8 for everything. */
export function builtin_getLocalCharSet(which: VmData): VmData {
  let n = which instanceof VmInt ? which.value : 0;
  return n >= 1 && n <= 3 ? new VmSstring('utf-8') : new VmNil();
}

// Logging and scripts

/** setLogFile(fname, logType?): start or (with nil) stop a transcript or command log. */
export function builtin_setLogFile(fname: VmData, logType?: VmData): VmData {
  let type = logType instanceof VmInt ? logType.value : LogTypeTranscript;
  return bool(con().setLogFile(fileName(fname), type));
}

/** setScriptFile(filename, flags?): read input from a script file; nil stops. */
export function builtin_setScriptFile(fname: VmData, flags?: VmData): VmData {
  if(fname instanceof VmInt && fname.value == ScriptReqGetStatus) {
    let status = con().input.scriptStatus();
    return status === null ? new VmNil() : new VmInt(status);
  }
  let name = fileName(fname);
  if(name === null) {
    con().input.popScript();
    return new VmTrue();
  }
  let data: Uint8Array = null;
  try {
    data = Platform.get().fs.readFile(name);
  } catch(e) {
  }
  if(data === null) return new VmNil();
  let text = new TextDecoder().decode(data);
  con().input.pushScript(text, flags instanceof VmInt ? flags.value : 0);
  return new VmTrue();
}

/** logConsoleCreate(filename, charset, width): a console that writes to a file. */
export function builtin_logConsoleCreate(fname: VmData, charset: VmData, width: VmData): VmData {
  let name = fileName(fname);
  if(name === null) throw new VmRuntimeError(VmErr.BAD_VAL_BIF);
  try {
    return new VmInt(con().logConsoleCreate(name, width instanceof VmInt ? width.value : 80));
  } catch(e) {
    throw new VmRuntimeError(VmErr.CREATE_FILE);
  }
}

export function builtin_logConsoleClose(handle: VmData): VmData {
  if(!(handle instanceof VmInt) || !con().logConsoleClose(handle.value)) throw new VmRuntimeError(VmErr.BAD_VAL_BIF);
  return new VmNil();
}

export function builtin_logConsoleSay(handle: VmData, ...args: VmData[]): VmData {
  if(!(handle instanceof VmInt) || !con().logConsoleSay(handle.value, sayText(args))) throw new VmRuntimeError(VmErr.BAD_VAL_BIF);
  return new VmNil();
}
