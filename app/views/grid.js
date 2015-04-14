const Cell = require('./cell');
const BaseView = require('./baseview');

class Grid extends BaseView {
  constructor(grid) {
    super();
    this.grid = grid;
  }

  render() {
    this.container.className = 'grid';

    this.grid.get('cells').forEach((cell, id) => {
      const gridCellContainer = document.createElement('div');
      gridCellContainer.className = 'grid-cell-container';
      gridCellContainer.appendChild(new Cell(cell, id).render().container);

      this.container.appendChild(gridCellContainer);

    });

    return this;
  }
}

module.exports = Grid;