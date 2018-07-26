import React, { Component } from 'react';
import axios from 'axios';
import queryString from 'query-string';

export class CropPage extends Component {
  constructor(props) {
    super(props)

    this.mouseDown = this.mouseDown.bind(this);
    this.mouseUp = this.mouseUp.bind(this);
    this.mouseMove = this.mouseMove.bind(this);
    this.draw = this.draw.bind(this);
  }

  componentWillMount() {
    let params = queryString.parse(location.search);

    this.setState({
      params,
      ctx: {},
      rects: [],
      selectRect: {},
      drag: false,
      imageUrl: `http://localhost:3000/${params.image}`
    });
  }

  componentDidMount() {
    const canvas = document.getElementById('canvas'),
      ctx = canvas.getContext('2d');

    canvas.addEventListener('mousedown', this.mouseDown, false);
    canvas.addEventListener('mouseup', this.mouseUp, false);
    canvas.addEventListener('mousemove', this.mouseMove, false);

    this.setState({
      canvas,
      ctx
    });

    this.draw(ctx);
  }

  Rectangle(ctx) {
      var me = this;
      this.x1 = 0;
      this.x2 = 0;
      this.y1 = 0;
      this.y2 = 0;
      this.draw = function() {
          ctx.beginPath();
          ctx.moveTo(me.x1, me.y1);
          ctx.lineTo(me.x2, me.y2);
          ctx.stroke();
      }
  }

  mouseDown(e) {
    const {
      ctx
    } = this.state;

    const canvas = document.getElementById('canvas');

    let currentRect = this.state.selectRect;
    currentRect.startX = e.pageX - canvas.offsetLeft;
    currentRect.startY = e.pageY - canvas.offsetTop;
    this.setState({
      selectRect: currentRect,
      drag: true
    });

    this.draw(ctx);
  }

  mouseUp() {
    const {
      rects,
      selectRect,
      ctx
    } = this.state;

    let newRect = Object.assign({}, selectRect);
    let newRects = rects.concat(newRect);

    this.setState({
      drag: false,
      rects: newRects
    });

    this.draw(ctx);
  }

  mouseMove(e) {
    const {
      drag,
      selectRect,
      ctx
    } = this.state;

    if (drag) {
      const canvas = document.getElementById('canvas');
      
      let currentRect = selectRect;
      currentRect.w = (e.pageX - canvas.offsetLeft) - selectRect.startX;
      currentRect.h = (e.pageY - canvas.offsetTop) - selectRect.startY ;
      
      this.setState({
        selectRect: currentRect
      });

      this.draw(ctx);
    }
  }

  draw(ctx) {
    const {
      rects,
      selectRect,
      imageUrl
    } = this.state

    // Draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let img = new Image;
    img.onload = function(){
      ctx.drawImage(img, 0, 0);
    };
    img.src = imageUrl;

    // Draw all selections
    for (let i = 0; i < rects.length; i++) {
      let r = rects[i];
      ctx.fillRect(r.startX, r.startY, r.w, r.h);
    }
    
    // Draw current selection
    if(Object.keys(selectRect).length > 0) {
      ctx.fillRect(selectRect.startX, selectRect.startY, selectRect.w, selectRect.h);
    }
  }
  
  cropImage(image) {
    axios.get(`http://localhost:3000/crop?image=${image}`)
      .then(function (response) {
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  render() {
    let page = "";
    if(Object.keys(this.state.params).length === 0) {
      page = (
        <div>
          <h1>Hi folks!</h1>
          <p>Welcome to imgcropr.</p>
          <p>Upload an image to begin.</p>
    
          <form
            id='uploadForm'
            action='http://localhost:3000/upload' 
            method='post'
            encType="multipart/form-data">
              <input type="file" name="imageFile" />
              <input type='submit' value='Upload!' />
          </form>
        </div>
      );
    } else {
      page = (
        <div>
          <p>Click the hamburger to perform to modify this image.</p>
          <canvas ref='imageCanvas' id="canvas" width="500" height="500"></canvas>
          <input type='button' value='Crop' onClick={() => { this.cropImage(params.image); }} />
        </div>
      );
    }
    
    return page;
  };
}

export default CropPage
