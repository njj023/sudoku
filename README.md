# Online Sudoku Game
 
This code builds an interactive Sudoku game! It works in real-time and provides feedback as you play the game.

### Getting started

Assuming a UNIX or Linux based OS, clone the repo and navigate to the root of the
directory. Before running the steps below, please ensure that the machine has `node` and `npm` installed.

The code has been tested on `node v0.10.35` and `npm 1.4.28` so I would highly recommend a tool such as [nodeenv](https://github.com/ekalinin/nodeenv) for creating a virtual node environment with those exact versions.

```bash
# Install gulp and sass
npm install gulp -g
gem install sass

# Install all node dependencies
npm install

# Run tests
gulp test

# Start server
gulp

```

After running all of the above steps, navigate to `localhost:8080` to start playing!

### Architecture overview
The app is composed of two distinct layers:
1. A view layer containing views for the game, grids and the cells. `app/app.js` is the root view of the system.
2. A service layer containing a Game service. 

All communication between the views and the service is done through an EventEmitter called `GameDispatcher`. This approach keeps the entire system highly decoupled.

`app/main.js`, `app/main.scss` and `app/main-test.js` are the entry points for all the respective code.

All views and services have their corresponding unit tests. These tests can be found in the `__tests__` directories.

As for representing the structure of the puzzle itself, a Sudoku board is logically stored as a one-dimensional array of 9 grids, with each grid storing a one-dimensional array of 9 cells.
This setup allows us to perform computations within a grid easily. Performing computations across visual rows and columns that span multiple grids require some additional logic though.

Lastly, the site is fully responsive across all viewport sizes. Responsiveness is accomplished using media-queries.

### Technologies used
1. Gulp is used for the build system. Its fast in-memory builds allow for quick compile cycles and watches.

2. Webpack is used as a module bundler. All modules are written in ES6 and transformed using the Babel loader. The configuration
  code can be found in `webpack.config.js` and `webpack-test.config.js`.
  
3. SASS is used as a CSS pre-processor. The code is split into base styles and mixins stored in `styles/` and view specific styles stored in `views/`. 

4. Tests use Karma as a test runner and Jasmine as the unit testing library. All tests are run on Firefox and Chrome. 
Running `gulp test-watch` allows us to run tests on each file save.

5. HTML templating is done using ES6 template strings. This solution allows us to use all the powerful and familiar constructs available in JS. It also allows us to use keep markup and UI interactions contained in one view file. 

### TODOS
1. Currently the puzzle starts off with just one [preset board](http://en.wikipedia.org/wiki/Sudoku#/media/File:Sudoku-by-L2G-20050714.svg). I would love to add a random board generator and a board solver based on difficulty levels.

2. Add better keyboard based interactions for navigating across cells and grids.
 