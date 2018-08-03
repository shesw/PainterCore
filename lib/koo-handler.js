export default class KooHandler {
  context = {}

  viewsPool = []

  emiting = false

  constructor(context) {
    this.context = context;
    setStringPrototype();
  }


  init(viewsPool) {
    this._getViewsPool(viewsPool);
  }

  emitEvent(e) {
    if (this.emiting) {
      return;
    }
    const event = e.detail;
    this.emiting = true;
    // for (const i in this.viewsPool) {
    for (let i = this.viewsPool.length - 1; i >= 0; i--) {
      const view = this.viewsPool[i];
      if (this._pointInView(event, view)) {
        let needBreak = false;
        if (view.methods && view.methods[event.type]) {
          needBreak = view.methods[event.type](event);
        }
        if (event.mode === 'catch' || needBreak) {
          break;
        }
      }
    }
    this.emiting = false;
  }


  _getViewsPool(viewsPool) {
    // 将background作为一个view入池
    const bgv = {
      type: 'background',
      css: {
        width: viewsPool.width,
        height: viewsPool.height,
        left: 0,
        top: 0,
      },
      methods: viewsPool.methods,
    };
    this.canvasWidth = viewsPool.width.toPx();
    this.canvasHeight = viewsPool.height.toPx();
    this.viewsPool.push(bgv);
    this.viewsPool.push(...viewsPool.views);
  }

  _pointInView(event, view) {
    const xe = Number(event.x);
    const ye = Number(event.y);

    let width = 0;
    let height = 0;
    let l = 0;
    let r = 0;
    let t = 0;
    let b = 0;

    if (view.type === 'text') {
      const fontWeight = view.css.fontWeight === 'bold' ? 'bold' : 'normal';
      const fontSize = view.css.fontSize ? view.css.fontSize.toPx() : 10;
      const ctx = wx.createCanvasContext();
      ctx.font = `normal ${fontWeight} ${fontSize}px sans-serif`;
      width = ctx.measureText(view.text).width;
      height = fontSize;
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

    const res = (xe > l && xe < r && ye > t && ye < b);
    // if (event.type === 'tap') {
    //   console.log('----------------');
    //   console.log(`${xe} ${ye}`);
    //   console.log(`${view.type} ${event.type}`);
    //   console.log(`${width} ${height}`);
    //   console.log(`${l} ${r} ${t} ${b}`);
    //   console.log(res);
    //   console.log('----------------');
    // }
    return res;
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
