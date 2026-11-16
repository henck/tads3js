import { IBannerEvent } from '../io/Host';

/*
 * Banner windows for the default page in HTML mode: laid out around the
 * story the way HTML TADS does (each banner takes its edge of the space
 * its earlier siblings leave; a banner's own banners are inside it), and
 * their markup shown as HTML, with images from the game's resources and
 * links that send commands.
 */

const BannerFirst = 1, BannerLast = 2, BannerBefore = 3, BannerAfter = 4;
const AlignTop = 0, AlignBottom = 1, AlignLeft = 2, AlignRight = 3;
const SizePercent = 1;
const StyleBorder = 1;

interface Banner {
  handle: number;
  parent: number;
  align: number;
  size: number;
  sizeUnits: number;
  autoSize: boolean;
  style: number;
  html: string;
  el: HTMLElement;        // the banner (its contents, and its own banners)
  content: HTMLElement;   // its contents
  rendered: string;       // the markup last shown
}

// Colour names HTML TADS defines for the status line etc.
const TADS_COLORS: { [name: string]: string } = {
  statusbg: 'var(--bar-bg)', statustext: 'var(--bar-fg)', text: 'var(--fg)', bgcolor: 'var(--bg)',
  link: 'var(--accent)', hlink: 'var(--accent)', alink: 'var(--accent)', input: 'var(--accent)',
};

export class Banners {
  private banners = new Map<number, Banner>();
  private order: number[] = [];       // all banners, in their order among siblings
  private dirty = new Set<Banner>();
  private layoutNeeded = false;
  private frame = false;

  /**
   * @param root The element that holds the banners and the story
   * @param story The story (main window), placed in the space the banners leave
   * @param resourceURL The URL for a resource in the game file (null if none)
   * @param command Sends a command (a link was clicked)
   */
  constructor(private root: HTMLElement, private story: HTMLElement,
              private resourceURL: (name: string) => string | null,
              private command: (cmd: string) => void) {}

  event(e: IBannerEvent) {
    switch(e.op) {
      case 'create': this.create(e); break;
      case 'delete': this.remove(e.handle); break;
      case 'update': {
        let b = this.banners.get(e.handle);
        if(!b) return;
        if(b.size != e.size || b.sizeUnits != e.sizeUnits || b.autoSize != e.autoSize) {
          b.size = e.size;
          b.sizeUnits = e.sizeUnits;
          b.autoSize = e.autoSize;
          this.layoutNeeded = true;
        }
        b.html = e.html;
        this.dirty.add(b);
        break;
      }
    }
    this.schedule();
  }

  private create(e: IBannerEvent) {
    let el = document.createElement('div');
    el.className = 'banner' + (e.style & StyleBorder ? ' banner-border' : '');
    let content = document.createElement('div');
    content.className = 'banner-content';
    el.appendChild(content);
    content.addEventListener('click', (ev) => this.click(ev));
    let b: Banner = { handle: e.handle, parent: e.parent || 0, align: e.align, size: e.size, sizeUnits: e.sizeUnits,
                      autoSize: false, style: e.style, html: '', el: el, content: content, rendered: '' };
    this.banners.set(b.handle, b);
    // Its place in the list (among its siblings).
    let siblings = this.order.filter((h) => this.banners.get(h).parent == b.parent);
    let i: number;
    if(e.where == BannerFirst) i = siblings.length ? this.order.indexOf(siblings[0]) : this.order.length;
    else if((e.where == BannerBefore || e.where == BannerAfter) && siblings.includes(e.other))
      i = this.order.indexOf(e.other) + (e.where == BannerAfter ? 1 : 0);
    else i = this.order.length;
    this.order.splice(i, 0, b.handle);
    this.layoutNeeded = true;
  }

  private remove(handle: number) {
    if(!this.banners.has(handle)) return;
    this.banners.delete(handle);
    this.order = this.order.filter((h) => h != handle);
    this.layoutNeeded = true;
  }

  private scheduled = false;

  /** Show the changes at the next frame (a game may update a banner many times in a turn). */
  private schedule() {
    if(this.scheduled) return;
    this.scheduled = true;
    requestAnimationFrame(() => {
      this.scheduled = false;
      if(this.layoutNeeded) this.layout();
      this.dirty.forEach((b) => this.render(b));
      this.dirty.clear();
    });
  }

  // Layout

  private layout() {
    this.layoutNeeded = false;
    if(!this.frame) {
      this.frame = true;
      document.body.classList.add('html-mode');
    }
    // (Moving the story loses the focus: give it back.)
    let focused = document.activeElement as HTMLElement;
    this.root.textContent = '';
    this.place(this.root, this.children(0), this.story);
    if(focused && focused !== document.body && document.contains(focused)) focused.focus();
  }

  private children(parent: number): Banner[] {
    return this.order.map((h) => this.banners.get(h)).filter((b) => b.parent == parent);
  }

  /** Put the banners in 'box', each at its edge of what's left, and 'inner' in the rest. */
  private place(box: HTMLElement, banners: Banner[], inner: HTMLElement) {
    if(!banners.length) {
      box.appendChild(inner);
      return;
    }
    let [b, ...rest] = banners;
    let vertical = b.align == AlignTop || b.align == AlignBottom;
    box.style.display = 'flex';
    box.style.flexDirection = vertical ? 'column' : 'row';
    let restBox = document.createElement('div');
    restBox.className = 'banner-rest';
    if(b.align == AlignTop || b.align == AlignLeft) box.append(b.el, restBox);
    else box.append(restBox, b.el);
    this.size(b, vertical);
    b.el.classList.toggle('banner-vertical', !vertical);
    // The banner's own banners go inside it.
    b.el.textContent = '';
    this.place(b.el, this.children(b.handle), b.content);
    this.place(restBox, rest, inner);
  }

  private size(b: Banner, vertical: boolean) {
    let s = b.el.style;
    s.flex = '0 0 auto';
    s.width = s.height = '';
    s.maxWidth = s.maxHeight = '';
    let dim = vertical ? 'height' : 'width';
    if(b.autoSize) {
      if(vertical) s.maxHeight = '60%'; else s.maxWidth = '60%';
    } else if(b.sizeUnits == SizePercent) {
      s.flex = `0 0 ${b.size}%`;
    } else {
      // Absolute: lines (height) or characters (width) of the banner's text.
      (s as any)[dim] = vertical ? `calc(${b.size} * 1.4em + 0.6em)` : `calc(${b.size} * 0.6em + 1.2em)`;
    }
    if(!b.autoSize && b.size == 0) s.display = 'none'; else s.display = '';
  }

  // Contents

  private render(b: Banner) {
    if(b.html == b.rendered) return;
    b.rendered = b.html;
    b.content.innerHTML = '';
    b.content.style.background = b.content.style.color = '';
    b.content.appendChild(this.toHTML(b.html, b.content));
  }

  /** The game's markup as HTML (images from the game's resources; no scripts). */
  private toHTML(markup: string, content: HTMLElement): DocumentFragment {
    // HTML TADS: \n is a line break; \b a blank line; <tab align=right> puts the rest at the right.
    let html = markup.replace(/\n/g, '<br>').replace(/\x0b/g, '<br><br>').replace(/[\x0e\x0f\x15]/g, '');
    html = html.replace(/<tab\s+align\s*=\s*["']?right["']?\s*>([\s\S]*)$/i, '<span class="tab-right">$1</span>');
    html = html.replace(/<tab\s+align\s*=\s*["']?center["']?\s*>\s*(<img[^>]*>)/gi, '<div class="tab-center">$1</div>');
    // <body bgcolor=... text=...> colours the banner (the last one counts). The
    // HTML parser drops <body> tags in a fragment, so turn them into <x-body>.
    html = html.replace(/<(\/?)body\b/gi, '<$1x-body');
    let t = document.createElement('template');
    t.innerHTML = html;
    let frag = t.content;
    for(let el of Array.from(frag.querySelectorAll('*'))) {
      let tag = el.tagName.toLowerCase();
      if(['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'form', 'input', 'sound', 'title', 'aboutbox'].includes(tag)) {
        el.remove();
        continue;
      }
      for(let a of Array.from(el.attributes)) if(/^on/i.test(a.name) || a.name == 'style') el.removeAttribute(a.name);
      if(tag == 'x-body') {
        let bg = el.getAttribute('bgcolor'), fg = el.getAttribute('text');
        if(bg) content.style.background = TADS_COLORS[bg.toLowerCase()] || bg;
        if(fg) content.style.color = TADS_COLORS[fg.toLowerCase()] || fg;
        el.replaceWith(...Array.from(el.childNodes));
      } else if(tag == 'img') {
        let src = el.getAttribute('src');
        let url = src ? this.resourceURL(src) : null;
        if(url) el.setAttribute('src', url); else el.removeAttribute('src');
      } else if(tag == 'a') {
        let href = el.getAttribute('href');
        el.removeAttribute('href');
        if(href && !/^[a-z]+:/i.test(href)) el.setAttribute('data-command', href);
        // (<a plain> looks like ordinary text.)
        if(el.hasAttribute('plain')) el.classList.add('plain');
        else if(href) { el.setAttribute('href', href); el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener'); }
      } else if(tag == 'font') {
        let face = el.getAttribute('face');
        if(face && /typewriter|courier|consolas/i.test(face)) el.setAttribute('face', 'Consolas, Courier New, monospace');
        let color = el.getAttribute('color');
        if(color && TADS_COLORS[color.toLowerCase()]) el.removeAttribute('color');
      } else if(tag == 'basefont') {
        el.replaceWith(...Array.from(el.childNodes));
      }
    }
    return frag;
  }

  private click(ev: MouseEvent) {
    let a = (ev.target as HTMLElement).closest('[data-command]');
    if(!a) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.command(a.getAttribute('data-command'));
  }
}
