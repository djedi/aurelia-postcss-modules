import {ViewEngine, resource} from 'aurelia-templating';
import {SyntaxInterpreter} from 'aurelia-templating-binding';
import {DOM} from 'aurelia-pal';
import {Loader} from 'aurelia-loader';

class CSSModuleViewEngineHooks {
  count = 0;

  css = null;
  styleObject = null;

  constuctor() {
    this.styleElementParent = null;
    this.styleElemnt = null;
  }

  beforeBind(view) {
    const overrideContext = view.overrideContext;
    const $styles = overrideContext.$styles || {};

    overrideContext.$styles = Object.assign($styles, this.styleObject);

    if (this.count === 0) {
      this.ensureStyleElementIsAddedToDocument();
      this.count = 1;
    } else {
      this.count += 1;
    }
  }

  beforeUnbind() {
    this.count -= 1;

    if (this.count === 0) {
      this.removeStyleElement();
    }
  }

  ensureStyleElementIsAddedToDocument() {
    if (this.styleElement === undefined) {
      this.styleElement = DOM.injectStyles(this.css);
    } else if (!this.styleElement.parentNode) {
      this.styleElementParent.appendChild(this.styleElement);
    }
  }

  removeStyleElement() {
    this.styleElementParent = this.styleElement.parentNode;
    DOM.removeNode(this.styleElement);
  }
}

export class CSSModuleResource {
  css = undefined;
  resources = undefined;
  container = undefined;
  hooks = undefined;

  constructor(cssFile, styleModule) {
    this.cssFile = cssFile;
    this.styleModule = styleModule;
  }

  initialize(container) {
    this.container = container;
    this.hooks = new CSSModuleViewEngineHooks();
  }

  register(registry) {
    registry.registerViewEngineHooks(this.hooks);
  }

  load(container) {
    const loader = container.get(Loader);

    return loader
      .loadText(this.cssFile)
      .then(cssContent => {
        this.hooks.css = cssContent;
      })
      .then(() => {
        return loader.loadText(this.styleModule).then(styleModuleJSON => {
          this.hooks.styleObject = JSON.parse(styleModuleJSON);
          return this;
        });
      });
  }
}

function createCSSModuleResource(cssFile, styleModule) {
  @resource(new CSSModuleResource(cssFile, styleModule))
  class DynamicResource {}

  return {Dynamic: DynamicResource};
}

export function configure(config) {
  const viewEngine = config.container.get(ViewEngine);

  viewEngine.addResourcePlugin('.css#module', {
    fetch(address) {
      const unencoded = address.replace('%23', '#');
      const cssFile = unencoded.replace('.css#module', '.css');
      const styleModule = unencoded.replace('.css#module', '.css.json');
      return Promise.resolve(createCSSModuleResource(cssFile, styleModule));
    },
  });

  const proto = SyntaxInterpreter.prototype;
  const original = proto.handleUnknownCommand;

  proto.handleUnknownCommand = function(r, e, i, ei = undefined, c = undefined) {
    if (i.attrName === 'styles') {
      i.attrName = 'class';
      i.attrValue = `$styles.${i.command.replace(/-/g, '_')}`;
      return this['one-time'](r, e, i, ei, c);
    }
    return original.call(this, r, e, i, ei, c);
  };
}
