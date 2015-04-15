const html = require('../utils/template').html;
const GameDispatcher = require('../dispatchers/gamedispatcher');
const GameConstants = require('../constants/gameconstants');

const BaseView = require('./baseview');

/**
 * Validates that the given string is a digit from 0-9
 * @param str Input to validate.
 */
function validate(str) {
  return str.length === 1 && new RegExp('[1-9]').test(str);
}

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

    this.inputTag = this.container.getElementsByTagName('input')[0];
    this.bindKeyEvents();

    return this;

  }

  /**
   * TODO: Add left and right navigation events
   */
  bindKeyEvents() {
    this.inputTag.addEventListener('keydown', (evt) => {
      if (evt.keyCode === 13) {   // Enter key
        this.inputTag.blur();
      }
    });
  }

  subscribeToGameEvents() {
    this.onChangeTrigger();

    this.onInvalidateGridSubscribe();
    this.onInvalidateRowSubscribe();
    this.onInvalidateColumnSubscribe();

    this.onValidateGridSubscribe();
    this.onValidateRowSubscribe();
    this.onValidateColumnSubscribe();

    this.onWonSubscribe();
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

      if (!validate(value)) {
        this.value = null;
        this.markAsInvalid();
      } else {
        this.value = parseInt(value);
        this.markAsValid();
      }

      GameDispatcher.emit(GameConstants.CELL_UPDATE,
        this.cell.get('gridID'), this.id, this.value);
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

  onWonSubscribe() {
    GameDispatcher.on(GameConstants.WON, () => {
      this.markAsWon();
    });
  }

  markAsInvalid() {
    this.inputTag.setAttribute('data-invalid', true);
  }

  markAsValid() {
    this.inputTag.setAttribute('data-invalid', false);
  }

  markAsWon() {
    this.inputTag.removeAttribute('data-invalid');
    this.inputTag.setAttribute('data-won', true);
    this.inputTag.setAttribute('disabled', true);
  }
}

module.exports = Cell;