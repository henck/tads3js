/** A saved game kept in the browser. 'game' identifies the game (a hash of its image). */
export interface SavedGame {
  game: string;
  name: string;
  date: Date;
  data?: Uint8Array;
}

const DB_NAME = 'tads3js';
const STORE = 'saves';

function done<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Saved games in the browser's IndexedDB, by game and name. */
export class SaveStore {
  private constructor(private db: IDBDatabase) {}

  static open(): Promise<SaveStore> {
    let request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      let store = request.result.createObjectStore(STORE, { keyPath: ['game', 'name'] });
      store.createIndex('game', 'game');
    };
    return done(request).then((db) => new SaveStore(db));
  }

  private store(mode: IDBTransactionMode) {
    return this.db.transaction(STORE, mode).objectStore(STORE);
  }

  /** The game's saves (without their data). */
  async list(game: string): Promise<SavedGame[]> {
    let all: SavedGame[] = await done(this.store('readonly').index('game').getAll(game));
    return all.map((s) => ({ game: s.game, name: s.name, date: s.date }));
  }

  get(game: string, name: string): Promise<SavedGame> {
    return done(this.store('readonly').get([game, name]));
  }

  async put(save: SavedGame) {
    await done(this.store('readwrite').put(save));
  }

  async remove(game: string, name: string) {
    await done(this.store('readwrite').delete([game, name]));
  }
}
