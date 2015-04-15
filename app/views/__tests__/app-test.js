/* global describe,it,expect,beforeEach */

const App = require('../app');

describe('App view tests', () => {
  let appView;

  beforeEach(() => {
      appView = new App();
  });

  it('should render with 9 grids', () => {
    appView.render();

    const gridContainers = appView.container.querySelectorAll('.app-grids-container');

    expect(gridContainers.length).toEqual(9);
  });

  it('should render with a reset button', () => {
    appView.render();

    const resetButton = appView.container.querySelectorAll('.app-reset');

    expect(resetButton.length).toEqual(1);
  });
});
