
function exists( object ) {
  return object !== null && typeof object !== 'undefined';
}

export function validateObject( object, shape, options= {} ) {
  const { nullable, unknownKeys }= {nullable: false, unknownKeys: false, ...options};

  if( !exists(object) ) {
    if( !nullable ) {
      throw new Error('Missing object');
    }

    return;
  }

  for( const key in shape ) {
    const entry= shape[key];
    const config= typeof entry === 'string' || typeof entry === 'function' ? {type: entry} : entry;
    const {type, nullable}= {nullable: false, ...config};

    const value= object[key];
    if( value === null ) {
      if( !nullable ) {
        throw new Error(`Missing key on object '${key}'`);
      }

      continue;
    }

    if( typeof type === 'string' ) {
      if( typeof value !== type ) {
        throw new Error(`Object property '${key}' has invalid type '${typeof value}' (expected ${type})`);
      }
    } else if( typeof type === 'function' ) {
      if( !(value instanceof type) ) {
        throw new Error(`Object property '${key}' is an invalid instance of '${value.constructor.name}' (expected ${type.name})`);
      }
    } else {
      throw new Error(`Config for object key '${key}' has invalid type specifier (${typeof type})`);
    }
  }

  if( !unknownKeys ) {
    const allowed= Object.keys( shape );
    for( const key in object ) {
      if( !allowed.includes(key) ) {
        throw new Error(`Object with illegal key '${key}'`);
      }
    }
  }
}
