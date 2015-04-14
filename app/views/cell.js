const html = require('../utils/template').html;
const GameDispatcher = require('../dispatchers/gamedispatcher');
const GameConstants = require('../constants/gameconstants');

const BaseView = require('./baseview');

class Cell extends BaseView {
  constructor(cell, id) {
    super();

    this.cell = cell;
    this.id = id;
    this.value = cell.get('value');

    this.container.className = 'cell';

    this.onChangeSubscribe();
    this.onInvalidateSubscribe();
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
    const cell = this.cell;

    GameDispatcher.on(GameConstants.INVALIDATE_CELLS, (gridIDs, cellIDs, value) => {

      if (gridIDs.contains(cell.get('gridID')) &&
          cellIDs.contains(this.id) &&
          this.value === value) {

        this.markAsInvalidated();
      }

    });
  }

  markAsInvalidated() {
    const inputTag = this.container.getElementsByTagName('input')[0];
    inputTag.setAttribute('data-invalidate', true);
  }

  render() {
    const value = this.value || '';

    this.container.innerHTML =  html `
        <input type="text" ${!this.cell.get('editable') ? 'disabled' : ''} value=${value}>
    `;

    return this;

  }
}

module.exports = Cell;