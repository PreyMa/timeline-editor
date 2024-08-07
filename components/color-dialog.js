import { Editor } from '../editor.js'

export class SimpleDialog {
  #cancelElement
  #dialogElement
  #formElement
  #resolveFunc
  #rejectFunc

  static Canceled= {canceled: true};

  constructor( dialogElementId ) {
    this.#resolveFunc= null;
    this.#rejectFunc= null;

    this.#dialogElement= document.getElementById( dialogElementId );
    this.#cancelElement= this.#dialogElement.querySelector('.cancel');
    this.#formElement= this.#dialogElement.querySelector('form');

    this.#cancelElement.addEventListener('click', () => {
      this.#dialogElement.close( 'canceled' );
    });

    this.#dialogElement.addEventListener('close', () => {
      if(!this.#dialogElement.returnValue || this.#dialogElement.returnValue === 'canceled' ) {
        this.#resolvePromise( SimpleDialog.Canceled );
        return;
      }

      const result= this.done();
      this.#resolvePromise( result );
    });
  }

  get isOpen() {
    return this.#dialogElement.open;
  }

  get form() {
    return this.#formElement;
  }

  open() {
    this.#dialogElement.showModal();
  }

  #rejectPromise( errorProducer ) {
    const rej= this.#rejectFunc;
    this.#rejectFunc= null;
    this.#resolveFunc= null;

    if( rej ) {
      rej( errorProducer() );
    }
  }

  #resolvePromise( value ) {
    const res= this.#resolveFunc;
    this.#rejectFunc= null;
    this.#resolveFunc= null;
    
    if( res ) {
      res( value );
    }
  }

  async prompt( initValue ) {
    this.#rejectPromise( () => new Error('reopened') );

    return new Promise((res, rej) => {
      this.#rejectFunc= rej;
      this.#resolveFunc= res;

      this.resetFields( initValue );
      this.open();
    });
  }

  resetFields( initValue ) {}
  done() { return null; }
}


export class ColorDialog extends SimpleDialog {
  #colorField
  #knownColorsElement
  #nameField

  /** @type {ColorDialog|null} */
  static the= null;

  static init() {
    ColorDialog.the= new ColorDialog('color-selector');
  }

  constructor( dialogElementId ) {
    super(dialogElementId);

    this.#knownColorsElement= document.getElementById('known-colors-list');

    this.#colorField= this.form.elements.namedItem('colorField');
    this.#nameField= this.form.elements.namedItem('nameField');
  }

  resetFields( initValue= null ) {
    const colors= Editor.the.itemColors;
    if( initValue ) {
      this.#colorField.value= initValue;
      this.#nameField.value= colors.nameOfColor( initValue ) || '';
    }

    this.#knownColorsElement.innerHTML= '';
    colors.forEachAlphabetically( ({color, name}) => {
      const buttonElement= this.#knownColorsElement.appendChild( document.createElement('button') );
      const colorElement= buttonElement.appendChild( document.createElement('div') );
      const textElement= buttonElement.appendChild( document.createElement('span') );
      
      if( !name ) {
        textElement.classList.add('na');
        textElement.innerText= 'NA';
      } else {
        textElement.innerText= name;
      }

      colorElement.style.backgroundColor= color;
      
      buttonElement.type= 'button';
      buttonElement.addEventListener('click', () => {
        this.#colorField.value= color;
        this.#nameField.value= name;
      });
    });
  }

  done() {
    Editor.the.itemColors.set( this.#colorField.value, this.#nameField.value );
    return this.#colorField.value;
  }
}
