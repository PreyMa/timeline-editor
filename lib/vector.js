
export class Vector {
  #x
  #y

  constructor(x= 0, y= 0) {
    this.#x= x;
    this.#y= y;
  }

  clone() {
    return new Vector( this.#x, this.#y );
  }

  get x() {
    return this.#x;
  }

  get y() {
    return this.#y;
  }

  add( other ) {
    return new Vector( this.#x+ other.x, this.#y+ other.y );
  }

  sub( other ) {
    return new Vector( this.#x- other.x, this.#y- other.y );
  }

  abs() {
    return new Vector( Math.abs(this.#x), Math.abs(this.#y) );
  }

  equals( other ) {
    return this.#x === other.x && this.#y === other.y;
  }

  move( x, y ) {
    return new Vector( this.#x+ x, this.#y+ y );
  }

  withX( x ) {
    return new Vector( x, this.#y );
  }
  
  withY( y ) {
    return new Vector( this.#x, y );
  }
}
