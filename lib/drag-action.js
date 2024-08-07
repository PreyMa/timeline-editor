import { Vector } from './vector.js'


export class DragAction extends EventTarget {
  #initialPos
  #lastPos
  #mouseMoveCallback
  #mouseUpCallback
  #debounceBlock
  #originPos

  constructor() {
    super();

    this.#initialPos= null;
    this.#originPos= null;
    this.#debounceBlock= false;
    
    this.#mouseUpCallback= ev => this.#mouseUp( ev );
    document.addEventListener('mouseup', this.#mouseUpCallback);

    this.#mouseMoveCallback= ev => this.#mouseMove( ev );
    document.addEventListener('mousemove', this.#mouseMoveCallback);
  }

  removeEventListeners() {
    document.removeEventListener('mouseup', this.#mouseUpCallback);
    document.removeEventListener('mousemove', this.#mouseMoveCallback);
  }

  get isActive() {
    return !!this.#initialPos;
  }

  mouseDown( ev, originPos= null ) {
    this.#originPos= originPos || new Vector();
    this.#initialPos= new Vector( ev.clientX, ev.clientY );
    this.#lastPos= this.#initialPos.clone();
    this.#debounceBlock= false;

    this.dispatchEvent( new CustomEvent('drag-start') );
  }

  #mouseUp( ev ) {
    this.#initialPos= null;
    this.#originPos= null;

    this.dispatchEvent( new CustomEvent('drag-end') );
  }

  #mouseMove( ev ) {
    if( !this.isActive || this.#debounceBlock ) {
      return;
    }

    this.#debounceBlock= true;
    window.requestAnimationFrame(() => {
      if( this.isActive ) {
        const current= new Vector( ev.clientX, ev.clientY );
        const offset= current.sub( this.#initialPos );
        const delta= current.sub( this.#lastPos );
        const location= this.#originPos.add( offset );
        this.#lastPos= current;

        this.dispatchEvent( new CustomEvent('mouse-drag', { detail: {
          initial: this.#initialPos,
          offset,
          delta,
          location,
          mouseEvent: ev
        }}) );
      }

      this.#debounceBlock= false;
    });
  }
}
