import { Vector } from './vector.js';

export class Grid {
  constructor( size ) {
    this.size= size;
  }

  #snapWithThreshold( vector, threshold ) {
    const xsteps= Math.floor( vector.x / this.size );
    const ysteps= Math.floor( vector.y / this.size );

    const xrest= Math.abs( vector.x - xsteps * this.size );
    const yrest= Math.abs( vector.y - ysteps * this.size );

    const xjump= (xrest > threshold) ? 1 : 0;
    const yjump= (yrest > threshold) ? 1 : 0;

    const x= (xsteps+ xjump) * this.size;
    const y= (ysteps+ yjump) * this.size;
    
    return new Vector( x, y );
  }

  snap( vector ) {
    return this.#snapWithThreshold( vector, this.size / 2 );
  }

  snapForward( vector ) {
    return this.#snapWithThreshold( vector, 0 );
  }
}
