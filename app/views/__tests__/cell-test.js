/* global describe,it,expect,beforeEach */
const EventEmitter = require('events').EventEmitter;
const rewire = require('rewire');
const Immutable = require('immutable');

const GameConstants = require('../../constants/gameconstants');
const Cell = rewire('../cell');

describe('Cell view tests', () => {
  let mockDispatcher = new EventEmitter();
  mockDispatcher.setMaxListeners(100);
  Cell.__set__('GameDispatcher', mockDispatcher);

  let cellView;
  let inputField;

  beforeEach(() => {
    cellView = new Cell();

    const mockCellData = Immutable.fromJS({
      value: 5,
      rowID: 1,
      columnID: 1,
      gridID: 1,
      editable: true
    });

    cellView.render(mockCellData, 1);

    inputField = cellView.container.getElementsByTagName('input')[0];
  });

  it('should render with correct value in input field', () => {
    expect(inputField.value).toEqual('5');
  });

  it('mark input field as invalid on INVALIDATE_GRID event for correct gridID and value', () => {
    mockDispatcher.emit(GameConstants.INVALIDATE_GRID, 1, 5);

    expect(inputField.getAttribute('data-invalid')).toEqual('true');
  });

  it('mark input field as invalid on INVALIDATE_ROW event for correct gridID and value', () => {
    mockDispatcher.emit(GameConstants.INVALIDATE_ROW, 1, 5);

    expect(inputField.getAttribute('data-invalid')).toEqual('true');
  });

  it('mark input field as invalid on INVALIDATE_COLUMN event for correct gridID and value', () => {
    mockDispatcher.emit(GameConstants.INVALIDATE_COLUMN, 1, 5);

    expect(inputField.getAttribute('data-invalid')).toEqual('true');
  });

  it('mark input field as valid after dispatcher validates grid, row and column', () => {
    // First invalidate the cell
    mockDispatcher.emit(GameConstants.INVALIDATE_GRID, 1, 5);
    mockDispatcher.emit(GameConstants.INVALIDATE_COLUMN, 1, 5);
    mockDispatcher.emit(GameConstants.INVALIDATE_ROW, 1, 5);

    // Now revalidate the data
    mockDispatcher.emit(GameConstants.VALIDATE_GRID, 1, 5);
    mockDispatcher.emit(GameConstants.VALIDATE_COLUMN, 1, 5);
    mockDispatcher.emit(GameConstants.VALIDATE_ROW, 1, 5);

    expect(inputField.getAttribute('data-invalid')).toEqual('false');
  });



});
