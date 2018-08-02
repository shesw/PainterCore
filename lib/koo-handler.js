export default class KooHandler {
  context = {}

  viewsPool = []

  emiting = false

  constructor(context) {
    this.context = context;
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
          needBreak = view.methods[event.type]();
          // console.log(needBreak);
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

    if (view.type === 'text') {
      return false;
    } else {
      width = view.css.width.toPx();
      height = view.css.height.toPx();

      if (view.css.left && (xe < view.css.left.toPx() || xe > view.css.left.toPx() + width)) {
        return false;
      }
      if (view.css.right && (xe < this.canvasWidth - view.css.right.toPx() - width || xe > this.canvasWidth - view.css.right.toPx())) {
        return false;
      }
      if (view.css.top && (ye < view.css.top.toPx() || ye > view.css.top.toPx() + height)) {
        return false;
      }
      if (view.css.bottom && (ye < this.canvasHeight - view.css.bottom.toPx() - height || ye > this.canvasHeight - view.css.bottom.toPx())) {
        return false;
      }
    }
    return true;
  }
}
