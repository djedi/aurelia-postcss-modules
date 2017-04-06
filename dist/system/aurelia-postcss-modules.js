'use strict';

System.register(['aurelia-templating', 'aurelia-templating-binding', 'aurelia-pal', 'aurelia-loader'], function (_export, _context) {
  "use strict";

  var ViewEngine, resource, SyntaxInterpreter, DOM, Loader, CSSModuleViewEngineHooks, CSSModuleResource;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function createCSSModuleResource(cssFile, styleModule) {
    var _dec, _class3;

    var DynamicResource = (_dec = resource(new CSSModuleResource(cssFile, styleModule)), _dec(_class3 = function DynamicResource() {
      _classCallCheck(this, DynamicResource);
    }) || _class3);


    return { Dynamic: DynamicResource };
  }

  function configure(config) {
    var viewEngine = config.container.get(ViewEngine);

    viewEngine.addResourcePlugin('.css#module', {
      fetch: function fetch(address) {
        var unencoded = address.replace('%23', '#');
        var cssFile = unencoded.replace('.css#module', '.css');
        var styleModule = unencoded.replace('.css#module', '.css.json');
        return Promise.resolve(createCSSModuleResource(cssFile, styleModule));
      }
    });

    var proto = SyntaxInterpreter.prototype;
    var original = proto.handleUnknownCommand;

    proto.handleUnknownCommand = function (r, e, i) {
      var ei = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;
      var c = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : undefined;

      if (i.attrName === 'styles') {
        i.attrName = 'class';
        i.attrValue = '$styles.' + i.command.replace(/-/g, '_');
        return this['one-time'](r, e, i, ei, c);
      }
      return original.call(this, r, e, i, ei, c);
    };
  }

  _export('configure', configure);

  return {
    setters: [function (_aureliaTemplating) {
      ViewEngine = _aureliaTemplating.ViewEngine;
      resource = _aureliaTemplating.resource;
    }, function (_aureliaTemplatingBinding) {
      SyntaxInterpreter = _aureliaTemplatingBinding.SyntaxInterpreter;
    }, function (_aureliaPal) {
      DOM = _aureliaPal.DOM;
    }, function (_aureliaLoader) {
      Loader = _aureliaLoader.Loader;
    }],
    execute: function () {
      CSSModuleViewEngineHooks = function () {
        function CSSModuleViewEngineHooks() {
          _classCallCheck(this, CSSModuleViewEngineHooks);

          this.count = 0;
          this.css = null;
          this.styleObject = null;
        }

        CSSModuleViewEngineHooks.prototype.constuctor = function constuctor() {
          this.styleElementParent = null;
          this.styleElemnt = null;
        };

        CSSModuleViewEngineHooks.prototype.beforeBind = function beforeBind(view) {
          var overrideContext = view.overrideContext;
          var $styles = overrideContext.$styles || {};

          overrideContext.$styles = Object.assign($styles, this.styleObject);

          if (this.count === 0) {
            this.ensureStyleElementIsAddedToDocument();
            this.count = 1;
          } else {
            this.count += 1;
          }
        };

        CSSModuleViewEngineHooks.prototype.beforeUnbind = function beforeUnbind() {
          this.count -= 1;

          if (this.count === 0) {
            this.removeStyleElement();
          }
        };

        CSSModuleViewEngineHooks.prototype.ensureStyleElementIsAddedToDocument = function ensureStyleElementIsAddedToDocument() {
          if (this.styleElement === undefined) {
            this.styleElement = DOM.injectStyles(this.css);
          } else if (!this.styleElement.parentNode) {
            this.styleElementParent.appendChild(this.styleElement);
          }
        };

        CSSModuleViewEngineHooks.prototype.removeStyleElement = function removeStyleElement() {
          this.styleElementParent = this.styleElement.parentNode;
          DOM.removeNode(this.styleElement);
        };

        return CSSModuleViewEngineHooks;
      }();

      _export('CSSModuleResource', CSSModuleResource = function () {
        function CSSModuleResource(cssFile, styleModule) {
          _classCallCheck(this, CSSModuleResource);

          this.css = undefined;
          this.resources = undefined;
          this.container = undefined;
          this.hooks = undefined;

          this.cssFile = cssFile;
          this.styleModule = styleModule;
        }

        CSSModuleResource.prototype.initialize = function initialize(container) {
          this.container = container;
          this.hooks = new CSSModuleViewEngineHooks();
        };

        CSSModuleResource.prototype.register = function register(registry) {
          registry.registerViewEngineHooks(this.hooks);
        };

        CSSModuleResource.prototype.load = function load(container) {
          var _this = this;

          var loader = container.get(Loader);

          return loader.loadText(this.cssFile).then(function (cssContent) {
            _this.hooks.css = cssContent;
          }).then(function () {
            return loader.loadText(_this.styleModule).then(function (styleModuleJSON) {
              _this.hooks.styleObject = JSON.parse(styleModuleJSON);
              return _this;
            });
          });
        };

        return CSSModuleResource;
      }());

      _export('CSSModuleResource', CSSModuleResource);
    }
  };
});