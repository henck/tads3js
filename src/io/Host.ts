/**
 * The interpreter's connection to the outside world: where formatted output
 * goes and where input comes from. Input is synchronous (the VM can't
 * suspend in the middle of a call).
 */
export interface IHost {
  /** Write formatted text to the main window ('\n' ends a line). */
  write(text: string): void;
  /** Read a line of input, without the newline; null at end of input. */
  readLine(): string | null;
  /** Read a keystroke; null at end of input. */
  readKey(): string | null;
  /** Set the status line text (left part, and right part). */
  setStatus?(left: string, right: string): void;
  /** Clear the main window. */
  clear?(): void;
  /** Pause for a number of milliseconds. */
  sleep?(ms: number): void;
  /**
   * Ask for a file name (a file dialog), instead of reading it as a line
   * after showing the prompt: the name, '' to cancel, or null at the end of
   * input. 'save' is true when the file is to be written; 'type' is the
   * TADS file type (FileTypeT3Save = 15, ...).
   */
  askFile?(prompt: string, save: boolean, type: number): string | null;
  /** Wait for a key before showing more text (morePrompt()); without this, there's no pause. */
  morePrompt?(): void;
  /**
   * A custom tag in the output (a tag named "x-...", see TextFormatter.extTag):
   * data for a custom presentation. Text before it may not have been written yet.
   */
  tag?(name: string, attrs: { [name: string]: string }, end: boolean): void;
  /** The line width for word wrapping (default 80; 0 = don't wrap). */
  lineWidth?: number;
  /**
   * True if the host presents the game like an HTML TADS interpreter (the
   * game sees interpreter class SysInfoIClassHTML, with images, sounds,
   * links and banner windows); otherwise the game sees a text-only
   * interpreter, like t3run.
   */
  html?: boolean;
  /**
   * Banner windows (HTML mode only): the window was created, changed or
   * removed. 'text' is the banner's whole formatted text so far.
   */
  banner?(event: IBannerEvent): void;
}

/** A change to a banner window (see IHost.banner). */
export interface IBannerEvent {
  op: 'create' | 'delete' | 'update';
  handle: number;
  /**
   * The banner's properties (see bannerCreate in tadsio.h): its parent
   * banner (0 for the main window), its place among the parent's banners
   * ('where': BannerFirst, BannerLast, or BannerBefore/BannerAfter the
   * banner 'other'), alignment (BannerAlignTop...), style flags, size
   * (in sizeUnits: BannerSizePercent, or BannerSizeAbsolute: lines or
   * characters), or autoSize: as big as its contents.
   */
  parent?: number;
  where?: number;
  other?: number;
  align?: number;
  size?: number;
  sizeUnits?: number;
  autoSize?: boolean;
  style?: number;
  /** The banner's contents: formatted as text, and the markup as written. */
  text?: string;
  html?: string;
}

/**
 * Thrown by a host's input methods (readLine, readKey, askFile, morePrompt,
 * sleep) when the input isn't available yet: the VM pauses (vm.run() or
 * vm.resume() returns, with vm.isPaused() true), and when the host has the
 * input, vm.resume() asks for it again and carries on. This lets the VM run
 * where it can't block waiting, such as a web page's main thread.
 *
 * (The VM can pause only when no native code is running byte code at the
 * time, e.g. not inside a sort callback.)
 */
export class InputPending {
  /** (Set by the VM: repeats the native call that asked for input.) */
  retry: () => any = null;
}

/** A host that collects output in a string, and has no input. */
export class BufferHost implements IHost {
  public output = '';
  public html?: boolean;

  write(text: string) {
    this.output += text;
  }

  readLine(): string | null {
    return null;
  }

  readKey(): string | null {
    return null;
  }
}
