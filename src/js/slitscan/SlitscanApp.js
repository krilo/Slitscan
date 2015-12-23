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
    let numBuffers = 10;
    let bufferContainer = document.querySelector('.buffers-container')
    let bufferWidth = 50
    let bufferHeight = 50

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

      let grad= ctx.createLinearGradient(0, 0, bufferWidth, 0);
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

    for (var i = 0; i < numBuffers; i++) {
      let canvas = document.createElement('canvas')
      canvas.width = bufferWidth
      canvas.height = bufferHeight
      let ctx = canvas.getContext('2d')
      ctx.fillStyle = `rgb(${Math.floor(255-25.5*i)}, ${Math.floor(255-25.5*i)}, 255)`;
      ctx.fillRect(0, 0, bufferWidth, bufferHeight)
      buffers[i] = canvas;
      bufferContainer.appendChild(canvas)
    }

    /**
     * Create Mask
     */
    let maskIndex = 0;
    let maskCanvas = getMask(0,1)

    this.renderer = new THREE.WebGLRenderer( { alpha: true, antialias: true })
    this.renderer.sortObjects = false;

    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize( 800, 600 );

    this.renderer.domElement.setAttribute('id', 'binorycanvas')
    this.renderer.domElement.setAttribute('binory-canvas', '')
    this.el.appendChild(this.renderer.domElement)

    let bufferArray = []
    for (var i = 0; i < buffers.length; i++) {
      bufferArray[i] = getTexture(buffers[i])
    }

    let geometry = new THREE.PlaneBufferGeometry(2, 2)
    let uniforms = {
      time:             { type: "f", value: 1.0 },
      resolution:       { type: "v2", value: new THREE.Vector2(800, 600) },
      mask:             { type: "t", value: getTexture(maskCanvas)},
      numBuffers:       { type: "f", value: numBuffers},
      bufferArray:      { type: "tv", value: bufferArray}
    }

    let vertexShader = `
      void main()	{
        gl_Position = vec4( position, 1.0 );
      }`;

    let fragmentShaderIfstatement = '';
    for (var i = 0; i < numBuffers; i++) {
      if(i == 0){
          fragmentShaderIfstatement += `if(arrayIndex == ${i}.){
            bufferPixel = texture2D(bufferArray[${i}], p);
          }`
      } else {
        fragmentShaderIfstatement += `else if(arrayIndex == ${i}.){
          bufferPixel = texture2D(bufferArray[${i}], p);
        }`
      }
    }

    let fragmentShader = `
      uniform float time;
      uniform float numBuffers;
      uniform vec2 resolution;

      uniform sampler2D mask;
      uniform sampler2D bufferArray[${numBuffers}];

      vec4 drawPixel (vec2 p) {
        vec4 maskPixel = texture2D(mask, p);
        float brightness = distance(maskPixel, vec4(0.0, 0.0, 0.0, 1.0));
        float arrayIndex = floor((brightness/2.)*numBuffers);
        vec4 bufferPixel;

        ${fragmentShaderIfstatement}

        return bufferPixel;
      }

      void main() {
        vec2 p = ( gl_FragCoord.xy / resolution.xy );
        gl_FragColor = drawPixel(p);
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
