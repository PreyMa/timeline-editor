import { BaseComponent } from './base-component.js';

export class TransformPositioned extends BaseComponent(HTMLElement) {
  #position

  constructor() {
    super();

    this.#position= null;
  }

  get transformPosition() {
    return this.#position;
  }

  set transformPosition( pos ) {
    this.#position= pos;
    this.style.transform= `translate(${this.#position.x}px, ${this.#position.y}px)`;
  }

  initTransformPosition( pos ) {
    if( !this.#position ) {
      this.transformPosition= pos;
    }
  }

  updateTransformPosition( pos ) {
    if( this.#position.equals( pos ) ) {
      return false;
    }

    this.transformPosition= pos;
    return true;
  }
}
