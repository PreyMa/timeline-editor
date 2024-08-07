
export class Selection {
  #items

  constructor( initSet= [] ) {
    this.#items= new Set( initSet );
  }

  add( item ) {
    this.#items.add( item );
  }

  remove( item ) {
    this.#items.delete( item );
  }

  clear() {
    this.#items.clear();
  }

  has( item ) {
    return this.#items.has( item );
  }

  moveBy( vector ) {
    if( !vector.x && !vector.y ) {
      return;
    }

    // Ensure that no item will end up in negative space
    for( const item of this.#items ) {
      const newPos= item.transformPosition.add(vector);
      if( newPos.x < 0 || newPos.y < 0 ) {
        return false;
      }
    }

    for( const item of this.#items ) {
      item.moveInSelection( this, vector );
    }

    return true;
  }
}
