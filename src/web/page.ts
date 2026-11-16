import { GameClient, keyName } from './client';
import { showFileDialog } from './FileDialog';
import { Banners } from './banners';

/*
 * The default play page (web/index.html): the game's output and status
 * line, an input line, and file dialogs.
 *
 * The game to play: the page's <body data-game="..."> attribute, or the
 * ?game=... URL parameter; otherwise the player chooses a .t3 file.
 *
 * HTML mode (<body data-html> or the ?html URL parameter): the game is
 * told it runs on an HTML TADS interpreter, and its banner windows
 * (graphics, maps, status line...) are shown around the story.
 */

const $ = (id: string) => document.getElementById(id);

const output = $('output');
const inputLine = $('input') as HTMLInputElement;
let textNode: Text = null;
let more: HTMLElement = null;

function write(text: string) {
  if(!textNode) {
    textNode = document.createTextNode('');
    output.insertBefore(textNode, inputLine);
  }
  textNode.appendData(text);
  scrollDown();
}

function writeElement(e: HTMLElement) {
  output.insertBefore(e, inputLine);
  textNode = null;
  scrollDown();
}

function note(text: string, cls = 'note') {
  let e = document.createElement('div');
  e.className = cls;
  e.textContent = text;
  writeElement(e);
}

function scrollDown() {
  if(htmlMode) storyBox.scrollTop = storyBox.scrollHeight;
  else window.scrollTo(0, document.body.scrollHeight);
}

const htmlMode = document.body.dataset.html !== undefined || new URLSearchParams(location.search).has('html');
// In HTML mode, the story (<main>) scrolls by itself, in a frame with the banners.
const storyBox = document.querySelector('main');
let banners: Banners = null;

const history: string[] = [];
let historyPos = 0;
// Commands entered before the game was ready for them (sent when it is).
const typedAhead: string[] = [];

/** Send a command (and show it). */
function submit(line: string) {
  let echo = document.createElement('span');
  echo.className = 'command';
  echo.textContent = line + '\n';
  writeElement(echo);
  if(line.trim() && history[history.length - 1] !== line) history.push(line);
  historyPos = history.length;
  client.sendLine(line);
}

const client = new GameClient('tads3js-worker.js', {
  output: write,

  banner(e) {
    banners.event(e);
  },

  status(left, right) {
    $('status-left').textContent = left;
    $('status-right').textContent = right;
    $('status').hidden = !(left || right);
  },

  clear() {
    while(output.firstChild && output.firstChild !== inputLine) output.removeChild(output.firstChild);
    textNode = null;
  },

  inputLine() {
    inputLine.hidden = false;
    if(typedAhead.length) {
      submit(typedAhead.shift());
      return;
    }
    if(document.activeElement === document.body) inputLine.focus();
    scrollDown();
  },

  inputKey() {},

  more() {
    more = document.createElement('div');
    more.className = 'more';
    more.textContent = 'More…';
    writeElement(more);
  },

  askFile(prompt, save, fileType) {
    showFileDialog(client, prompt, save, fileType);
  },

  end(error) {
    inputLine.hidden = true;
    if(error) note('Error: ' + error, 'error');
    let again = document.createElement('button');
    again.className = 'restart';
    again.textContent = 'Play again';
    again.onclick = () => location.reload();
    writeElement(again);
  },
});

if(htmlMode) {
  client.html = true;
  let frame = document.createElement('div');
  frame.id = 'frame';
  document.body.insertBefore(frame, storyBox);
  frame.appendChild(storyBox);
  banners = new Banners(frame, storyBox, (name) => client.resourceURL(name), (cmd) => {
    if(client.waiting == 'line') submit(cmd);
    else if(client.waiting === null) typedAhead.push(cmd);
  });
}

// (The input line stays usable while the game works on a command: a command
// entered then is sent when the game is ready for it.)
inputLine.addEventListener('keydown', (e) => {
  if(e.key == 'Enter') {
    e.preventDefault();
    let line = inputLine.value;
    if(client.waiting == 'line') submit(line);
    else if(client.waiting === null) typedAhead.push(line);
    else return;
    inputLine.value = '';
  } else if(e.key == 'ArrowUp' || e.key == 'ArrowDown') {
    historyPos = Math.max(0, Math.min(history.length, historyPos + (e.key == 'ArrowUp' ? -1 : 1)));
    inputLine.value = history[historyPos] ?? '';
    e.preventDefault();
  }
});

function continueMore() {
  more.remove();
  more = null;
  client.sendKey(' ');
}

// Clicking: continues after "more"; otherwise puts the cursor back on the input line.
document.addEventListener('click', () => {
  if(window.getSelection().toString()) return;
  if(client.waiting == 'more') continueMore();
  else if(client.waiting == 'line') inputLine.focus();
});

document.addEventListener('keydown', (e) => {
  if(e.ctrlKey || e.altKey || e.metaKey) return;
  if(client.waiting == 'more') {
    e.preventDefault();
    continueMore();
  } else if(client.waiting == 'key') {
    let key = keyName(e);
    if(key === undefined) return;
    e.preventDefault();
    client.sendKey(key);
  }
});

function fail(message: string) {
  $('start').hidden = false;
  $('start-error').textContent = message;
}

async function start(image: Uint8Array, name: string) {
  $('start').hidden = true;
  $('story').hidden = false;
  inputLine.hidden = false;
  inputLine.focus();
  document.title = name.replace(/^.*\//, '').replace(/\.t3$/i, '');
  await client.start(image, name);
}

async function main() {
  let url = document.body.dataset.game || new URLSearchParams(location.search).get('game');
  if(url) {
    try {
      await start(await GameClient.fetchImage(url), decodeURIComponent(url));
    } catch(e) {
      fail('The game could not be loaded (' + url + '): ' + e.message);
    }
    return;
  }
  $('start').hidden = false;
  const choose = async (file: File) => start(new Uint8Array(await file.arrayBuffer()), file.name);
  let picker = $('start-file') as HTMLInputElement;
  picker.onchange = () => { if(picker.files[0]) choose(picker.files[0]); };
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    let file = e.dataTransfer.files[0];
    if(file && !client.gameID) choose(file);
  });
}

main();
