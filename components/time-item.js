
import { ColorDialog } from './color-dialog.js';
import { BaseComponent, registerElement } from './base-component.js';
import { TimeLine } from './time-line.js';
import { Editor } from '../editor.js';
import { CategoryDialog } from './category-dialog.js';
import { abstractMethod, assert } from '../lib/util.js';
import { PersistedTimeItem } from '../lib/persistence.js';

export class TimeItemSkeleton extends BaseComponent(HTMLElement) {
  #extensionPointBottom
  #extensionPointTop
  #timeLine

  constructor() {
    super();
    
    this._internals= this.attachInternals();

    this.#timeLine= null;
  }

  connectedCallback() {
    assert( !this.#timeLine, 'Item connected a second time' );
    this.#timeLine= this._findFirstParentElementOfType(TimeLine);

    const children= this._instantiateTemplate('time-item-skeleton-template');

    this.#extensionPointTop= this.querySelector('.extension-point.top');
    this.#extensionPointBottom= this.querySelector('.extension-point.bottom');

    // Extension point events
    this.#extensionPointTop.addEventListener('click', () => this.#extensionPointClicked( true ) );
    this.#extensionPointBottom.addEventListener('click', () => this.#extensionPointClicked( false ) );

    // Branch highlight events
    this.querySelector('.indicator').addEventListener('mouseenter', () => this.toggleParentBranchHighlight( true ) );
    this.querySelector('.indicator').addEventListener('mouseleave', () => this.toggleParentBranchHighlight( false ) );

    // Drag event
    this.addEventListener('dragstart', ev => {
      ev.dataTransfer.setData("application/time-line-item", this.id);
      ev.dataTransfer.effectAllowed = 'move';
      this._internals.states.add('dragging');
    });
    this.addEventListener('dragend', () => this._internals.states.delete('dragging') );
    this.addEventListener('dragenter', ev => this.#changeDragHover(ev, true) );
    this.addEventListener('dragleave', ev => this.#changeDragHover(ev, false) );
    this.addEventListener('dragover', ev => this.#handleDragOver( ev ) );
    this.addEventListener('drop', ev => this.#handleDrop(ev) );

    this.id= this.id || TimeItemSkeleton.createUniqueId('time-item');
    this.itemLocation= this.getAttribute('data-location') || 'middle';

    return children;
  }

  #extensionPointClicked( top ) {
    if( Editor.the.keyboard.keyIsDown('Control') ) {
      return;
    }

    const linkableItem= this.#timeLine.parentBoard.linkableItem;
    if( linkableItem ) {
      if( top ) {
        this.#timeLine.linkItemAbove( this, linkableItem );
      } else {
        this.#timeLine.linkItemBelow( this, linkableItem );
      }
      return;
    }

    if( top ) {
      this.#timeLine.addItemAbove(this);
    } else {
      this.#timeLine.addItemBelow(this);
    }
  }

  // Not private as it needs to be overridden by time-branch
  toggleParentBranchHighlight( enable ) {
    const doHighlight= this._internals.states.has('branched') && enable;
    if( this.#timeLine.parentTimeBranch ) {
      this.#timeLine.parentTimeBranch.childHighlighted= doHighlight;

    // Ensure that the state at least can always be reset
    } else if( !doHighlight ) {
      this._internals.states.delete('highlight-parent-branch');
    }
  }

  #preventDragEventDefault( event ) {
    if( event.dataTransfer.types.includes("application/time-line-item") ) {
      event.preventDefault();
      return true;
    }

    return false;
  }

  #changeDragHover( event, entered ) {
    if( this.#preventDragEventDefault( event ) ) {
      event.dataTransfer.dropEffect = entered ? 'move' : 'none';

      if( !entered ) {
        this.#extensionPointTop.classList.remove('force-hover');
        this.#extensionPointBottom.classList.remove('force-hover');
      }
    }
  }

  #isMouseEventInUpperHalf( event ) {
    const {top, height}= this.getBoundingClientRect();
    return event.clientY < top+ height/2;
  }

  #handleDragOver( event ) {
    if( this.#preventDragEventDefault( event ) ) {
      if( this.#isMouseEventInUpperHalf( event ) ) {
        this.#availableTopExtensionPoint.classList.add('force-hover');
        this.#extensionPointBottom.classList.remove('force-hover');
      } else {
        this.#availableTopExtensionPoint.classList.remove('force-hover');
        this.#extensionPointBottom.classList.add('force-hover');
      }
    }
  }

  #handleDrop( event ) {
    if( !this.#preventDragEventDefault( event ) ) {
      return;
    }

    this.#extensionPointTop.classList.remove('force-hover');
    this.#availableTopExtensionPoint.classList.remove('force-hover');
    this.#extensionPointBottom.classList.remove('force-hover');
    
    const insertionItemId= event.dataTransfer.getData('application/time-line-item');
    const insertionItem= document.getElementById( insertionItemId );
    if( !insertionItem ) {
      return;
    }

    insertionItem._internals.states.delete('dragging');

    if( this.#isMouseEventInUpperHalf( event ) ) {
      this.#timeLine.insertItemBelow(insertionItem, this.previousElementSibling);
    } else {
      this.#timeLine.insertItemBelow(insertionItem, this);
    }
  }

  get #availableTopExtensionPoint() {
    if( this.previousElementSibling ) {
      return this.previousElementSibling.#extensionPointBottom;
    }

    return this.#extensionPointTop;
  }

  get timeLine() {
    return this.#timeLine;
  }

  get isTimeBranch() {
    return false;
  }

  set itemLocation( location ) {
    switch( location ) {
      case 'first':
        this._internals.states.delete('last-item');
        this._internals.states.add('first-item');
        break;
      case 'last':
        this._internals.states.delete('first-item');
        this._internals.states.add('last-item');
        this._internals.states.delete('branched');
        this._internals.states.delete('highlight-parent-branch');
        break;
      case 'middle':
        this._internals.states.delete('first-item');
        this._internals.states.delete('last-item');
        break;
      default:
        console.error(`Unknown time item location '${location}'`);
        break;
    }
  }

  set branched( x ) {
    if( x ) {
      this._internals.states.add('branched');
    } else {
      this._internals.states.delete('branched');
      this._internals.states.delete('highlight-parent-branch');
    }
  }

  set parentHighlighted( x ) {
    if( x ) {
      this._internals.states.add('highlight-parent-branch');
    } else {
      this._internals.states.delete('highlight-parent-branch');
    }
  }

  get itemLocation() {
    if( this._internals.states.has('first-item') ) {
      return 'first';
    }
    if( this._internals.states.has('last-item') ) {
      return 'last';
    }
    return 'middle';
  }

  extractAsClone() {
    abstractMethod();
  }
}

class TimeItem extends TimeItemSkeleton {
  #categories
  #categoriesElement
  #color
  #description
  #descriptionElement
  #expandedSize
  #title
  #titleElement
  #titleField

  constructor( title= null, description= null, color= null, categories= [], sizeState= null ) {
    super();
    
    this.#title= title;
    this.#description= description;
    this.#color= color;
    this.#categories= categories;
    this.#expandedSize= sizeState;

    this.#titleElement= null;
    this.#descriptionElement= null;
    this.#titleField= null;
    this.#categoriesElement= null;
  }

  connectedCallback() {
    super.connectedCallback();

    const fieldsElement= this.querySelector('.fields');
    this._instantiateTemplate('time-item-fields-template', fieldsElement);
    
    this.#titleElement= this.querySelector('h3');
    this.#descriptionElement= this.querySelector('textarea');
    this.#categoriesElement= this.querySelector('.categories');


    this.#titleField= this.querySelector('input.title-field');

    // Set the title via the setter so it shows up in the header
    this.itemTitle= this.#title;
    this.#descriptionElement.value= this.#description || '';

    // Header/Title events
    this.#titleElement.addEventListener('click', () => this.#showTitleField() );
    this.#titleField.addEventListener('focusout', () => this.#updateTitleFromField() );
    this.#titleField.addEventListener('keydown', e => {
      if( e instanceof KeyboardEvent && e.key === 'Enter' ) {
        this.#updateTitleFromField();
      }
    });

    // Categories
    this.#categoriesElement.addEventListener('click', () => this.#promptUserForCategories() );

    // Description text area events
    this.#descriptionElement.addEventListener('input', () => this.#description= this.#descriptionElement.value );
    this.querySelector('.collapse-button').addEventListener('click', () => this.toggleDescriptionCollapse() );

    // Disable dragging of the item inside the text field
    this.#descriptionElement.addEventListener('dragstart', e => {
      e.preventDefault();
      e.stopPropagation();
    });

    // Drop down menu events
    const optionsMenu= this.querySelector('drop-down.options');
    optionsMenu.addEventListener('option-colorAsAbove', () => this.color= this.timeLine.aboveItemColor( this ));
    optionsMenu.addEventListener('option-colorAsBelow', () => this.color= this.timeLine.belowItemColor( this ));
    optionsMenu.addEventListener('option-selectColor', () => this.#promptUserForColor());
    optionsMenu.addEventListener('option-removeColor', () => this.color= null);
    optionsMenu.addEventListener('option-duplicate', () => this.timeLine.addItemAbove(this, this.clone()));
    optionsMenu.addEventListener('option-remove', () => this.timeLine.removeItem(this));
    optionsMenu.addEventListener('option-branchAbove', () => this.timeLine.branchAbove(this));
    optionsMenu.addEventListener('option-branchBelow', () => this.timeLine.branchBelow(this));

    this.#restoreExpandedSize();
    this.#updateEmptyState();
    this.#updateColorValue();
    this.#updateCategories();

    // Notify parent that init is complete
    this.timeLine.childConnectedCallback( this );
  }

  disconnectedCallback() {
  }

  adoptedCallback() {
  }

  clone() {
    // Encode the size state (see #restoreExpandedSize)
    const size= this.#getCurrentExpandedSize();
    const sizeState= size < 0 ? this.#expandedSize : -size;
    return new TimeItem( this.#title, this.#description, this.#color, this.#categories, sizeState );
  }

  extractAsClone() {
    return this.clone();
  }

  toPersisted() {
    const size= this.#getCurrentExpandedSize();
    return new PersistedTimeItem(
      this.id,
      this.#title,
      this.#description,
      this.#color,
      size < 0 ? this.#expandedSize : size,
      size >= 0,
      this.#categories
    );
  }

  loadPersisted( persistedTimeItem ) {
    this.id= persistedTimeItem.id;
    this.itemTitle= persistedTimeItem.title;
    this.#description= persistedTimeItem.description;
    this.#descriptionElement.value= persistedTimeItem.description;
    this.color= persistedTimeItem.color;
    this.categories= persistedTimeItem.categories;

    if( persistedTimeItem.isExpanded ) {
      this.#descriptionElementHeight= persistedTimeItem.expandedSize;
      this.#expandedSize= -1;
    } else {
      this.#descriptionElementHeight= 30;
      this.#expandedSize= persistedTimeItem.expandedSize;
    }
  }

  #showTitleField() {
    this._internals.states.add('edit-title');
    this.#titleField.value= this.#title || '';
    this.#titleField.focus();
  }

  #updateTitleFromField() {
    this._internals.states.delete('edit-title');
    this.itemTitle= this.#titleField.value.trim() || null;
  }

  #updateEmptyState() {
    if( this.#title && this.#title.trim() ) {
      this._internals.states.delete('empty');
    } else {
      this._internals.states.add('empty');
    }
  }

  #getCurrentExpandedSize() {
    const currentHeight= parseInt( this.#descriptionElement.style.height ) || 30;
    const isCollapsed= this.#expandedSize >= 0 && currentHeight === 30;
    return isCollapsed ? -1 : currentHeight;
  }

  #restoreExpandedSize() {
    // Restore the text field size from the size state set in the constructor, which is either
    // null: Nothing set, <0: item is expanded, >=0: item is collapsed (hence the expanded size is > 0)
    if( this.#expandedSize === null ) {
      this.#expandedSize= -1;

    } else if( this.#expandedSize < 0 ) {
      this.#descriptionElementHeight= -this.#expandedSize;
      this.#expandedSize= -1;
    }
  }

  toggleDescriptionCollapse() {
    const size= this.#getCurrentExpandedSize();
    if( size < 0 ) {
      this.#descriptionElementHeight= this.#expandedSize;
      this.#expandedSize= -1;
    } else {
      this.#descriptionElementHeight= 30;
      this.#expandedSize= size;
    }
  }

  set #descriptionElementHeight( height ) {
    this.#descriptionElement.style.height= `${height}px`;
  }

  set itemTitle( title ) {
    this.#title= title;
    this.#titleElement.innerText= title || 'Add Title';

    this.#updateEmptyState();
  }
    
  async #promptUserForColor() {
    const color= await ColorDialog.the.prompt( this.#color );
    if( color !== ColorDialog.Canceled ) {
      this.color= color;
    }
  }

  set color( color ) {
    this.#color= color;
    this.#updateColorValue();
  }

  get color() {
    return this.#color;
  }

  #updateColorValue() {
    if( this.#color ) {
      this.style.setProperty('--color-line', this.#color);
    } else {
      this.style.removeProperty('--color-line');
    }
  }

  async #promptUserForCategories() {
    const categories= await CategoryDialog.the.prompt( this.#categories );
    if( categories !== CategoryDialog.Canceled ) {
      this.categories= categories;
    }
  }

  set categories( categories ) {
    this.#categories= categories;
    this.#updateCategories();
  }

  hasCategory( category ) {
    return this.#categories.includes( category );
  }

  #updateCategories() {
    this.#categoriesElement.innerHTML= '';
    for( const category of this.#categories ) {
      this.#categoriesElement.appendChild( document.createElement('span') ).style.backgroundColor= category;
    }
  }

  get title() {
    return this.#title;
  }

  get description() {
    return this.#description;
  }
}

registerElement('time-item', TimeItem);
