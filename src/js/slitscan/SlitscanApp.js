import MaskCanvas from './MaskCanvas';

class SlitscanApp {
  constructor(options){
    this.el = options.el;

    // Add Events
    this.initScene()
    this.resize()

  }

  initScene(){

    let video = document.createElement("video");
    let videoCanvas = document.createElement("canvas");
    let videoCtx = videoCanvas.getContext("2d");

    navigator.getUserMedia = navigator.mozGetUserMedia || navigator.getUserMedia || navigator.webkitGetUserMedia;

    navigator.getUserMedia({video: true}, function(stream) {
      let url = URL.createObjectURL(stream);
      video.src = url;
      video.play();
      //document.body.appendChild(video)
    }, function() {
      alert("NAH");
    });


    this.camera = new THREE.Camera( )
    this.camera.position.z = 1
    this.scene = new THREE.Scene();

    this.maskCanvas = new MaskCanvas();

    // Buffer
    let buffers = []
    let currentBuffer = 0;
    let numBuffers = 48;
    let bufferContainer = document.querySelector('.buffers-container')
    let bufferWidth = 12
    let bufferHeight = 12

    const getTexture = (canvas) => {
      let image = new Image();
      image.src = canvas.toDataURL('image/png');
      let texture = new THREE.Texture();
      texture.image = image;
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearFilter;

      image.onload = () => {
        texture.needsUpdate = true;
      };

      return texture
    }

    /**
     * Create Buffers
     */

    let bufferCanvas = document.createElement('canvas')
    bufferCanvas.width = bufferWidth*numBuffers
    bufferCanvas.height = bufferHeight;
    let bufferCtx = bufferCanvas.getContext('2d')
    let numCol = 0;

    for (let i = 0; i < numBuffers; i++) {
      let grad= bufferCtx.createLinearGradient(0, 0, bufferWidth, 0);
      grad.addColorStop(0, `rgb(140, 20, ${Math.round(i*(255/numBuffers))}`);
      grad.addColorStop(1, `rgb(140, 20, ${Math.round(i*(255/numBuffers))}`);
      //grad.addColorStop(1, `rgb(${Math.round(Math.random()*255)}, ${Math.round(Math.random()*255)}, ${Math.round(Math.random()*255)})`);
      bufferCtx.fillStyle = grad;

      numCol++;
      bufferCtx.fillRect(bufferWidth*i, 0, bufferWidth, bufferHeight)
      //bufferContainer.appendChild(bufferCanvas)
    }

    /**
     * Create Mask
     */

    this.renderer = new THREE.WebGLRenderer( { alpha: true, antialias: true })
    this.renderer.sortObjects = false;

    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.el.appendChild(this.renderer.domElement)

    let bufferArray = []
    for (var i = 0; i < buffers.length; i++) {
      bufferArray[i] = getTexture(buffers[i])
    }

    let geometry = new THREE.PlaneBufferGeometry(2, 2)
    let uniforms = {
      time:             { type: "f", value: 1.0 },
      resolution:       { type: "v2", value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      mask:             { type: "t", value: getTexture(this.maskCanvas.canvas)},
      numBuffers:       { type: "f", value: numBuffers},
      buffer:           { type: "t", value: getTexture(bufferCanvas)},
      spriteSize:       { type: "v2", value: new THREE.Vector2(bufferWidth*numBuffers, bufferWidth) },
      tileSize:         { type: "v2", value: new THREE.Vector2(bufferWidth, bufferHeight) }
    }

    let vertexShader = `
      void main()	{
        gl_Position = vec4( position, 1.0 );
      }`;

    let fragmentShader = `
      uniform float time;
      uniform float numBuffers;
      uniform vec2 resolution;
      uniform float buffersPerRow;

      uniform sampler2D mask;
      uniform sampler2D buffer;

      uniform vec2 spriteSize;
      uniform vec2 tileSize;

      // Spritesheets
      vec4 drawSprite (vec2 p) {

        vec4 maskPixel = texture2D(mask, p);
        float brightness = distance(maskPixel, vec4(0.0, 0.0, 0.0, 1.0));
        float arrayIndex = floor((brightness/2.)*numBuffers);
        ivec2 tile = ivec2(arrayIndex, 0);

        vec2 absP = p*resolution.xy;
        vec2 tileRatio = tileSize/spriteSize;
        vec2 tilePosition = vec2(tile)*tileRatio;
        return texture2D(buffer, p*tileRatio+tilePosition);
      }

      void main() {
        vec2 p = ( gl_FragCoord.xy / resolution.xy );
        gl_FragColor = drawSprite(p);
      }`;

    let material = new THREE.ShaderMaterial( {
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    });

    let mesh = new THREE.Mesh(geometry, material)
    this.scene.add(mesh)

    let index = 0;
    const render = () => {
      videoCanvas.width = video.videoWidth;
      videoCanvas.height = video.videoHeight;


      if (videoCanvas.width > 0) {
        bufferCtx.drawImage(video,bufferWidth*index, 0, bufferWidth, bufferHeight)
        index++;
        if(index > numBuffers){
          index = 0;
        }
      }

      uniforms.time.value += 0.005;
      let bufferTexture = getTexture(bufferCanvas);
      uniforms.buffer.value = bufferTexture;
      bufferTexture.needsUpdate = true;

      this.renderer.render( this.scene, this.camera );
      requestAnimationFrame( render.bind(this) );
    }

    render()
  }


  resize(){
    //this.el.width = window.innerWidth;
    //this.el.height = window.innerHeight;
    //this.renderer.setSize( this.el.offsetWidth, this.el.offsetHeight );
  }
}

module.exports = SlitscanApp;
