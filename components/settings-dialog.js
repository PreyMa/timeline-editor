import { Editor } from '../editor.js';
import { SimpleDialog } from './color-dialog.js';

export class SettingsDialog extends SimpleDialog {
  #gridOpacityField
  #gridSizeField

  /** @type {SettingsDialog|null} */
  static the= null;

  static init() {
    SettingsDialog.the= new SettingsDialog('settings');
  }

  constructor( dialogElementId ) {
    super(dialogElementId);

    this.#gridOpacityField= this.form.elements.namedItem('gridOpacity');
    this.#gridSizeField= this.form.elements.namedItem('gridSize');

    this.#gridOpacityField.addEventListener('input', () => {
      Editor.the.timeBoard.gridOpacity= parseFloat(this.#gridOpacityField.value);
    });

    this.#gridSizeField.addEventListener('input', () => {
      Editor.the.timeBoard.gridSize= parseFloat(this.#gridSizeField.value);
    });
  }

  resetFields( initValue= null ) {
  }

  done() {
  }
}
