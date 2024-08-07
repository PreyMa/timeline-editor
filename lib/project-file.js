import { downloadFile, openFile, safeFileName } from './util.js';
import { validateObject } from './validation.js';

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
      colors: Array,
      timeLines: Array
    });

    if( this.object.version !== this.version ) {
      throw new Error('Incompatible file versions');
    }

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

    validateObject( timeLine.position, {
      x: 'number',
      y: 'number'
    });

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

  #findTimeLineById( id ) {
    return this.object.timeLines.find( timeLine => timeLine.id === id );;
  }
}

export class ProjectFile {
  #name
  #timeLines
  #colorMap

  constructor( name ) {
    this.#name= name;
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
