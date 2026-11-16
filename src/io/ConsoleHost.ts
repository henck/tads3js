import * as fs from 'fs';
import { IHost, IBannerEvent } from './Host';

/** A host using the process's standard output and (blocking) standard input. */
export class ConsoleHost implements IHost {
  private pending = '';
  private eof = false;
  public html?: boolean;
  public banner?: (e: IBannerEvent) => void;

  write(text: string) {
    process.stdout.write(text);
  }

  clear() {
    if(process.stdout.isTTY) process.stdout.write('[2J[H');
  }

  sleep(ms: number) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  }

  private readChunk(): boolean {
    if(this.eof) return false;
    let buf = Buffer.alloc(4096);
    let n = 0;
    try {
      n = fs.readSync(0, buf, 0, buf.length, null);
    } catch(e) {
      if(e.code == 'EAGAIN') return true;
      if(e.code != 'EOF') throw e;
    }
    if(n == 0) { this.eof = true; return false; }
    this.pending += buf.toString('utf8', 0, n);
    return true;
  }

  readLine(): string | null {
    while(!this.pending.includes('\n')) {
      if(!this.readChunk()) {
        if(this.pending == '') return null;
        let rest = this.pending;
        this.pending = '';
        return rest;
      }
    }
    let i = this.pending.indexOf('\n');
    let line = this.pending.substr(0, i).replace(/\r$/, '');
    this.pending = this.pending.substr(i + 1);
    return line;
  }

  readKey(): string | null {
    let line = this.readLine();
    if(line === null) return null;
    return line.length ? Array.from(line)[0] : '\n';
  }
}
