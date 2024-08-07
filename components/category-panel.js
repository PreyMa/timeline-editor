import { Editor } from '../editor.js';
import { BaseComponent, registerElement } from './base-component.js';

export class CategoryPanel extends BaseComponent(HTMLElement) {
  #filterMode
  #colorsElement
  #itemsElement
  #selectedColor

  constructor() {
    super();

    this.#selectedColor= null;
    this.#filterMode= null;
  }

  connectedCallback() {
    this._instantiateTemplate('category-panel-template');

    this.#colorsElement= this.querySelector('.colors');
    this.#itemsElement= this.querySelector('.items');

    const modesElement= this.querySelector('.modes');
    for( const button of modesElement.children ) {
      button.onclick= () => this.filterMode= button.getAttribute('data-mode');
    }

    this.filterMode= 'category';

    this.#updateColors();
    this.#updateSelection();
  }

  disconnectedCallback() {}

  set filterMode( mode ) {
    this.#filterMode= mode;

    this.querySelector('button.selected')?.classList.remove('selected');
    this.querySelector(`button[data-mode=${mode}]`)?.classList.add('selected');

    console.log( mode );

    if( this.#selectedColor ) {
      this.#selectColor( this.#selectedColor );
    }
  }

  #updateColors() {
    this._clearElement( this.#colorsElement );

    Editor.the.itemColors.forEachAlphabetically(({name, color}) => {
      const buttonElement= document.createElement('button');
      buttonElement.innerText= name || 'NA';
      buttonElement.onclick= () => this.#selectColor( color );
      buttonElement.style.setProperty('--category-color', color);

      this.#colorsElement.appendChild( buttonElement )
    });
  }

  #updateSelection() {
    const itemColors= Editor.the.itemColors;

    if( !this.#selectedColor || !itemColors.nameOfColor(this.#selectColor) ) {
      const buttonElement= this.#colorsElement.firstElementChild;
      if( buttonElement ) {
        this.#selectColor( buttonElement.style.getPropertyValue('--category-color') );
      } else {
        this.#selectColor( null );
      }
    }
  }

  #selectColor( color ) {
    this.#selectedColor= color;

    this._clearElement( this.#itemsElement );
    this.#itemsElement.style.setProperty('--category-color', this.#selectedColor);

    if( !this.#selectedColor || !this.#filterMode ) {
      return;
    }

    const groups= Editor.the.timeBoard.findItemsInOrder({ [this.#filterMode]: this.#selectedColor });
    for( const group of groups ) {
      const groupElement= this.#itemsElement.appendChild( document.createElement('ul') );
      for( const item of group ) {
        const itemElement= groupElement.appendChild( document.createElement('li') );
        itemElement.innerText= item.title;
      }
    }
  }
}

registerElement('category-panel', CategoryPanel);

