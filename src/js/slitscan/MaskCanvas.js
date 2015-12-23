class MaskCanvas {
  constructor(){
    this.canvas = document.querySelector('#mask') || document.createElement('canvas')
    this.canvas.setAttribute('id', 'mask')
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
    this.ctx = this.canvas.getContext('2d')

    //this.ctx.fillStyle = "rgba(255, 255, 255, 1)";
    /*let gradient = this.ctx.createLinearGradient(0, 0, window.innerWidth, 0);
    gradient.addColorStop(0, `rgba(255,255,255,1)`);
    gradient.addColorStop(0.7, `rgba(0,0,0,1)`);
    this.ctx.fillStyle = gradient

    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)*/

    for (var i = 0; i < 60; i++) {
      let size = 200;
      let pos = {x: Math.random()*(window.innerWidth - size), y: Math.random()*(window.innerHeight - size)}
      let gradient = this.ctx.createRadialGradient(pos.x + size/2, pos.y + size/2, size/2, pos.x + size/2, pos.y + size/2, 0);
      gradient.addColorStop(0, `rgba(255,255,255,0)`);
      gradient.addColorStop(0.7, `rgba(0,0,0,1)`);
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(pos.x, pos.y,size,size);
    }



    this.canvas.setAttribute('id', 'mask')
    document.body.appendChild(this.canvas)
  }

  render() {

  }

}

module.exports = MaskCanvas;
