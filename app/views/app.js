const html = require('../utils/template').html;

const Game = require('../services/game');
const BaseView = require('./baseview');

const Grid = require('./grid');

class App extends BaseView {
  constructor() {
    super();

    this.container = document.createElement('main');
    this.container.className = 'app';

    this.game = new Game();
  }

  render() {
    this.container.innerHTML = html`
        <section class="app-grids">
        </section>
    `;

    const grids = this.container.getElementsByClassName('app-grids')[0];

    this.game.getGrids().forEach((grid) => {
      const gridContainer = document.createElement('div');
      gridContainer.className = 'app-grids-container';
      gridContainer.appendChild(new Grid(grid).render().container);

      grids.appendChild(gridContainer);
    });

    return this;
  }
}

module.exports = App;