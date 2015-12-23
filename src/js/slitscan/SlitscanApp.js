class SlitscanApp {
  constructor(options){
    this.el = options.el;

    // Add Events
    this.initScene()
    this.resize()

  }

  initScene(){

    this.camera = new THREE.Camera( )
    this.camera.position.z = 1
    this.scene = new THREE.Scene();

    // Buffer
    let buffers = []
    let currentBuffer = 0;
    let numBuffers = 32;
    let bufferContainer = document.querySelector('.buffers-container')
    let bufferWidth = 512
    let bufferHeight = 512

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

    let addedGradient = false
    const getMask = (start, stop) => {
      let canvas = document.querySelector('#mask') || document.createElement('canvas')
      canvas.setAttribute('id', 'mask')
      canvas.width = bufferWidth
      canvas.height = bufferHeight
      let ctx = canvas.getContext('2d')

      let grad= ctx.createLinearGradient(0, 0, bufferWidth, bufferHeight);
      grad.addColorStop(start, "#000");
      grad.addColorStop(stop, "#FFF");

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, bufferWidth, bufferHeight)
      if(!addedGradient){
        addedGradient = true;
        bufferContainer.appendChild(canvas)
      }
      return canvas;
    }

    /**
     * Create Buffers
     */

    let bufferCanvas = document.createElement('canvas')
    bufferCanvas.width = bufferWidth*numBuffers
    bufferCanvas.height = bufferHeight;
    let bufferCtx = bufferCanvas.getContext('2d')
    let numCol = 0;

    for (var i = 0; i < numBuffers; i++) {
      let grad= bufferCtx.createLinearGradient(0, 0, bufferWidth, 0);
      grad.addColorStop(0, `rgb(${Math.round(Math.random()*255)}, ${Math.round(Math.random()*255)}, ${Math.round(Math.random()*255)})`);
      grad.addColorStop(1, `rgb(${Math.round(Math.random()*255)}, ${Math.round(Math.random()*255)}, ${Math.round(Math.random()*255)})`);
      bufferCtx.fillStyle = grad;

      numCol++;
      bufferCtx.fillRect(bufferWidth*i, 0, bufferWidth, bufferHeight)
      bufferContainer.appendChild(bufferCanvas)
    }

    /**
     * Create Mask
     */
    let maskIndex = 0;
    let maskCanvas = getMask(0,1)

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
      mask:             { type: "t", value: getTexture(maskCanvas)},
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

    const render = () => {

      maskIndex++;
      if(maskIndex > 100){
        maskIndex = 0;
      }
      maskCanvas = getMask(maskIndex/100,1)
      let maskTexture = getTexture(maskCanvas);
      maskTexture.needsUpdate = true

      uniforms.time.value += 0.005;
      uniforms.mask.value = maskTexture

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
