const GameDispatcher = require('../dispatchers/gamedispatcher');
const GameConstants = require('../constants/gameconstants');
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
        <h1 data-type="herolarge">Sudoku</h1>

        <section class="app-grids">
        </section>

        <p class="app-wonMsg"><em>You won! Let's play again?</em></p>

        <button class="app-reset">
          Reset Game
        </button>
    `;

    // Create grid views for each grid.
    this.gridViews = this.game.getGrids().map(() => new Grid());

    this.renderGrids();

    const resetButton = this.container.getElementsByClassName('app-reset')[0];
    resetButton.addEventListener('click', (evt) => this.reset(evt));

    this.wonMessage = this.container.getElementsByClassName('app-wonMsg')[0];
    GameDispatcher.on(GameConstants.WON, () => {
      this.wonMessage.setAttribute('data-show', 'true');
    });

    return this;
  }

  renderGrids() {
    const gridsContainer = this.container.getElementsByClassName('app-grids')[0];
    gridsContainer.innerHTML = '';

    this.game.getGrids().forEach(((grid, i) => {
      const gridContainer = document.createElement('div');
      gridContainer.className = 'app-grids-container';
      gridContainer.appendChild(this.gridViews.get(i).render(grid).container);

      gridsContainer.appendChild(gridContainer);
    }).bind(this));
  }

  reset() {
    GameDispatcher.removeAllListeners();
    this.wonMessage.setAttribute('data-show', 'false');

    this.game = new Game();
    this.renderGrids();
  }
}

module.exports = App;