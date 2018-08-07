const Events = {
  TAP: 'tap',
  LONGPRESS: 'longpress',
  TOUCHSTART: 'touchstart',
  TOUCHMOVE: 'touchmove',
  TOUCHEND: 'touchend',
};
export default class KooHandler {
  context = {}

  viewsPool = new Map()
  backgroundView = {}
  emiting = false

  constructor(context) {
    this.context = context;
    setStringPrototype();
    for (const i in Events) {
      this.viewsPool.set(Events[i], []);
    }
    this.dragableViewsPool = []
    this.dragging = false;
  }


  init(views, pen) {
    this._sortViewPools(views);
    this.pen = pen;
  }

  _sortViewPools(views) {
    const that = this;

    this.backgroundMethod = views.methods;

    views.views.forEach((v) => {
      if (!v.methods && !v.animation) {
        return;
      }
      if(v.methods){
        for (const i in Events) {
          //元素按照拥有方法分类
          if (v.methods[Events[i]]) {
            let temp = [];
            temp = that.viewsPool.get(Events[i]);
            temp.push(v);
            that.viewsPool.set(Events[i], temp);
          }
      }
    }
       //可拖动元素提取
      if (v.animation) {
        if (v.animation.drag) {
          this.dragableViewsPool.push(v)
        }
      }    
    });
  }


  emit(event, permeat) {
    if (this.emiting) {
      return;
    }
  
    if (event.type === Events.TOUCHMOVE) {

      if (!this.dragging) {
        for (let i = this.dragableViewsPool.length - 1; i >= 0; i--) {
          if (this._pointInView(event, this.dragableViewsPool[i])) {
            this.draggingView = this.dragableViewsPool[i]
          }
        }
      }

      if (this.draggingView) {
        this.dragging = true;
        this.dragView(event)
        return;
      }

    }

    this.emiting = true;

    if (event.type === Events.TOUCHEND && this.dragging) {
      this.draggingView = ''
      this.dragging = false
      this.stouch = {}
    }

    const viewsPool = this.viewsPool.get(event.type);

    if (permeat) {
      this.backgroundMethod[event.type] ? this.backgroundMethod[event.type](event) : ''
      for (let i = viewsPool.length - 1; i >= 0; i--) {
        if (this.handleView(event, viewsPool[i])) {
          break;
        }
      }
    } else {
      for (const i in viewsPool) {
        if (this.handleView(event, viewsPool[i])) {
          break;
        }
      }
      this.backgroundMethod[event.type] ? this.backgroundMethod[event.type](event) : ''
    }

    // 暂时没有考虑异步
    this.emiting = false;
  }

  dragView(event) {
    if (this.dragView) {
      if(this.stouch){
        const deltaX = event.x - this.stouch.x;
        const deltaY = event.y - this.stouch.y;
        const position = this._getViewPosition(this.draggingView,true);
        this.pen.moveViewTo(this.draggingView, position.l+deltaX, position.t+deltaY);
      }
      this.stouch = {
        x: event.x,
        y: event.y   
      }
    }
  }


  handleView(event, view) {
    if (this._pointInView(event, view)) {
      let needBreak = false;
      if (view.methods && view.methods[event.type]) {
        needBreak = view.methods[event.type](event);
      }
      if (event.mode === 'catch' || needBreak) {
        return true;
      }
    }
  }

  _pointInView(event, view) {
    const xe = Number(event.x);
    const ye = Number(event.y);
    const position = this._getViewPosition(view)
    const res = (xe > position.l && xe < position.r && ye > position.t && ye < position.b);
    return res;
  }

  _getViewPosition(view, original){
    let l,r,t,b = 0;
    let width = 0;
    let height = 0;

    if (view.type === 'text') {
      const fontWeight = view.css.fontWeight === 'bold' ? 'bold' : 'normal';
      const fontSize = view.css.fontSize ? view.css.fontSize.toPx() : 10;
      const ctx = wx.createCanvasContext();
      ctx.font = `normal ${fontWeight} ${fontSize}px sans-serif`;
      const textLength = ctx.measureText(view.text).width;
      // 宽度
      width = view.css.width ? view.css.width.toPx() : textLength;
      // 计算行数
      const calLines = Math.ceil(textLength / width);
      const lines = view.css.maxLines < calLines ? view.css.maxLines : calLines;
      const lineHeight = view.css.lineHeight ? view.css.lineHeight.toPx() : view.css.fontSize.toPx();
      height = lineHeight * lines;
    } else {
      width = view.css.width.toPx();
      height = view.css.height.toPx();
    }

    if (view.css.left || view.css.left === 0) {
      l = view.css.left === 0 ? 0 : view.css.left.toPx();
      r = l + width;
    } else if (view.css.right || view.css.right === 0) {
      r = this.canvasWidth - (view.css.right === 0 ? 0 : view.css.right.toPx());
      l = r - width;
    }
  
    if (view.css.top || view.css.top === 0) {
      t = view.css.top === 0 ? 0 : view.css.top.toPx();
      b = t + height;
    } else if (view.css.bottom || view.css.bottom === 0) {
      b = this.canvasHeight - (view.css.bottom === 0 ? 0 : view.css.bottom.toPx());
      t = b - height;
    }
  
    if(original){
      return {l,r,t,b}
    }

    if (view.css.align) {
      switch (view.css.align) {
        case 'left':
          l += (view.css.left || view.css.left === 0) ? 0 : width;
          r += (view.css.left || view.css.left === 0) ? 0 : width;
          break;
        case 'center':
          l += (view.css.left || view.css.left === 0) ? (-width / 2) : (width / 2);
          r += (view.css.left || view.css.left === 0) ? (-width / 2) : (width / 2);
          break;
        case 'right':
          l -= width;
          l -= width;
          break;
        default:
          break;
      }
    }
    return {l,r,t,b}
  }

}





const screenK = 0.5;

function setStringPrototype() {
  /* eslint-disable no-extend-native */
  /**
   * 是否支持负数
   * @param {Boolean} minus 是否支持负数
   */
  String.prototype.toPx = function toPx(minus) {
    let reg;
    if (minus) {
      reg = /^-?[0-9]+([.]{1}[0-9]+){0,1}(rpx|px)$/g;
    } else {
      reg = /^[0-9]+([.]{1}[0-9]+){0,1}(rpx|px)$/g;
    }
    const results = reg.exec(this);
    if (!this || !results) {
      console.error(`The size: ${this} is illegal`);
      return 0;
    }
    const unit = results[2];
    const value = parseFloat(this);

    let res = 0;
    if (unit === 'rpx') {
      res = Math.round(value * screenK);
    } else if (unit === 'px') {
      res = value;
    }
    return res;
  };
}
