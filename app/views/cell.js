const html = require('../utils/template').html;
const GameDispatcher = require('../dispatchers/gamedispatcher');
const GameConstants = require('../constants/gameconstants');

const BaseView = require('./baseview');

class Cell extends BaseView {
  constructor() {
    super();

    this.container.className = 'cell';
  }

  render(cell, id) {
    super.render();

    this.onChangeSubscribe();
    this.onInvalidateSubscribe();
    this.onWonSubscribe();

    this.cell = cell;
    this.id = id;
    this.value = cell.get('value');

    const value = this.value || '';

    this.container.innerHTML =  html `
        <input type="text" ${!cell.get('editable') ? 'disabled' : ''} value=${value}>
    `;

    return this;

  }

  onChangeSubscribe() {
    this.container.addEventListener('change', (evt) => {
      let value = evt.target.value;

      if (Number.isNaN(value)) {
        // TODO: Handle validation
        evt.target.value = '';
      } else {
        value = parseInt(value);
        this.value = value;

        GameDispatcher.emit(GameConstants.CELL_UPDATE,
          this.cell.get('gridID'), this.id, value);
      }
    });
  }

  onInvalidateSubscribe() {
    GameDispatcher.on(GameConstants.INVALIDATE_CELLS, (gridIDs, cellIDs, value) => {

      if (gridIDs.contains(this.cell.get('gridID')) &&
          cellIDs.contains(this.id) &&
          this.value === value) {

        this.markAsInvalid();
      }
    });
  }

  onWonSubscribe() {
    GameDispatcher.on(GameConstants.WON, () => {
      console.log('You won!!!');
    });
  }

  markAsInvalid() {
    const inputTag = this.container.getElementsByTagName('input')[0];
    inputTag.setAttribute('data-invalid', true);
  }

  markAsValid() {
    const inputTag = this.container.getElementsByTagName('input')[0];
    inputTag.setAttribute('data-invalid', false);
  }
}

module.exports = Cell;