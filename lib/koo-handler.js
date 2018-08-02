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
    for (const i in this.viewsPool) {
      const view = this.viewsPool[i];
      if (this._pointInView(event, view)) {
        console.log(view);
        let needBreak = false;
        if (view.methods[event.type]) {
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
    this.viewsPool.push(bgv);
    this.viewsPool.push(...viewsPool.views);
  }

  _pointInView(event, view) {
    return true;
  }
}
