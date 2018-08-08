const Events = {
  TAP: 'tap',
  LONGPRESS: 'longpress',
  TOUCHSTART: 'touchstart',
  TOUCHMOVE: 'touchmove',
  TOUCHEND: 'touchend',
};
export default class KooHandler {
  context = {}
  // 用于区分点击事件的池子
  viewsPool = new Map()
  // 是否正在处理事件
  emiting = false

  // 可拖动事件池
  dragableViewsPool = [];
  dvIndex = 0;
  dragging = false;

  constructor(context) {
    this.context = context;
    setStringPrototype();
    for (const i in Events) {
      this.viewsPool.set(Events[i], []);
    }
  }


  init(pen) {
    this.pen = pen;
    this._sortViewPools(pen.data);
  }

  _sortViewPools(views) {
    const that = this;

    this.backgroundMethod = views.methods ? views.methods : '';

    views.views.forEach((v) => {
      if (!v.methods && !v.animation) {
        return;
      }
      if (v.methods) {
        for (const i in Events) {
          // 元素按照拥有方法分类
          if (v.methods[Events[i]]) {
            let temp = [];
            temp = that.viewsPool.get(Events[i]);
            temp.push(v);
            that.viewsPool.set(Events[i], temp);
          }
        }
      }
      // 可拖动元素提取
      if (v.animation) {
        if (v.animation.drag) {
          this.dragableViewsPool.push(v);
        }
      }
    });
  }


  emit(event, permeat) {
    if (this.emiting) {
      return;
    }

    if (event.type === Events.TOUCHSTART) {
      this.stouch = {
        x: event.x,
        y: event.y,
      };
      if (!this.dragging) {
        for (let i = this.dragableViewsPool.length - 1; i >= 0; i--) {
          if (this._pointInView(event, this.dragableViewsPool[i])) {
            this.draggingView = this.dragableViewsPool[i];
            this.dvIndex = i;
            break;
          }
        }
      }
    }

    if (event.type === Events.TOUCHMOVE) {
      if (this.draggingView) {
        this.dragging = true;
        this.dragView(event);
        return;
      }
    }

    this.emiting = true;

    if (event.type === Events.TOUCHEND) {
      // dragableViewPool重新排序
      if (this.dvIndex && this.draggingView) {
        this.dragableViewsPool.splice(this.dvIndex, 1);
        this.dragableViewsPool.push(this.draggingView);
        this.pen.callback();
      }

      // 参数清零
      this.draggingView = '';
      this.dragging = false;
      this.stouch = {};
      this.dvIndex = 0;
    }

    const viewsPool = this.viewsPool.get(event.type);
    if (viewsPool.length === 0) {
      this.emiting = false;
      return;
    }
    if (permeat) {
      this.backgroundMethod[event.type] ? this.backgroundMethod[event.type](event) : '';
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
      this.backgroundMethod[event.type] ? this.backgroundMethod[event.type](event) : '';
    }

    // 暂时没有考虑异步
    this.emiting = false;
  }

  dragView(event) {
    if (this.draggingView) {
      if (!this.stouch) {
        return;
      }

      const deltaX = event.x - this.stouch.x;
      const deltaY = event.y - this.stouch.y;
      const position = this._getViewPosition(this.draggingView, true);

      this.draggingView.css.left = `${position.l + deltaX}px`;
      this.draggingView.css.right = undefined;
      this.draggingView.css.top = `${position.t + deltaY}px`;
      this.draggingView.css.bottom = undefined;

      this.pen.moveView(this.draggingView);

      this.stouch = {
        x: event.x,
        y: event.y,
      };
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
    const position = this._getViewPosition(view);
    const res = (xe > position.l && xe < position.r && ye > position.t && ye < position.b);
    return res;
  }

  /**
   * @param {*} view
   * @param {*} origin true代表取为经过align处理的原始位置，即直接从left等属性拿出来的位置,false代表在canvas上的真实的位置
   */
  _getViewPosition(view, origin) {
    const position = {
      l: origin ? view.position.origin.x : view.position.actual.x,
      t: origin ? view.position.origin.y : view.position.actual.y,
    };

    position.r = position.l + view.position.width;
    position.b = position.t + view.position.height;
    return position;
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
