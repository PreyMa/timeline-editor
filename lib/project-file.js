import { downloadFile, openFile, safeFileName } from './util.js';
import { validateObject } from './validation.js';
import { Vector } from './vector.js';

class ProjectFileValidator {
  constructor( object, version ) {
    this.object= object;
    this.version= version;
  }

  validateFile() {
    validateObject( this.object, {
      version: 'string',
      created: 'string',
      name: 'string',
      viewportPosition: 'object',
      colors: Array,
      timeLines: Array
    });

    if( this.object.version !== this.version ) {
      throw new Error('Incompatible file versions');
    }

    this.#validateVector( this.object.viewportPosition );

    this.object.colors.forEach( color => validateObject(color, {
      name: 'string',
      color: 'string'
    }));

    this.object.timeLines.forEach( timeLine => this.#validateTimeLine(timeLine) );
  }

  #validateTimeLine( timeLine ) {
    validateObject( timeLine, {
      id: 'string',
      position: 'object',
      width: 'number',
      items: Array
    });

    this.#validateVector( timeLine.position );

    timeLine.items.forEach( item => this.#validateItem(item) );
  }

  #validateItem( item ) {
    if( item.type === 'item' ) {
      validateObject( item, {
        type: 'string',
        id: 'string',
        title: { type: 'string', nullable: true },
        description: { type: 'string', nullable: true },
        color: { type: 'string', nullable: true },
        expandedSize: 'number',
        isExpanded: 'boolean',
        categories: Array
      });

    } else if( item.type === 'branch' ) {
      validateObject( item, {
        type: 'string',
        id: 'string',
        subTimeLineId: 'string',
        branchLineSplitRatio: 'number'
      });

      const subTimeLine= this.#findTimeLineById( item.subTimeLineId );
      if( !subTimeLine ) {
        throw new Error(`Branch in item (${item.id}) references unknown sub time line (${item.subTimeLine})`);
      }

    } else {
      throw new Error('Invalid time item type');
    }
  }

  #validateVector( vec ) {
    validateObject( vec, {
      x: 'number',
      y: 'number'
    });
  }

  #findTimeLineById( id ) {
    return this.object.timeLines.find( timeLine => timeLine.id === id );;
  }
}

export class ProjectFile {
  #colorMap
  #name
  #timeLines
  #viewportPosition

  constructor( name ) {
    this.#name= name;
    this.#viewportPosition= null;
    this.#timeLines= new Map();
    this.#colorMap= new Map();
  }

  static async fromTextFile() {
    try {
      const text= await openFile();
      const serialized= JSON.parse( text );

      const validator= new ProjectFileValidator( serialized, ProjectFile.version() );
      validator.validateFile();

      const projectFile= new ProjectFile( serialized.name );
      projectFile.viewportPosition= serialized.viewportPosition;

      serialized.colors.forEach( color => projectFile.#colorMap.set(color.color, color.name) );
      serialized.timeLines.forEach( timeLine => projectFile.#timeLines.set(timeLine.id, timeLine) );

      return projectFile;
    } catch( e ) {
      console.error('Could not open project file', e);
    }

    return null;
  }

  static version() {
    return '0.1';
  }

  get name() {
    return this.#name;
  }

  get viewportPosition() {
    return this.#viewportPosition || new Vector(0, 0);
  }

  set viewportPosition( x ) {
    this.#viewportPosition= x;
  }

  addTimeLine( timeLineElement ) {
    const timeLine= timeLineElement.toPersisted();
    this.#timeLines.set( timeLine.id, timeLine );
  }

  addNamedColor( color, name ) {
    this.#colorMap.set( color, name );
  }

  forEachColor( fn ) {
    this.#colorMap.forEach( (name, color) => fn(color, name) );
  }

  forEachTimeLine( fn ) {
    this.#timeLines.forEach( fn );
  }

  toSerializableObject() {
    const colors= [];
    this.#colorMap.forEach( (name, color) => colors.push({name, color}) );

    const timeLines= [...this.#timeLines.values() ];

    return {
      version: ProjectFile.version(),
      created: new Date().toISOString(),
      name: this.#name,
      viewportPosition: {x: this.#viewportPosition.x, y: this.#viewportPosition.y},
      colors,
      timeLines
    };
  }

  downloadTextFile() {
    const fileName= safeFileName(this.#name)+ '.json';
    const text= JSON.stringify( this.toSerializableObject() );

    downloadFile(fileName, 'text/plain', text);
  }
}
