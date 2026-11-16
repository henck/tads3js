import { GameClient } from './client';
import { SavedGame } from './SaveStore';
import { FileTypeT3Save } from './protocol';

/*
 * A ready-made file dialog for GameHandlers.askFile(): to save, the player
 * names the saved game (and can also download it); to restore, the player
 * picks one of the game's saves in the browser (or deletes some), or loads a
 * file. The dialog is a <dialog class="tads-file-dialog"> element; style it
 * with CSS (see web/style.css).
 */

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  let e = document.createElement(tag);
  if(cls) e.className = cls;
  if(text !== undefined) e.textContent = text;
  return e;
}

function readUpload(accept: string): Promise<{ name: string, data: Uint8Array } | null> {
  return new Promise((resolve) => {
    let input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.addEventListener('change', async () => {
      let file = input.files[0];
      if(!file) return resolve(null);
      resolve({ name: file.name, data: new Uint8Array(await file.arrayBuffer()) });
    });
    input.click();
  });
}

function formatDate(d: Date) {
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' } as any);
}

/** Show the file dialog, and reply to the game when the player has chosen. */
export async function showFileDialog(client: GameClient, prompt: string, save: boolean, fileType: number,
                                     onClose?: () => void) {
  let isSave = fileType == FileTypeT3Save;
  let saves: SavedGame[] = isSave && client.store ? await client.store.list(client.gameID) : [];
  saves.sort((a, b) => b.date.getTime() - a.date.getTime());

  let dialog = el('dialog', 'tads-file-dialog');
  let form = el('form');
  form.method = 'dialog';
  dialog.append(form);
  form.append(el('h2', '', prompt || (save ? 'Save' : 'Open')));
  let list = el('ul', 'tads-file-list');
  form.append(list);

  let nameInput = el('input');
  nameInput.type = 'text';
  nameInput.autocomplete = 'off';
  let downloadBox = el('input');
  downloadBox.type = 'checkbox';
  if(save) {
    let label = el('label', 'tads-file-name', 'Name ');
    label.append(nameInput);
    form.append(label);
    if(isSave && client.store) {
      let dl = el('label', 'tads-file-download');
      dl.append(downloadBox, ' Also download a copy');
      form.append(dl);
    }
  }

  let buttons = el('p', 'tads-file-buttons');
  let upload = el('button', 'tads-file-upload', 'Load from a file…');
  upload.type = 'button';
  let cancel = el('button', 'tads-file-cancel', 'Cancel');
  cancel.type = 'button';
  let ok = el('button', 'tads-file-ok', 'Save');
  ok.type = 'submit';
  if(!save) buttons.append(upload);
  buttons.append(cancel);
  if(save) buttons.append(ok);
  form.append(buttons);

  let done = false;
  const finish = (name: string, data?: Uint8Array) => {
    if(done) return;
    done = true;
    dialog.close();
    dialog.remove();
    client.sendFile(name, data, !isSave || downloadBox.checked);
    if(onClose) onClose();
  };

  for(let s of saves) {
    let li = el('li');
    let pick = el('button', 'tads-file-pick');
    pick.type = 'button';
    pick.append(el('span', '', s.name), el('small', '', formatDate(s.date)));
    pick.onclick = async () => {
      if(save) { nameInput.value = s.name; nameInput.focus(); }
      else finish(s.name, (await client.store.get(client.gameID, s.name)).data);
    };
    let del = el('button', 'tads-file-delete', '×');
    del.type = 'button';
    del.title = 'Delete';
    del.onclick = async () => {
      await client.store.remove(client.gameID, s.name);
      li.remove();
    };
    li.append(pick, del);
    list.append(li);
  }
  if(!save && !saves.length) list.append(el('li', 'tads-file-empty', 'No saved games in this browser.'));
  if(!saves.length && save) list.hidden = true;

  if(save) {
    let n = saves.length + 1;
    while(saves.some((s) => s.name == 'Save ' + n)) n++;
    nameInput.value = isSave ? 'Save ' + n : 'file.txt';
  }

  ok.onclick = (e) => {
    e.preventDefault();
    let name = nameInput.value.trim().replace(/[\\/]/g, '-');
    if(name) finish(name);
  };
  upload.onclick = async (e) => {
    e.preventDefault();
    let file = await readUpload(isSave ? '.sav' : '');
    if(file) finish(file.name.replace(/\.sav$/i, ''), file.data);
  };
  cancel.onclick = (e) => { e.preventDefault(); finish(''); };
  dialog.oncancel = (e) => { e.preventDefault(); finish(''); };

  document.body.append(dialog);
  dialog.showModal();
  if(save) { nameInput.focus(); nameInput.select(); }
}
