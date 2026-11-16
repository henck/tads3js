/**
 * What the VM needs from its environment, so it can run under Node or in a
 * browser: file access (for saved games, logs and scripts), random bytes,
 * and settings. Node is the default; a browser host installs its own with
 * Platform.set().
 */
export interface IFileSystem {
  /** A file's contents, or null if it doesn't exist. Throws if it can't be read. */
  readFile(name: string): Uint8Array | null;
  /** Create or replace a file. Throws if it can't be written. */
  writeFile(name: string, data: Uint8Array | string): void;
  /** Add to the end of a file. */
  appendFile(name: string, data: string): void;
  exists(name: string): boolean;
}

export interface IPlatform {
  fs: IFileSystem;
  /** Random bytes (for seeding random number generators). */
  randomBytes(n: number): Uint8Array;
  /** A setting (an environment variable under Node), or undefined. */
  setting(name: string): string | undefined;
  /** The operating system name for systemInfo(). */
  osName: string;
}

/** Files kept in memory (for a browser, or tests). */
export class MemoryFileSystem implements IFileSystem {
  public files = new Map<string, Uint8Array>();

  readFile(name: string): Uint8Array | null {
    return this.files.get(name) ?? null;
  }

  writeFile(name: string, data: Uint8Array | string) {
    if(/[\\/]/.test(name) && !Array.from(this.files.keys()).some((k) => k.startsWith(name.replace(/[^\\/]*$/, ''))))
      throw new Error('no such directory: ' + name);
    this.files.set(name, typeof(data) == 'string' ? new TextEncoder().encode(data) : data.slice());
  }

  appendFile(name: string, data: string) {
    let old = this.files.get(name) ?? new Uint8Array(0);
    let add = new TextEncoder().encode(data);
    let both = new Uint8Array(old.length + add.length);
    both.set(old);
    both.set(add, old.length);
    this.files.set(name, both);
  }

  exists(name: string): boolean {
    return this.files.has(name);
  }
}

function randomBytes(n: number): Uint8Array {
  let bytes = new Uint8Array(n);
  let c = (globalThis as any).crypto;
  if(c && c.getRandomValues) c.getRandomValues(bytes);
  else for(let i = 0; i < n; i++) bytes[i] = Math.floor(Math.random() * 256);
  return bytes;
}

/** The Node platform (loaded only when running under Node). */
function nodePlatform(): IPlatform {
  // (A variable module name keeps bundlers from including 'fs'.)
  const fsName = 'fs';
  const fs = require(fsName);
  return {
    fs: {
      readFile(name: string) {
        if(!fs.existsSync(name)) return null;
        return new Uint8Array(fs.readFileSync(name));
      },
      writeFile(name: string, data: Uint8Array | string) { fs.writeFileSync(name, data); },
      appendFile(name: string, data: string) { fs.appendFileSync(name, data); },
      exists(name: string) { return fs.existsSync(name); },
    },
    randomBytes: randomBytes,
    setting: (name: string) => process.env[name],
    osName: process.platform == 'win32' ? 'WIN32' : process.platform.toUpperCase(),
  };
}

/** A platform with files in memory (for a browser). */
export function memoryPlatform(fs: IFileSystem = new MemoryFileSystem()): IPlatform {
  return { fs: fs, randomBytes: randomBytes, setting: () => undefined, osName: 'WEB' };
}

const isNode = typeof process !== 'undefined' && !!(process.versions && process.versions.node);
let current: IPlatform = null;

export const Platform = {
  get(): IPlatform {
    if(!current) current = isNode ? nodePlatform() : memoryPlatform();
    return current;
  },
  set(p: IPlatform) {
    current = p;
  },
};
