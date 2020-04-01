/* init.js
This file contains initilizations for the app object

The app object contains nearly all code important to the UI experience
This is done for namespace reasons, and methods are seperated into other files

This file also includes member initilizations for various app properties
*/

/**
 * app
 *
 * Namespace object for holding most everything
 *
 * @namespace
 * @constant
 */
let app = {};

/**
 * app.course
 * 
 * pending course to be added - renders as blue
 * Stored as integer so it can be placed in an option
 * see UIright.js for setting
 * 
 * @type {?number}
 * @memberOf app
 */
app.course = null;

/**
 * app.courses
 *
 * currently loaded courses for the term selected
 * see librequests.js
 * 
 * @type {!Array<?Course>}
 * @memberOf app
 */
app.courses = [];

/**
 * app.selected
 * 
 * all courses added to schedule - rendered green
 * see selectionLogic.js for generation and UIschedule.js for rendering
 * 
 * @type {!Array<?Course>}
 * @memberOf app
 */
app.selected = [];

/**
 * app.mode
 * 
 * generator mode - Manual or Automatic - used all over the place for rendering
 * see UIright.js for setting
 * 
 * @type {string}
 * @memberOf app
 */
app.mode = "Manual";

/**
 * app.courses_generator
 *
 * generator object used in autoConstruct (getting selected list)
 * see selectionLogic.js
 *
 * @type {?Lazy}
 * @memberOf app
 */
app.courses_generator = null;

/**
 * app.savedCourseGenerator
 * 
 * a cacheKey for courses_generator - if similar to app.selected, return courses_generator. If not, regenerate courses_generator
 * see selectionLogic.js
 *
 * @type {string}
 * @memberOf app
 */
app.savedCourseGenerator = "0";

/**
 * app.course_list_selection
 *
 * the current selection in courses_generator's dynamically generated data array
 * see selectionLogic.js
 *
 * @type {number}
 * @memberOf app
 */
app.course_list_selection = 0;

/**
 * app.hovering
 *
 * used for stylizing courses on weekTable - all divs that are in the same course as the one user is hovering over go here and are stylized so
 * see UIschedule.js
 * 
 * @type {!Array<!Course>}
 * @memberOf app
 */
app.hovering = [];

/**
 * app.currentstorage
 *
 * the selected save on savebar
 * see UIsavebar.js
 *
 * @type {?string}
 * @memberOf app
 */
app.currentstorage = null;

/**
 * app.terms
 *
 * object values for all terms available to load
 * see UIright.js
 *
 * @type {!Array<!Term>}
 * @memberOf app
 */
app.terms = [];

/**
 * app.term
 *
 * string key value for the currently selected term
 * see UIright.js for setting and librequests.js for usage
 *
 * @type {string}
 * @memberOf app
 */
app.term = "";

/**
 * app.courses_auto 
 *
 * list of course divs that are up for selection in automatic mode
 * stored as a string to save computation time
 * see librequests.js for generation and UIright.js for usage
 *
 * @type {string}
 * @memberOf app
 */
app.courses_auto = "";

/**
 * app.courses_manual
 * 
 * list of course divs that are up for selection in manual mode
 * stored as a string to save computation time
 * see librequests.js for generation and UIright.js for usage
 *
 * @type {string}
 * @memberOf app
 */
app.courses_manual = "";

/**
 * app.closed
 * 
 * whether or not we're showing courses that are closed (all seats are filled) or not, used many places
 * see UIright.js for setting
 *
 * @type {boolean}
 * @memberOf app
 */
app.closed = false;

/**
 * app.percent
 *
 * progress message displayed while loading
 * see librequests.js
 * 
 * @type {string}
 * @memberOf app
 */
app.percent = "";

/**
 * app.termCacher
 *
 * the caching object used to store and retrieve loaded terms
 * see librequests.js
 * 
 * @type {!TermCacher}
 * @memberOf app
 * @constant
 */
app.termCacher = new TermCacher();
