import { ColorDialog, SimpleDialog } from './color-dialog.js';
import { Editor } from '../editor.js';

export class CategoryDialog extends SimpleDialog {
  #categories
  #setCategoriesElement

  /** @type {CategoryDialog|null} */
  static the= null;

  static init() {
    CategoryDialog.the= new CategoryDialog('category-selector');
  }

  constructor( dialogElementId ) {
    super(dialogElementId);

    this.#categories= new Set();
    this.#setCategoriesElement= document.getElementById('set-categories-list');

    document.getElementById('add-category').addEventListener('click', () => this.#promptForColor() );
  }

  resetFields( initValue= null ) {
    this.#categories.clear();
    this.#setCategoriesElement.innerHTML= '';

    if( initValue ) {
      for( const category of initValue ) {
        this.#appendCategory( category );
      }
    }
  }

  done() {
    // Sort them just by the hex color names to ensure a consistent look
    // across all the category indicators
    return [ ...this.#categories.values() ].sort();
  }

  async #promptForColor() {
    const color= await ColorDialog.the.prompt();
    if( color === ColorDialog.Canceled ) {
      return;
    }

    this.#appendCategory( color );
  }

  #appendCategory( category ) {
    if( this.#categories.has( category ) ) {
      return;
    }

    this.#categories.add( category );

    const indicator= this.#setCategoriesElement.appendChild( document.createElement('div') );
    const name= this.#setCategoriesElement.appendChild( document.createElement('div') );
    const buttonColumn= this.#setCategoriesElement.appendChild( document.createElement('div') );

    indicator.classList.add('indicator');
    indicator.style.backgroundColor= category;

    name.classList.add('name');
    name.innerText= Editor.the.itemColors.nameOfColor( category ) || 'NA';

    buttonColumn.classList.add('button');
    const button= buttonColumn.appendChild( document.createElement('button') );
    button.type= 'button';
    button.innerText= 'Remove';
    button.addEventListener('click', () => {
      this.#categories.delete( category );
      this.#setCategoriesElement.removeChild( indicator );
      this.#setCategoriesElement.removeChild( name );
      this.#setCategoriesElement.removeChild( buttonColumn );
    });
  }
}
