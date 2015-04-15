const Cell = require('./cell');
const BaseView = require('./baseview');

/**
 * This class renders a grid holding 9 Cell views.
 */
class Grid extends BaseView {
  constructor() {
    super();

    this.container.className = 'grid';
    this.cellViews = Array.from({length: 9}, () => new Cell());
  }

  render(grid) {
    super.render();

    // Render cell views
    grid.get('cells').forEach((cell, id) => {
      const gridCellContainer = document.createElement('div');
      gridCellContainer.className = 'grid-cell-container';
      gridCellContainer.appendChild(this.cellViews[id].render(cell, id).container);

      this.container.appendChild(gridCellContainer);

    });

    return this;
  }
}

module.exports = Grid;