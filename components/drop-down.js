import { registerElement, BaseComponent } from './base-component.js';

class DropDown extends BaseComponent(HTMLElement) {
  constructor() {
    super();

    this._internals= this.attachInternals();

    this.iconElement= null;
    this.itemElement= null;
    this.outsideClickCallback= null;
  }

  connectedCallback() {
    this._internals.states.add('collapsed');

    const items= this._instantiateTemplate('drop-down-template');

    this.itemElement= this.querySelector('.items');
    items.forEach( item => {
      const wrapper= document.createElement('li');
      this.itemElement.appendChild( wrapper ).appendChild(item);
      
      const optionName= item.getAttribute('data-option');
      if( optionName ) {
        wrapper.addEventListener('click', ev => this.#itemClicked(optionName, ev));
      }
    });

    this.iconElement= this.querySelector('.icon');
    this.iconElement.addEventListener('click', () => this.#toggleMenu() );

    this.outsideClickCallback= event => {
      if( !this.contains(event.target) && !this._internals.states.has('collapsed') ) {
        this.collapse();
      }
    };
    document.addEventListener('click', this.outsideClickCallback);
  }

  disconnectedCallback() {
    document.removeEventListener( 'click', this.outsideClickCallback );
  }

  adoptedCallback() {
  }

  #toggleMenu() {
    if( this._internals.states.has('collapsed') ) {
      this.show();
    } else {
      this.collapse();
    }
  }

  show() {
    this._internals.states.delete('collapsed');
  }

  collapse() {
    this._internals.states.add('collapsed');
  }

  #itemClicked(optionName, clickEvent) {
    if( !optionName ) {
      return;
    }

    this.dispatchEvent( new CustomEvent(
      'option-'+ optionName, {
        detail: {optionName, clickEvent}
      }
    ));
    this.collapse();
  }
}

registerElement('drop-down', DropDown);
