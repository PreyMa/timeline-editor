
export class Keyboard {
  #pressedKeys

  constructor() {
    this.#pressedKeys= new Set();

    document.addEventListener('keydown', ev => this.#pressedKeys.add( this.#eventToName(ev) ) );
    document.addEventListener('keyup', ev => this.#pressedKeys.delete( this.#eventToName(ev) ) );
  }

  #eventToName( ev ) {
    return ev.key.length > 1 ? ev.key : ev.key.toLowerCase();
  }

  keyIsDown( key ) {
    return this.#pressedKeys.has( key );
  }
}
