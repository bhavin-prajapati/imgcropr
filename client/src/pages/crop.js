import React, { Component } from 'react';
import axios from 'axios';
import queryString from 'query-string';
import styled from 'react-emotion';


const OutsideWrapper = styled.div`
    display: block;
    position: inherit;
    height: 800px;
`;

const ImageCanvas = styled.canvas`
    position: absolute;
    border: 1px solid blue;
    z-index: -1;
`;

const CropCanvas = styled.canvas`
    position: absolute;
    border: 1px solid blue;
    z-index: 1;
`;

export class CropPage extends Component {
  constructor(props) {
    super(props)

    this.mouseDown = this.mouseDown.bind(this);
    this.mouseUp = this.mouseUp.bind(this);
    this.mouseMove = this.mouseMove.bind(this);
    this.draw = this.draw.bind(this);
    this.trackTransforms = this.trackTransforms.bind(this);
    this.clearSelections = this.clearSelections.bind(this);
  }

  componentWillMount() {
    let params = queryString.parse(location.search);

    let img = new Image;
    img.onload = function () {
      this.setState({
        imageHeight: img.height,
        imageWidth: img.width,
      });
    }.bind(this);
    img.src = `http://localhost:3000/${params.image}`;

    this.setState({
      params,
      ctx: {},
      rects: [],
      selectRect: {},
      drag: false,
      imageSource: `http://localhost:3000/${params.image}`,
      imageHeight: 0,
      imageWidth: 0,
    });
  }

  componentDidMount() {

    // Set up crop canvas
    const cropCanvas = document.getElementById('cropCanvas');
    const cropCtx = cropCanvas.getContext('2d');
    cropCanvas.width = 1280;
    cropCanvas.height = 800;
    cropCanvas.addEventListener('mousedown', this.mouseDown, false);
    cropCanvas.addEventListener('mouseup', this.mouseUp, false);
    cropCanvas.addEventListener('mousemove', this.mouseMove, false);

    // Load image and draw on image canvas
    const canvas = document.getElementById('imageCanvas');
    canvas.width = 1280;
    canvas.height = 800;
    let img = new Image;
    img.onload = function () {
      let ctx = canvas.getContext('2d');
      this.trackTransforms(ctx);

      function redraw() {
        // Clear the entire canvas
        let p1 = ctx.transformedPoint(0, 0);
        let p2 = ctx.transformedPoint(canvas.width, canvas.height);
        ctx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        ctx.drawImage(img, 0, 0);
      }
      redraw();

      let lastX = canvas.width / 2, lastY = canvas.height / 2;
      let dragStart, dragged;

      canvas.addEventListener('mousedown', function (evt) {
        document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
        lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
        lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
        dragStart = ctx.transformedPoint(lastX, lastY);
        dragged = false;
      }, false);

      canvas.addEventListener('mousemove', function (evt) {
        lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
        lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
        dragged = true;
        if (dragStart) {
          var pt = ctx.transformedPoint(lastX, lastY);
          ctx.translate(pt.x - dragStart.x, pt.y - dragStart.y);
          redraw();
        }
      }, false);

      canvas.addEventListener('mouseup', function (evt) {
        dragStart = null;
        if (!dragged) zoom(evt.shiftKey ? -1 : 1);
      }, false);

      let scaleFactor = 1.1;

      let zoom = function (clicks) {
        var pt = ctx.transformedPoint(lastX, lastY);
        ctx.translate(pt.x, pt.y);
        var factor = Math.pow(scaleFactor, clicks);
        ctx.scale(factor, factor);
        ctx.translate(-pt.x, -pt.y);
        redraw();
      }

      let handleScroll = function (evt) {
        var delta = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0;
        if (delta) zoom(delta);
        return evt.preventDefault() && false;
      };

      canvas.addEventListener('DOMMouseScroll', handleScroll, false);
      canvas.addEventListener('mousewheel', handleScroll, false);
    }.bind(this);
    img.src = this.state.imageSource;
  }

  trackTransforms(ctx) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
    var xform = svg.createSVGMatrix();
    ctx.getTransform = function () { return xform; };

    var savedTransforms = [];
    var save = ctx.save;
    ctx.save = function () {
      savedTransforms.push(xform.translate(0, 0));
      return save.call(ctx);
    };

    var restore = ctx.restore;
    ctx.restore = function () {
      xform = savedTransforms.pop();
      return restore.call(ctx);
    };

    var scale = ctx.scale;
    ctx.scale = function (sx, sy) {
      xform = xform.scaleNonUniform(sx, sy);
      return scale.call(ctx, sx, sy);
    };

    var rotate = ctx.rotate;
    ctx.rotate = function (radians) {
      xform = xform.rotate(radians * 180 / Math.PI);
      return rotate.call(ctx, radians);
    };

    var translate = ctx.translate;
    ctx.translate = function (dx, dy) {
      xform = xform.translate(dx, dy);
      return translate.call(ctx, dx, dy);
    };

    var transform = ctx.transform;
    ctx.transform = function (a, b, c, d, e, f) {
      var m2 = svg.createSVGMatrix();
      m2.a = a; m2.b = b; m2.c = c; m2.d = d; m2.e = e; m2.f = f;
      xform = xform.multiply(m2);
      return transform.call(ctx, a, b, c, d, e, f);
    };

    var setTransform = ctx.setTransform;
    ctx.setTransform = function (a, b, c, d, e, f) {
      xform.a = a;
      xform.b = b;
      xform.c = c;
      xform.d = d;
      xform.e = e;
      xform.f = f;
      return setTransform.call(ctx, a, b, c, d, e, f);
    };

    var pt = svg.createSVGPoint();
    ctx.transformedPoint = function (x, y) {
      pt.x = x; pt.y = y;
      return pt.matrixTransform(xform.inverse());
    }
  }

  mouseDown(e) {
    const cropCanvas = document.getElementById('cropCanvas');
    let currentRect = this.state.selectRect;

    currentRect.startX = e.pageX - cropCanvas.offsetLeft;
    currentRect.startY = e.pageY - cropCanvas.offsetTop;
    this.setState({
      selectRect: currentRect,
      drag: true
    });
  }

  mouseUp() {
    const {
      rects,
      selectRect,
    } = this.state;

    let newRect = Object.assign({}, selectRect);
    let newRects = rects.concat(newRect);

    this.setState({
      drag: false,
      rects: newRects
    });

    this.draw();
  }

  mouseMove(e) {
    const {
      drag,
      selectRect,
    } = this.state;

    const cropCanvas = document.getElementById('cropCanvas');
    const ctx = cropCanvas.getContext('2d');

    if (drag) {
      let currentRect = selectRect;
      currentRect.w = (e.pageX - cropCanvas.offsetLeft) - selectRect.startX;
      currentRect.h = (e.pageY - cropCanvas.offsetTop) - selectRect.startY;

      this.setState({
        selectRect: currentRect
      });

      this.draw();
    }
  }

  draw() {
    const {
      drag,
      rects,
      selectRect,
      imageUrl
    } = this.state

    const cropCanvas = document.getElementById('cropCanvas');
    const ctx = cropCanvas.getContext('2d');

    ctx.clearRect(0,0, cropCanvas.width, cropCanvas.height);

    // Draw all selections
    for (let i = 0; i < rects.length; i++) {
      let r = rects[i];

      ctx.setLineDash([5, 2]);
      ctx.fillStyle = 'rgba(225,225,225,0)';
      ctx.lineWidth = 1;
      ctx.fillRect(r.startX, r.startY, r.w, r.h);
      ctx.strokeRect(r.startX, r.startY, r.w, r.h)
    }

    // Draw current selection
    if (Object.keys(selectRect).length > 0) {
      ctx.setLineDash([5, 2]);
      if (drag) {
        ctx.fillStyle = 'rgba(225,225,225,0.25)';
        ctx.lineWidth = 0.25;
      } else {
        ctx.fillStyle = 'rgba(225,225,225,0)';
        ctx.lineWidth = 1;
      }
      
      ctx.fillRect(selectRect.startX, selectRect.startY, selectRect.w, selectRect.h);
      ctx.strokeRect(selectRect.startX, selectRect.startY, selectRect.w, selectRect.h)
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

  clearSelections() {
    this.setState({
      rects: [],
      selectRect: {}
    });
    
    const cropCanvas = document.getElementById('cropCanvas');
    const ctx = cropCanvas.getContext('2d');
    ctx.clearRect(0,0, cropCanvas.width, cropCanvas.height);
  }

  render() {
    let page = "";
    if (Object.keys(this.state.params).length === 0) {
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
          <OutsideWrapper>
            <ImageCanvas id="imageCanvas" />
            <CropCanvas id="cropCanvas" />
          </OutsideWrapper>
          <br />
          <div>
            <input type='button' value='Clear' onClick={() => { this.clearSelections(); }} />
            <input type='button' value='Crop' onClick={() => { document.getElementById('cropCanvas').style.zIndex = 1; document.getElementById('imageCanvas').style.zIndex = -1;}} />
            <input type='button' value='Move' onClick={() => { document.getElementById('cropCanvas').style.zIndex = -1; document.getElementById('imageCanvas').style.zIndex = 1; }} />
          </div>
        </div>
      );
    }

    return page;
  };
}

export default CropPage
