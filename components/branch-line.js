import { assert } from '../lib/util.js';
import { registerElement } from './base-component.js';
import { TransformPositioned } from './transform-positioned.js';
import { Vector } from '../lib/vector.js';

class BranchLine extends TransformPositioned {
  #leftElement
  #rightElement
  #splitRatio

  static LineWidth= 4;

  constructor() {
    super();

    this._internals= this.attachInternals();

    this.#leftElement= null;
    this.#rightElement= null;

    this.#splitRatio= 0.5;
  }

  connectedCallback() {
    this._instantiateTemplate('branch-line-template');

    this.#leftElement= this.querySelector('.left');
    this.#rightElement= this.querySelector('.right');
  }

  disconnectedCallback() {}

  adoptedCallback(){}

  setPath( start, end ) {
    if( start.y > end.y ) {
      start= start.move( 0, BranchLine.LineWidth / 2 );
      end= end.move( 0, -BranchLine.LineWidth / 2 );
      
      this._internals.states.add('up');
      this.transformPosition= new Vector( start.x, end.y );

    } else {
      start= start.move( 0, -BranchLine.LineWidth / 2 );
      end= end.move( 0, BranchLine.LineWidth / 2 );

      this._internals.states.delete('up');
      this.transformPosition= start;
    }

    assert( start.x <= end.x );

    const size= end.sub( start ).abs();
    this.style.width= `${size.x}px`;
    this.style.height= `${size.y}px`;
    this.#leftElement.style.width= `${size.x * this.#splitRatio}px`;
  }

  set highlighted( x ) {
    if( x ) {
      this._internals.states.add('highlight');
    } else {
      this._internals.states.delete('highlight');
    }
  }

  get splitRatio() {
    return this.#splitRatio;
  }

  set splitRatio( ratio ) {
    this.#splitRatio= Math.max( 0.1, Math.min(0.9, ratio) );

    const width= parseInt(this.style.width);
    this.#leftElement.style.width= `${width * this.#splitRatio}px`;
  }
}


registerElement('branch-line', BranchLine);
