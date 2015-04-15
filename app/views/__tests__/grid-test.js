/* global describe,it,expect,beforeEach */
const rewire = require('rewire');
const Immutable = require('immutable');

const BaseView = require('../baseview');
const Grid = rewire('../grid');


/**
 * Mock a cell class while testing the grid view. The cell class is tested separately
 */
class MockCell extends BaseView {
  render() {
    return this;
  }
}

// Inject mock cell into the Cell dependency of Grid.
Grid.__set__('Cell', MockCell);

describe('Grid view tests', () => {
  let gridView;

  let mockGrid = Immutable.fromJS({
    isValid: true,
    isComplete: false,

    // Array of 9 null value cells. jshint does not like the syntax though it's valid!
    cells: Array.from({length: 9}, () => {value: null})   // jshint ignore:line
  });

  beforeEach(() => {
    gridView = new Grid();
  });

  it('should render with 9 cells', () => {
    gridView.render(mockGrid);

    const gridContainers = gridView.container.querySelectorAll('.grid-cell-container');
    expect(gridContainers.length).toEqual(9);
  });
});
