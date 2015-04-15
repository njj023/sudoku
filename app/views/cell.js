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

    this.subscribeToGameEvents();
    this.initializeData(cell, id);

    const value = this.value || '';

    this.container.innerHTML =  html`
        <input type="text" ${!cell.get('editable') ? 'disabled' : ''} value=${value}>
    `;

    return this;

  }

  subscribeToGameEvents() {
    this.onChangeTrigger();

    this.onInvalidateGridSubscribe();
    this.onInvalidateRowSubscribe();
    this.onInvalidateColumnSubscribe();

    this.onValidateGridSubscribe();
    this.onValidateRowSubscribe();
    this.onValidateColumnSubscribe();
  }

  initializeData(cell, id) {
    this.cell = cell;
    this.id = id;
    this.value = cell.get('value');

    this.gridValid = true;
    this.rowValid = true;
    this.columnValid = true;
  }

  onChangeTrigger() {
    this.container.addEventListener('change', (evt) => {
      let value = evt.target.value;

      if (Number.isNaN(value)) {
        // TODO: Handle validation
        evt.target.value = '';
      } else {
        value = parseInt(value);
        this.value = value;

        this.markAsValid();

        GameDispatcher.emit(GameConstants.CELL_UPDATE,
          this.cell.get('gridID'), this.id, value);
      }
    });
  }

  onInvalidateGridSubscribe() {
    GameDispatcher.on(GameConstants.INVALIDATE_GRID, (gridID, value) => {

      if (this.cell.get('gridID') === gridID && this.value === value) {
        this.gridValid = false;
        this.markAsInvalid();
      }
    });
  }

  onInvalidateRowSubscribe() {
    GameDispatcher.on(GameConstants.INVALIDATE_ROW, (rowID, value) => {

      if (this.cell.get('rowID') === rowID && this.value === value) {
        this.rowValid = false;
        this.markAsInvalid();
      }
    });
  }

  onInvalidateColumnSubscribe() {
    GameDispatcher.on(GameConstants.INVALIDATE_COLUMN, (columnID, value) => {

      if (this.cell.get('columnID') === columnID && this.value === value) {
        this.columnValid = false;
        this.markAsInvalid();
      }
    });
  }

  onValidateGridSubscribe() {
    GameDispatcher.on(GameConstants.VALIDATE_GRID, (gridID, value) => {

      if (this.cell.get('gridID') === gridID && this.value === value) {
        this.gridValid = true;

        if (this.gridValid && this.rowValid && this.columnValid) {
          this.markAsValid();
        }
      }
    });
  }

  onValidateRowSubscribe() {
    GameDispatcher.on(GameConstants.VALIDATE_ROW, (rowID, value) => {

      if (this.cell.get('rowID') === rowID && this.value === value) {
        this.rowValid = true;

        if (this.gridValid && this.rowValid && this.columnValid) {
          this.markAsValid();
        }
      }
    });
  }

  onValidateColumnSubscribe() {
    GameDispatcher.on(GameConstants.VALIDATE_COLUMN, (columnID, value) => {

      if (this.cell.get('columnID') === columnID && this.value === value) {
        this.columnValid = true;

        if (this.gridValid && this.rowValid && this.columnValid) {
          this.markAsValid();
        }
      }
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