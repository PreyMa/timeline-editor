import { Keyboard } from './lib/keyboard.js';
import { ProjectFile } from './lib/project-file.js';

class ItemColors {
  #namesByColor

  static normalizeHexColor( color ) {
    const doubleChars= ( str ) => [...str].map( x => x+x ).join('');

    color= color.substring(1);
    switch( color.length ) {
      case 3: return '#'+ doubleChars( color )
      case 4: return '#'+ doubleChars( color.substring(0, 3) );
      case 6: return '#'+ color;
      default:
      case 8: return '#'+ color.substring(0, 6);
    }
  }

  constructor() {
    this.#namesByColor= new Map();
  }

  forEachAlphabetically( fn ) {
    this.#namesByColor.entries()
      .map( ([color,name]) => ({color,name}) )
      .toArray()
      .sort( (a,b) => { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; } )
      .forEach( fn );
  }

  set( color, name ) {
    color= ItemColors.normalizeHexColor( color );
    name= name || '';

    this.#namesByColor.set(color, name);
  }

  nameOfColor( color ) {
    return this.#namesByColor.get( color ) || null;
  }

  persist( projectFile ) {
    this.#namesByColor.forEach((name, color) => {
      projectFile.addNamedColor( color, name );
    });
  }
}

export class Editor {
  #itemColors
  #keyboard
  #menubar
  #panelContainer
  #timeBoard

  /** @type {Editor|null} */
  static the= null;

  static init() {
    Editor.the= new Editor();
  }

  constructor() {
    this.#itemColors= new ItemColors();
    this.#keyboard= new Keyboard();

    this.#timeBoard= document.querySelector('time-board');
    this.#menubar= document.querySelector('menu-bar');
    this.#panelContainer= document.querySelector('aside');
  }

  get itemColors() {
    return this.#itemColors;
  }

  get keyboard() {
    return this.#keyboard;
  }

  get timeBoard() {
    return this.#timeBoard;
  }

  save( projectName ) {
    projectName= projectName || 'Untitled TimeLine';
    const projectFile= new ProjectFile( projectName );
    
    this.#timeBoard.persist( projectFile );
    this.#itemColors.persist( projectFile );

    projectFile.downloadTextFile();
  }

  async open() {
    this.openSidePanel( null );

    const projectFile= await ProjectFile.fromTextFile();
    if( !projectFile ) {
      return;
    }

    this.#itemColors= new ItemColors();
    projectFile.forEachColor( (color, name) => this.#itemColors.set(color, name) );

    this.#menubar.projectName= projectFile.name;

    this.#timeBoard.loadProject( projectFile );
  }

  openSidePanel( name ) {
    const panelElement= this.#panelContainer.firstElementChild;    
    if( !name || (panelElement && panelElement.tagName.toLowerCase() === name) ) {
      this.#panelContainer.innerHTML= '';
      return;
    }

    this.#panelContainer.innerHTML= '';
    this.#panelContainer.appendChild( document.createElement(name) );
  }
}





