import { registerElement, BaseComponent, Components } from './base-component.js';
import { Grid } from '../lib/grid.js';
import { Vector } from '../lib/vector.js';
import { Selection } from '../lib/selection.js';

export class TimeBoard extends BaseComponent(HTMLElement) {
  #clickStarted
  #enableExtentUpdates
  #grid
  #gridElement
  #itemsElement
  #linesElement
  #linkableItem
  #selection
  #topItem

  constructor() {
    super();

    this.#grid= new Grid( 50 );

    this.#enableExtentUpdates= true;

    this.#itemsElement= null;
    this.#linesElement= null;
    this.#gridElement= null;

    this.#topItem= null;
    this.#linkableItem= null;

    this.#selection= new Selection();
  }

  connectedCallback() {
    const items= this._instantiateTemplate('time-board-template');

    this.#gridElement= document.querySelector('.layer.grid');
    this.#linesElement= document.querySelector('.layer.line').firstElementChild;
    this.#itemsElement= document.querySelector('.layer.item').firstElementChild;

    items.forEach( item => this.#insertItem(item) );

    this.addEventListener('mousedown', ev => this.#clickStarted= ev.target === this.#itemsElement.parentNode );
    this.addEventListener('click', ev => this.#onClick(ev) );
  }

  disconnectedCallback() {
  }

  adoptedCallback() {
  }

  #onClick( ev ) {
    if( ev.target === this.#itemsElement.parentNode && this.#clickStarted ) {
      this.unselectAll();
    }

    this.#clickStarted= false;
  }

  set gridSize( size ) {
    this.#grid.size= size;
    this.#gridElement.style.setProperty('--grid-size', `${size}px`);
  }

  set gridOpacity( opacity ) {
    opacity= 100 * (1 - Math.min(1, Math.max(0, opacity )));
    this.#gridElement.style.setProperty('--grid-opacity', `${opacity}%`);
  }

  get grid() {
    return this.#grid;
  }

  setLinkableItem( item ) {
    this.unselectAll( item );
    this.#linkableItem= item;
  }

  resetLinkableItem( item ) {
    // The linkable item resets itself
    if( item === this.#linkableItem ) {
      this.#linkableItem= null;
      return;
    }

    // The linkable item is reset by someone else
    if( !item && this.#linkableItem ) {
      this.#linkableItem.linkable= false;
      this.#linkableItem= null;
    }
  }

  get linkableItem() {
    return this.#linkableItem;
  }

  findFreeItemSpot( pos, stepVec ) {
    while( true ) {

      // Check if any item occupies the position
      let positionIsTaken= false;
      this._forEachChild( this.#itemsElement, child => {
        positionIsTaken= positionIsTaken || child.transformPosition.equals( pos );
      });

      if( !positionIsTaken ) {
        return pos;
      }

      pos= pos.add( stepVec );
    }
  }

  #insertItem( item ) {
    this.#itemsElement.appendChild( item );
    this.updateStackOrdering( item );
    this.ensureExtent( item );
  }

  createItemAt( pos ) {
    const item= document.createElement('time-line');
    item.transformPosition= pos;
    this.#insertItem( item );    
    return item;
  }

  createItem() {
    // Go to the right until a free spot is found
    const startPos= this.#grid.snap(
      new Vector(this.scrollLeft, this.scrollTop).move( 100, 100 )
    );
    const pos= this.findFreeItemSpot( startPos, new Vector(100, 0) )
    return this.createItemAt( pos );
  }

  removeItem( item ) {
    this.#itemsElement.removeChild( item );
    this.#computeExtent();

    if( item === this.#topItem ) {
      this.#topItem= null;
    }
  }

  insertLine() {
    const line= document.createElement('branch-line');
    this.#linesElement.appendChild( line );
    return line;
  }

  clientPositionToTransform( vec ) {
    const clientOrigin= this.getBoundingClientRect();
    return vec.move( -clientOrigin.x, -clientOrigin.y ).move( this.scrollLeft, this.scrollTop );
  }

  ensureExtent( changedItem= null ) {
    if( this.#enableExtentUpdates ) {
      this.#gridElement.style.width= `${this.scrollWidth}px`;
      this.#gridElement.style.height= `${this.scrollHeight}px`;
    }
  }

  scrollTo( vec ) {
    this.scrollLeft= vec.x;
    this.scrollTop= vec.y;
  }

  #computeExtent() {
    let width= 0;
    let height= 0;
    this._forEachChild( this.#itemsElement, child => {
      const rect= child.getBoundingClientRect();
      width= Math.max( width, child.transformPosition.x+ rect.width+ 200 );
      height= Math.max( height, child.transformPosition.y+ rect.height+ 200 );
    });

    this.#gridElement.style.width= `${width}px`;
    this.#gridElement.style.height= `${height}px`;
  }

  get selection() {
    return this.#selection;
  }

  unselectAll( excluded= null ) {
    this._forEachChild( this.#itemsElement, child => {
      if( child !== excluded ) {
        child.selected= false;
        child.linkable= false;
      }
    });
    this.#selection.clear();
  }

  updateStackOrdering( item ) {
    if( this.#topItem ) {
      this.#topItem.style.removeProperty('z-index');
    }
    this.#topItem= item;
    this.#topItem.style.setProperty('z-index', 100);
  }

  persist( projectFile ) {
    this._forEachChild( this.#itemsElement, item => {
      projectFile.addTimeLine( item );
    });

    projectFile.viewportPosition= new Vector(this.scrollLeft, this.scrollTop);
  }

  loadProject( projectFile ) {
    this.#topItem= null;
    this.#linkableItem= null;
    this.#selection= new Selection();

    this.#enableExtentUpdates= false;

    this._clearElement( this.#itemsElement );
    this._clearElement( this.#linesElement );

    projectFile.forEachTimeLine( timeLine => {
      const item= new Components.TimeLine( false );
      this.#itemsElement.appendChild( item );
      item.loadPersisted( timeLine );
    });

    projectFile.forEachTimeLine( timeLine => {
      const item= document.getElementById( timeLine.id );
      item.loadPersistedItems( timeLine );
    });

    this.#enableExtentUpdates= true;
    this.ensureExtent();

    this.scrollTo( projectFile.viewportPosition );
  }

  findItemsInOrder( filter ) {
    const groups= [];
    this._forEachChild( this.#itemsElement, timeLine => {
      if( !timeLine.parentTimeBranch ) {
        const arr= timeLine.findItemsInOrder( filter );
        if( arr.length ) {
          groups.push( arr );
        }
      }
    });

    return groups;
  }
}

registerElement('time-board', TimeBoard);
