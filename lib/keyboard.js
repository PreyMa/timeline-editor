
export class Keyboard {
  #pressedKeys

  constructor() {
    this.#pressedKeys= new Set();

    document.addEventListener('keydown', ev => this.#pressedKeys.add( this.#eventToName(ev) ) );
    document.addEventListener('keyup', ev => this.#pressedKeys.delete( this.#eventToName(ev) ) );

    // As we cannot detect whether keys are pressed or released when the window is not
    // focused, we just reset all pressed to prevent sticky keys
    window.addEventListener('blur', () => this.#pressedKeys.clear(), false);
  }

  #eventToName( ev ) {
    return ev.key.length > 1 ? ev.key : ev.key.toLowerCase();
  }

  keyIsDown( key ) {
    return this.#pressedKeys.has( key );
  }
}
