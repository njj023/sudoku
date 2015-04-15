class BaseView {
  constructor() {
    this.container = document.createElement('div');
  }

  /**
   * Base render method that clears out any existing contents.
   */
  render() {
    this.container.innerHTML = '';
  }
}

module.exports = BaseView;