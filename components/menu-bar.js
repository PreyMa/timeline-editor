import { Editor } from '../editor.js';
import { BaseComponent, registerElement } from './base-component.js';
import { SettingsDialog } from './settings-dialog.js';

export class MenuBar extends BaseComponent( HTMLElement ) {
  #nameField

  constructor() {
    super();
  }

  connectedCallback() {
    this._instantiateTemplate('menu-bar-template');

    this.#nameField= document.querySelector('.name-field');

    document.querySelector('.settings-button').addEventListener('click', () => SettingsDialog.the.prompt());
    document.querySelector('.add-timeline-button').addEventListener('click', () => Editor.the.timeBoard.createItem() );

    document.querySelector('.save-button').addEventListener('click', () => Editor.the.save(this.#nameField.value));
    document.querySelector('.open-button').addEventListener('click', () => Editor.the.open());

    document.querySelector('.category-panel-button').addEventListener('click', () => Editor.the.openSidePanel('category-panel') );
  }

  set projectName( name ) {
    this.#nameField.value= name;
  }
}

registerElement('menu-bar', MenuBar);
