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
  }


  init(views) {
    this._sortViewPools(views);
  }

  _sortViewPools(views) {
    const that = this;

    const bgv = {
      type: 'background',
      css: {
        width: views.width,
        height: views.height,
        left: 0,
        top: 0,
      },
      methods: views.methods,
    };

    views.views.push(bgv);

    views.views.forEach((v) => {
      if (!v.methods) {
        return;
      }
      for (const i in Events) {
        if (v.methods[Events[i]]) {
          let temp = [];
          temp = that.viewsPool.get(Events[i]);
          temp.push(v);
          that.viewsPool.set(Events[i], temp);
        }
      }
    });
  }


  emit(event, permeat) {
    if (this.emiting) {
      return;
    }
    this.emiting = true;

    const viewsPool = this.viewsPool.get(event.type);

    if (permeat) {
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
    }

    // 暂时没有考虑异步
    this.emiting = false;
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
    this.viewsPool.push(...viewsPool.views);
    this.viewsPool.push(bgv);
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

    const res = (xe > l && xe < r && ye > t && ye < b);
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
