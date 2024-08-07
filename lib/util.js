
export function assert( cond, msg= 'Assertion failed' ) {
  if( !cond ) {
    msg= typeof msg === 'function' ? msg() : msg;

    throw new Error( msg );
  }
}

export function abstractMethod() {
  throw new Error('Abstract method called');
}

export function safeFileName( str ) {
  return str.replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_');
}

export function downloadFile(fileName, type, content) {
  const anchorElement= document.createElement('a');
  const file= new Blob([content], {type});
  anchorElement.href= URL.createObjectURL(file);
  anchorElement.download= fileName;
  anchorElement.click();
}

async function promptUserForFile() {
  return new Promise((res, rej) => {
    const fileInput = document.createElement('input');
    fileInput.type='file';
    fileInput.onchange= () => res( fileInput.files );
    fileInput.click();
  });
}

async function readFileContents( file ) {
  return new Promise((res, rej) => {
    try {
      const reader= new FileReader();
      reader.onload= () => res( reader.result );
      reader.readAsText( file );
    } catch( e ) {
      rej( e );
    }
  });
}

export async function openFile() {
  const files= await promptUserForFile();
  if( !files.length ) {
    return null;
  }

  return await readFileContents( files[0] );
}
