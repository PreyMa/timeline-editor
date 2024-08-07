
import { Components, registerElement } from './base-component.js';
import { assert } from '../lib/util.js';
import { TransformPositioned } from './transform-positioned.js';
import { DragAction } from '../lib/drag-action.js';
import { Vector } from '../lib/vector.js';
import { Editor } from '../editor.js';
import { Selection } from '../lib/selection.js';
import { PersistedTimeLine } from '../lib/persistence.js';



export class TimeLine extends TransformPositioned {
  #autoPopulate
  #dragAction
  #dragElement
  #itemsElement
  #linkable
  #parentBoard
  #parentTimeBranch
  #resizeAction
  #resizeObserver
  #resizeElement
  #selected
  #widthOffset

  static #cachedBaseWidth= -1;
  static #getBaseWidth( timeLine ) {
    if( this.#cachedBaseWidth < 0 ) {
      const { width }= timeLine.getBoundingClientRect();
      this.#cachedBaseWidth= width- timeLine.#widthOffset;
    }

    return this.#cachedBaseWidth;
  }

  constructor( autoPopulate= true ) {
    super();

    this._internals= this.attachInternals();

    this.#autoPopulate= autoPopulate;
    this.#parentBoard= null;

    this.#widthOffset= 0;
    this.#selected= false;
    this.#linkable= false;

    this.#itemsElement= null;
    this.#dragElement= null;
    this.#resizeElement= null;

    this.#dragAction= new DragAction();
    this.#resizeAction= new DragAction();
    this.#resizeObserver= new ResizeObserver( () => this.#onResize() );

    this.#parentTimeBranch= null;
  }

  connectedCallback() {
    this.#parentBoard= this._findFirstParentElementOfType(Components.TimeBoard);

    const items= this._instantiateTemplate('time-line-template');
    if( !items.length && this.#autoPopulate ) {
      items.push( document.createElement('time-item') );
    }

    this.#dragElement= this.querySelector('.drag-point');
    this.#resizeElement= this.querySelector('.resizer');

    this.#itemsElement= this.querySelector('.items');
    items.forEach( item => this.#insertItemBefore(item, null));
    
    // Drag events
    this.#dragElement.addEventListener('mousedown', ev => this.#dragAction.mouseDown(ev, this.transformPosition) );
    this.#dragAction.addEventListener('mouse-drag', ev => this.#reposition( ev.detail.location ) );
    this.#dragAction.addEventListener('drag-start', () => this._internals.states.add('lifted') );
    this.#dragAction.addEventListener('drag-end', () => this._internals.states.delete('lifted') );
    
    this.#resizeElement.addEventListener('mousedown', ev => this.#resizeAction.mouseDown(ev, new Vector(this.#widthOffset, 0) ) );
    this.#resizeAction.addEventListener('mouse-drag', ev => this.#resizeWidth( ev.detail.location.x ) );

    // Control buttons
    this.querySelector('.select-children').addEventListener('click', () => this.#selectChildren());
    this.querySelector('.link-to-parent').addEventListener('click', () => this.linkable= true );
    this.querySelector('.unlink-from-parent').addEventListener('click', () => this.#unlinkFromParent() );

    // Events on this element
    this.addEventListener('click', () => this.#onClick());
    this.#resizeObserver.observe( this );

    this.id= this.id || TimeLine.createUniqueId('time-line');

    this.initTransformPosition( new Vector(100, 100) );
  }
  
  disconnectedCallback() {
    this.#dragAction.removeEventListeners();
    this.#resizeAction.removeEventListeners();
    this.#resizeObserver.disconnect();
  }
  
  adoptedCallback() {
  }
  
  childConnectedCallback( child ) {
    if( !this._hasUninitializedCustomElementChild( this.#itemsElement ) ) {
      this.#updateItemLocations();
    }
  }

  toPersisted() {
    const { width }= this.getBoundingClientRect();
    const persisted= new PersistedTimeLine(
      this.id,
      { x: this.transformPosition.x, y: this.transformPosition.y },
      width
    );

    this._forEachChild(this.#itemsElement, item => persisted.addItem( item.toPersisted() ) );

    return persisted;
  }

  loadPersisted( persistedTimeLine ) {
    this.id= persistedTimeLine.id;
    this.transformPosition= new Vector( persistedTimeLine.position.x, persistedTimeLine.position.y );

    this.#resizeWidth( persistedTimeLine.width - TimeLine.#getBaseWidth( this ) );
  }

  loadPersistedItems( persistedTimeLine ) {
    this._clearElement( this.#itemsElement );

    for( const persistedItem of persistedTimeLine.items ) {
      let item;
      if( persistedItem.type === 'item' ) {
        item= document.createElement('time-item');

      } else {
        item= document.createElement('time-branch');
      }

      this.#itemsElement.appendChild( item );
      item.loadPersisted( persistedItem );

      if( this.#parentTimeBranch && item === this.#itemsElement.firstElementChild ) {
        item.branched= true;
      }
    }

    this.#updateItemLocations();
    this.#updateBranchLines();
  }

  #onClick() {
    if( Editor.the.keyboard.keyIsDown('Control') ) {
      this.selected= !this.#selected;
    }

    this.#parentBoard.updateStackOrdering( this );
  }

  #onResize() {
    this.#updateBranchLines();
    this.#parentBoard.ensureExtent( this );
  }

  #reposition( location ) {
    const newPos= this.#parentBoard.grid.snap( location );
    if( newPos.x < 0 || newPos.y < 0 ) {
      return;
    }

    if( this.#selected ) {
      this.#parentBoard.selection.moveBy( newPos.sub( this.transformPosition ) );
      this.#parentBoard.ensureExtent( this );
      return;
    }

    if( this.updateTransformPosition( newPos ) ) {
      this.#updateBranchLines();
      this.#parentBoard.ensureExtent( this );
    }
  }

  moveInSelection( selection, vector ) {
    this.transformPosition= this.transformPosition.add( vector );

    if( this.#parentTimeBranch && !selection.has(this.#parentTimeBranch.timeLine) ) {
      this.#parentTimeBranch.updateBranchLine();
    }

    this._forEachChild( this.#itemsElement, child => {
      if( child.isTimeBranch ) {
        if( child.subTimeLine && selection.has(child.subTimeLine) ) {
          child.moveBranchLine( vector );
        } else {
          child.updateBranchLine();
        }
      }
    })
  }

  #resizeWidth( offset ) {
    this.#widthOffset= Math.max(0, offset);
    this.style.setProperty('--width-offset', `${this.#widthOffset}px`);
  }

  #insertItemBefore( item, referenceNode ) {
    this.#itemsElement.insertBefore(item, referenceNode);
    this.#updateBranchLines();
  }

  addItemAbove( referenceItem, newItem= null ) {
    newItem= newItem || document.createElement('time-item');
    this.#insertItemBefore( newItem, referenceItem );
  }

  addItemBelow( referenceItem, newItem= null ) {
    newItem= newItem || document.createElement('time-item');
    this.#insertItemBefore( newItem, referenceItem.nextElementSibling );
  }

  linkItemAbove( referenceItem, subTimeLine ) {
    const branchItem= document.createElement('time-branch');
    this.addItemAbove( referenceItem, branchItem );
    this.#ensureSubTimeLineIsLinkedToTheRight( subTimeLine );
    branchItem.subTimeLine= subTimeLine;
  }

  linkItemBelow( referenceItem, subTimeLine ) {
    const branchItem= document.createElement('time-branch');
    this.addItemBelow( referenceItem, branchItem );
    this.#ensureSubTimeLineIsLinkedToTheRight( subTimeLine );
    branchItem.subTimeLine= subTimeLine;
  }

  removeItem( item ) {
    this.#itemsElement.removeChild( item );
    if( !this.#itemsElement.children.length ) {
      if( this.#parentTimeBranch ) {
        this.#parentTimeBranch.timeLine.removeItem( this.#parentTimeBranch );
      }

      this.#parentBoard.removeItem( this );
      return;
    }

    this.#updateItemLocations();
  }

  insertItemBelow(item, referenceItem) {
    const clonedItem= item.extractAsClone();

    const ownerTimeLine= item.timeLine;
    if( ownerTimeLine === this ) {
      this.#itemsElement.removeChild( item );
    } else {
      ownerTimeLine.removeItem( item );
    }

    if( referenceItem ) {
      this.#insertItemBefore( clonedItem, referenceItem.nextElementSibling );
    } else {
      this.#insertItemBefore( clonedItem, this.#itemsElement.firstElementChild );
    }
  }

  attachToTimeBranch( timeBranchItem ) {
    if( this.#parentTimeBranch ) {
      this.#parentTimeBranch.subTimeLineDetachedItself();
    }

    this.#parentTimeBranch= timeBranchItem;

    if( this.#itemsElement.firstElementChild ) {
      this.#itemsElement.firstElementChild.branched= true;
    }
  }

  detachFromTimeBranch() {
    this.#parentTimeBranch= null;

    if( this.#itemsElement.firstElementChild ) {
      this.#itemsElement.firstElementChild.branched= false;
    }
  }

  #unlinkFromParent() {
    if( this.#parentTimeBranch ) {
      this.#parentTimeBranch.timeLine.removeItem( this.#parentTimeBranch );
    }
  }

  getAttachmentClientPoint() {
    if( this.#itemsElement.firstElementChild ) {
      const rect= this.#itemsElement.firstElementChild.getBoundingClientRect();
      return new Vector( rect.x, rect.y+ rect.height / 2 );
    }

    const {x, y}= this.getBoundingClientRect();
    return new Vector( x, y );
  }

  set parentBranchHighlighted( x ) {
    this.#itemsElement.firstElementChild.parentHighlighted= x;
  }

  get parentTimeBranch() {
    return this.#parentTimeBranch;
  }

  get parentBoard() {
    return this.#parentBoard;
  }

  set selected( x ) {
    this.#selected= x;
    if( this.#selected ) {
      this._internals.states.add('selected');
      this.#parentBoard.selection.add( this );
      this.#parentBoard.resetLinkableItem();
      this.linkable= false;

    } else {
      this._internals.states.delete('selected');
      this.#parentBoard.selection.remove( this );
    }
  }

  set linkable( x ) {
    this.#linkable= x;
    if( this.#linkable ) {
      this._internals.states.add('linkable');
      this.#parentBoard.setLinkableItem( this );
      this.selected= false;

    } else {
      this._internals.states.delete('linkable');
      this.#parentBoard.resetLinkableItem( this );
    }
  }

  get selected() {
    return this.#selected;
  }

  aboveItemColor( item ) {
    const sibling= item.previousElementSibling;
    return sibling instanceof Components.TimeItem ? sibling.color : null;
  }
  
  belowItemColor( item ) {
    const sibling= item.nextElementSibling;
    return sibling instanceof Components.TimeItem ? sibling.color : null;
  }

  branchAbove( item ) {
    this.#createBranch( item, true );
  }

  branchBelow( item ) {
    this.#createBranch( item, false );
  }

  #createBranch( item, aboveReferenceItem ) {
    const branchItem= document.createElement('time-branch');
    if( aboveReferenceItem ) {
      this.addItemAbove(item, branchItem);
    } else {      
      this.addItemBelow(item, branchItem);
    }

    const boundingRect= branchItem.getBoundingClientRect();
    const pos= new Vector( boundingRect.right, boundingRect.top );
    const insertPos= this.#parentBoard.grid.snapForward( this.#parentBoard.clientPositionToTransform( pos.add( new Vector(100, 100) ) ) );
    const subTimeLine= this.#parentBoard.createItemAt( insertPos );
    branchItem.subTimeLine= subTimeLine;
  }

  #updateItemLocations() {
    this._forEachChild( this.#itemsElement, (child, i, children ) => {
      if( i === 0 && children.length > 1 ) {
        child.itemLocation= 'first';
      } else if ( i === children.length-1 && children.length > 1 ) {
        child.itemLocation= 'last';
      } else {
        child.itemLocation= 'middle';
      }

      child.branched= i == 0 && !!this.#parentTimeBranch;
    });
  }

  #updateBranchLines() {
    if( this.#parentTimeBranch ) {
      this.#parentTimeBranch.updateBranchLine();
    }

    this._forEachChild( this.#itemsElement, child => {
      if( child.isTimeBranch ) {
        child.updateBranchLine();
      }
    });
  }

  #collectChildItems( array ) {
    this._forEachChild( this.#itemsElement, child => {
      if( child.isTimeBranch && child.subTimeLine ) {
        array.push( child.subTimeLine );
        child.subTimeLine.#collectChildItems( array );
      }
    });
  }

  #selectChildren() {
    const items= [ this ];
    this.#collectChildItems( items );

    items.forEach( item => item.selected= true );
  }

  #ensureSubTimeLineIsLinkedToTheRight( subTimeLine ) {
    const { width }= this.getBoundingClientRect();
    const minimalX= this.transformPosition.x+ width+ 50;

    // The sub time line is far enough away
    if( subTimeLine.transformPosition.x >= minimalX ) {
      return;
    }

    const startPos= subTimeLine.transformPosition.withX( minimalX );    
    const targetSpot= this.#parentBoard.findFreeItemSpot( startPos, new Vector(0, 100) );
    const vec= targetSpot.sub( subTimeLine.transformPosition );

    const items= [ subTimeLine ];
    subTimeLine.#collectChildItems( items );

    const selection= new Selection( items );
    selection.moveBy( vec );

    this.#parentBoard.ensureExtent( subTimeLine );
  }

  findItemsInOrder( filter, array= [] ) {
    this._forEachChild( this.#itemsElement, child => {
      if( child.isTimeBranch ) {
        if( child.subTimeLine ) {
          child.subTimeLine.findItemsInOrder( filter, array );

        }
      } else {
        if( filter.color && child.color === filter.color ) {
          array.push( child );
        } else if( filter.category && child.hasCategory(filter.category) ) {
          array.push( child );
        }
      }
    });

    return array;
  }
}

registerElement('time-line', TimeLine);
