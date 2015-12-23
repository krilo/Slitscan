(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _SlitscanApp = require('./slitscan/SlitscanApp');

var _SlitscanApp2 = _interopRequireDefault(_SlitscanApp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(function () {
  var App = new _SlitscanApp2.default({ el: document.querySelector('#app') });
})();

},{"./slitscan/SlitscanApp":3}],2:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MaskCanvas = (function () {
  function MaskCanvas() {
    _classCallCheck(this, MaskCanvas);

    this.canvas = document.querySelector('#mask') || document.createElement('canvas');
    this.canvas.setAttribute('id', 'mask');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.fillStyle = "rgba(255, 255, 255, 1)";
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    for (var i = 0; i < 60; i++) {
      var size = 200;
      var pos = { x: Math.random() * (window.innerWidth - size), y: Math.random() * (window.innerHeight - size) };
      var gradient = this.ctx.createRadialGradient(pos.x + size / 2, pos.y + size / 2, size / 2, pos.x + size / 2, pos.y + size / 2, 0);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(255,255,255,1)');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(pos.x, pos.y, size, size);
    }

    this.canvas.setAttribute('id', 'mask');
    document.body.appendChild(this.canvas);
  }

  _createClass(MaskCanvas, [{
    key: 'render',
    value: function render() {}
  }]);

  return MaskCanvas;
})();

module.exports = MaskCanvas;

},{}],3:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _MaskCanvas = require('./MaskCanvas');

var _MaskCanvas2 = _interopRequireDefault(_MaskCanvas);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SlitscanApp = (function () {
  function SlitscanApp(options) {
    _classCallCheck(this, SlitscanApp);

    this.el = options.el;

    // Add Events
    this.initScene();
    this.resize();
  }

  _createClass(SlitscanApp, [{
    key: 'initScene',
    value: function initScene() {
      var _this = this;

      this.camera = new THREE.Camera();
      this.camera.position.z = 1;
      this.scene = new THREE.Scene();

      this.maskCanvas = new _MaskCanvas2.default();

      // Buffer
      var buffers = [];
      var currentBuffer = 0;
      var numBuffers = 8;
      var bufferContainer = document.querySelector('.buffers-container');
      var bufferWidth = 512;
      var bufferHeight = 512;

      var getTexture = function getTexture(canvas) {
        var image = new Image();
        image.src = canvas.toDataURL('image/png');
        var texture = new THREE.Texture();
        texture.image = image;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;

        image.onload = function () {
          texture.needsUpdate = true;
        };

        return texture;
      };

      /**
       * Create Buffers
       */

      var bufferCanvas = document.createElement('canvas');
      bufferCanvas.width = bufferWidth * numBuffers;
      bufferCanvas.height = bufferHeight;
      var bufferCtx = bufferCanvas.getContext('2d');
      var numCol = 0;

      for (var i = 0; i < numBuffers; i++) {
        var grad = bufferCtx.createLinearGradient(0, 0, bufferWidth, 0);
        grad.addColorStop(0, 'rgb(' + Math.round(Math.random() * 255) + ', ' + Math.round(Math.random() * 255) + ', ' + Math.round(Math.random() * 255) + ')');
        grad.addColorStop(1, 'rgb(' + Math.round(Math.random() * 255) + ', ' + Math.round(Math.random() * 255) + ', ' + Math.round(Math.random() * 255) + ')');
        bufferCtx.fillStyle = grad;

        numCol++;
        bufferCtx.fillRect(bufferWidth * i, 0, bufferWidth, bufferHeight);
        bufferContainer.appendChild(bufferCanvas);
      }

      /**
       * Create Mask
       */

      this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      this.renderer.sortObjects = false;

      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.el.appendChild(this.renderer.domElement);

      var bufferArray = [];
      for (var i = 0; i < buffers.length; i++) {
        bufferArray[i] = getTexture(buffers[i]);
      }

      var geometry = new THREE.PlaneBufferGeometry(2, 2);
      var uniforms = {
        time: { type: "f", value: 1.0 },
        resolution: { type: "v2", value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        mask: { type: "t", value: getTexture(this.maskCanvas.canvas) },
        numBuffers: { type: "f", value: numBuffers },
        buffer: { type: "t", value: getTexture(bufferCanvas) },
        spriteSize: { type: "v2", value: new THREE.Vector2(bufferWidth * numBuffers, bufferWidth) },
        tileSize: { type: "v2", value: new THREE.Vector2(bufferWidth, bufferHeight) }
      };

      var vertexShader = '\n      void main()\t{\n        gl_Position = vec4( position, 1.0 );\n      }';

      var fragmentShader = '\n      uniform float time;\n      uniform float numBuffers;\n      uniform vec2 resolution;\n      uniform float buffersPerRow;\n\n      uniform sampler2D mask;\n      uniform sampler2D buffer;\n\n      uniform vec2 spriteSize;\n      uniform vec2 tileSize;\n\n      // Spritesheets\n      vec4 drawSprite (vec2 p) {\n\n        vec4 maskPixel = texture2D(mask, p);\n        float brightness = distance(maskPixel, vec4(0.0, 0.0, 0.0, 1.0));\n        float arrayIndex = floor((brightness/2.)*numBuffers);\n        ivec2 tile = ivec2(arrayIndex, 0);\n\n        vec2 absP = p*resolution.xy;\n        vec2 tileRatio = tileSize/spriteSize;\n        vec2 tilePosition = vec2(tile)*tileRatio;\n        return texture2D(buffer, p*tileRatio+tilePosition);\n      }\n\n      void main() {\n        vec2 p = ( gl_FragCoord.xy / resolution.xy );\n        gl_FragColor = drawSprite(p);\n      }';

      var material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
      });

      var mesh = new THREE.Mesh(geometry, material);
      this.scene.add(mesh);

      var render = function render() {

        /*maskIndex++;
        if(maskIndex > 100){
          maskIndex = 0;
        }
        maskCanvas = getMask(maskIndex/100,1)
        let maskTexture = getTexture(maskCanvas);
        maskTexture.needsUpdate = true*/

        uniforms.time.value += 0.005;
        //uniforms.mask.value = maskTexture

        _this.renderer.render(_this.scene, _this.camera);
        requestAnimationFrame(render.bind(_this));
      };

      render();
    }
  }, {
    key: 'resize',
    value: function resize() {
      //this.el.width = window.innerWidth;
      //this.el.height = window.innerHeight;
      //this.renderer.setSize( this.el.offsetWidth, this.el.offsetHeight );
    }
  }]);

  return SlitscanApp;
})();

module.exports = SlitscanApp;

},{"./MaskCanvas":2}]},{},[1])


//# sourceMappingURL=map/index.js.map
