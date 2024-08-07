
export function BaseComponent( SuperClass ) {
  return class BaseComponent extends SuperClass {

    static createUniqueId( type ) {
      const timeString= Date.now().toString(16).padStart(12, '0');
      const randString= Math.floor(100000* Math.random()).toString(16).padStart(5, '0');
      return `${type}-${timeString}-${randString}`;
    }

    _instantiateTemplate( templateId, elem= null ) {
      elem= elem || this;

      const oldChildren= [...this.children];
      elem.innerHTML= '';

      const template= document.getElementById(templateId).content;
      elem.appendChild(template.cloneNode(true));

      return oldChildren;
    }

    _findFirstParentElementOfType( type ) {
      let parent= this;
      while( parent && !(parent instanceof type) ) {
        parent= parent.parentNode;
      }
      return parent;
    }

    _forEachChild( fnOrElem, fn ) {
      fn= fn || fnOrElem;
      const elem= fn ? fnOrElem : this;

      for( let i= 0; i< elem.children.length; i++) {
        fn( elem.children[i], i, elem.children);
      }
    }

    _clearElement( elem ) {
      elem= elem || this;

      while( elem.firstElementChild ) {
        elem.removeChild( elem.firstElementChild );
      }
    }

    _hasUninitializedCustomElementChild( elem ) {
      elem= elem || this;

      for( let i= 0; i< elem.children.length; i++) {
        const child= elem.children[i];
        if( child instanceof HTMLElement && child.constructor === HTMLElement && registeredElements.find( ({name}) => name === child.tagName.toLowerCase() ) ) {
          return true;
        }
      }

      return false;
    }
  }
}

export const Components= {};

const registeredElements= [];
export function registerElement(name, clazz) {
  registeredElements.push( {name, clazz} );
  Components[clazz.name]= clazz;
  clazz.componentTagName= name;
}

export function defineElements() {
  registeredElements.forEach( ({name, clazz}) => customElements.define(name, clazz) );
}

export function isTag(element, tagName) {
  tagName= typeof tagName === 'string' ? tagName : tagName.componentTagName;
  return element ? element.tagName.toLowerCase() === tagName : false;
}
