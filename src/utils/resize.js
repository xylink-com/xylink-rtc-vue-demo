export default class Resize {
  constructor() {
    this.eleId = '';
    this.element = null;
    this.resizeObserver = null;
    this.onResize = () => {};
  }

  init(eleId, onResize) {
    this.eleId = eleId;
    this.onResize = onResize;

    this.resizeObserver = new ResizeObserver(() => {
      const isHorizontal = window.innerWidth > window.innerHeight;

      this.onResize({ isHorizontal });
    });

    this.element = document.getElementById(this.eleId);
    
    if (this.element) {
      this.resizeObserver.observe(this.element);
    }
  }

  /**
   * 监听事件销毁事件
   */
  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.eleId = '';
    this.element = null;
  }
}

const WindowResize = new Resize();

export { WindowResize };
