
import { TimeItemSkeleton } from './time-item.js';
import { registerElement } from './base-component.js';
import { Vector } from '../lib/vector.js';
import { PersistedTimeBranch } from '../lib/persistence.js';
import { assert } from '../lib/util.js';

class TimeBranch extends TimeItemSkeleton {
  #branchLineElement
  #subTimeLine

  constructor( subTimeLine= null, branchLineElement= null ) {
    super();

    this.#subTimeLine= subTimeLine;
    this.#branchLineElement= branchLineElement;
  }

  connectedCallback() {
    super.connectedCallback();

    const fieldsElement= this.querySelector('.fields');
    this._instantiateTemplate('time-item-branch-template', fieldsElement);

    const subTimeLineId= this.getAttribute('data-timeLine');
    if( subTimeLineId ) {
      this.subTimeLine= document.getElementById( subTimeLineId );
    }

    if( !this.#branchLineElement ) {
      this.updateBranchLine();
    }

      // Notify parent that init is complete
    this.timeLine.childConnectedCallback( this );
  }

  disconnectedCallback() {
    if( this.#subTimeLine ) {
      this.#subTimeLine.detachFromTimeBranch();
      this.#branchLineElement.parentNode.removeChild( this.#branchLineElement );
    }
    
    this.#subTimeLine= null;
    this.#branchLineElement= null;
  }

  adoptedCallback() {
  }

  toPersisted() {
    return new PersistedTimeBranch(
      this.id,
      this.#subTimeLine?.id || null,
      this.#branchLineElement?.splitRatio || 0.5
    );
  }

  loadPersisted( persistedTimeBranch ) {
    this.id= persistedTimeBranch.id;
    this.subTimeLine= document.getElementById( persistedTimeBranch.subTimeLineId );
    this.#branchLineElement.splitRatio= persistedTimeBranch.branchLineSplitRatio;
  }

  extractAsClone() {
    const subTimeLine= this.#subTimeLine;
    subTimeLine.detachFromTimeBranch();

    const newInstance= new TimeBranch( subTimeLine, this.#branchLineElement );

    this.#subTimeLine= null;
    this.#branchLineElement= null;

    subTimeLine.attachToTimeBranch( newInstance );

    return newInstance;
  }

  subTimeLineDetachedItself() {
    if( this.#subTimeLine ) {
      this.#branchLineElement.parentNode.removeChild( this.#branchLineElement );
  
      this.#subTimeLine= null;
      this.#branchLineElement= null;
    }

    this.timeLine.removeItem( this );
  }

  get isTimeBranch() {
    return true;
  }

  get subTimeLine() {
    return this.#subTimeLine;
  }

  set subTimeLine( subTimeLine ) {
    if( subTimeLine === this.#subTimeLine ) {
      return;
    }

    if( this.#subTimeLine ) {
      this.#subTimeLine.detachFromTimeBranch();
    }

    assert( subTimeLine );

    this.#subTimeLine= subTimeLine;
    this.#subTimeLine.attachToTimeBranch( this );
    this.updateBranchLine();
  }

  updateBranchLine() {
    if( !this.#subTimeLine ) {
      return;
    }

    if( !this.#branchLineElement ) {
      this.#branchLineElement= this.timeLine.parentBoard.insertLine();
    }

    const ownPos= this.getBoundingClientRect();
    const start= new Vector( ownPos.right, ownPos.top + ownPos.height/2 );
    const end= this.#subTimeLine.getAttachmentClientPoint();

    // console.log( ownPos, this.timeLine.getBoundingClientRect() );

    const board= this.timeLine.parentBoard;
    this.#branchLineElement.setPath(
      board.clientPositionToTransform(start), board.clientPositionToTransform(end)
    );
  }

  moveBranchLine( vector ) {
    this.#branchLineElement.transformPosition= this.#branchLineElement.transformPosition.add( vector );
  }

  toggleParentBranchHighlight( enable ) {
    super.toggleParentBranchHighlight( enable );
    this.childHighlighted= enable;
  }

  set childHighlighted( x ) {
    if( this.#subTimeLine ) {
      this.#subTimeLine.parentBranchHighlighted= x;
      this.#branchLineElement.highlighted= x;
    }

    if( x ) {
      this._internals.states.add('highlight-child-branch');
    } else {
      this._internals.states.delete('highlight-child-branch');
    }
  }
}

registerElement('time-branch', TimeBranch);
