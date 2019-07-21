/* init.js
This file contains initilizations for the app object

The app object contains nearly all code important to the UI experience
This is done for namespace reasons, and methods are seperated into other files

This file also includes member initilizations for various app properties
*/

// main object
let app = {};

// pending course to be added - renders as blue - stored as an integer
// see UIright.js for setting
app.course = null;
// currently loaded courses for the term selected
// see librequests.js
app.courses = [];
// all courses added to schedule - rendered green
// see selectionLogic.js for generation and UIschedule.js for rendering
app.selected = [];
// generator mode - Manual or Automatic - used all over the place for rendering
// see UIright.js for setting
app.mode = "Manual";
// generator object used in autoConstruct (getting selected list)
// see selectionLogic.js
app.courses_generator = null;
// a cacheKey for courses_generator - if similar to app.selected, return courses_generator. If not, regenerate courses_generator
// see selectionLogic.js
app.savedCourseGenerator = "0";
// the current selection in courses_generator, dynamically generated array
// see selectionLogic.js
app.course_list_selection = 0;
// used for stylizing courses on weekTable - all divs that are in the same course as the one user is hovering over go here and are stylized so
// see UIschedule.js
app.hovering = [];
// the selected save on savebar
// see UIsavebar.js
app.currentstorage = null;
// object values for all terms available to load
// see UIright.js
app.terms = [];
// string key value for the currently selected term
// see UIright.js for setting and librequests.js for usage
app.term = "";
// list of course divs that are up for selection in automatic mode
// see librequests.js for generation and UIright.js for usage
app.courses_auto = [];
// list of course divs that are up for selection in manual mode
// see librequests.js for generation and UIright.js for usage
app.courses_manual = [];
// whether or not we're showing courses that are closed (all seats are filled) or not, used many places
// see UIright.js for setting
app.closed = false;
// progress message displayed while loading
// see librequests.js
app.percent = "";
// the caching object used to store and retrieve loaded terms
// see librequests.js
app.termCacher = new TermCacher();
