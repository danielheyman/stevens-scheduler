/* selectionLogic.js
This file contains the core logic behind finding and displaying valid schedules in automatic mode
This file also deals with manual mode schedules, but usually just optimizes them away

In this file:

Lazy class
>caches generated schedules

app.autoConstruct()
>creates a Lazy object which contains a generator for all valid courses of a given schedule

app.removeDuplicatesBy()
>util function which removes duplicates from an array based on an object value

app.cartesianProduct*()
>generator which returns a cartesian product from a given set of dimensions

app.schedCompat()
>checks if there are schedule conflicts in a given list of courses

app.courseCompat()
>checks if two courses have a schedule conflict

app.meetingCompat()
>checks if two meeting times conflict
*/

/**
 * Lazy
 * @class
 *
 * a semi-memoized simplified, and specialized version of the Lazy class you can find online
 * essentially, it creates an array from a generator function and populates on get requests
 * also supports filter functions
 * 
 * @example
 * NOTE: this example won't actually work. It only works with courses, but this is a good illustration
 * 
 * var generator = function*(){
 *   for(var i=0; i<10; ++i)
 *     yield i;
 * }
 * 
 * var divisible_by_2 = function(a){
 *   return !(a%2);
 * }
 * 
 * var lazy = new Lazy(generator);
 * lazy.filter(divisible_by_2);
 * 
 * console..log(lazy.get(0))
 * // returns 0
 * console..log(lazy.get(1))
 * // returns 2
 * console..log(lazy.get(2))
 * // returns 4
 * console..log(lazy.get(3))
 * // returns 6
 *
 * @constant
*/
class Lazy{
    /**
     * constructor(inputgen)
     *
     * param {!function*(!Array<?Course>):!Array<!Course>|!Array<!Courses>} inputgen  generator which gives data cached here
     * if input gen is an array, get will return that array
     *
     * @constant
     */
    constructor(inputgen){
        this.core = inputgen;
        this.data = [];
    	this.filters = [];
	this.done = false;
    }
    /**
     * get(i, set=false)
     *
     * grabbs a value from the generator
     *
     * @param   {number}                  i     desired index in generated array
     * @param   {boolean}                [set]  set app.selected to value grabbed?
     *
     * @returns {!Array<!Course>|boolean}       false if generator is done 
     *
     * @constant
     */
    get(i, set=false){
	if(Array.isArray(this.core))
	    return this.core;
        while(!this.done && (this.data.length <= i)){
	    var tmp = this.core.next();
	    if(tmp.done){
		this.done = true;
		break;
	    }
	    if(this.filters.reduce(function(acc, cur_filter){ // run all filters on value
		return acc && cur_filter(tmp.value);
	    }, true)){
		this.data.push({value: tmp.value, selected: tmp.value.filter(function(course){// cache selected for change -> take this.core.next() and remove app.course
		    return !course.home.alts.reduce(function(acc, cur){ // look through all of course offerings
			return acc.concat(cur); // where cur is a typePack
		    }, []).includes(app.course !== null ? app.courses[app.course] : null); // remove pending selection
		})}); // we need to do this here so it updates the url dynamically
            }
	}
	var data = this.data[i];
	if(!data)
	    return false; // no valid schedules
	if(set) // set selected on either a click, or on a autobar change
	    app.selected = data.selected; // update selected on click
	location.hash = app.generateHash(false); // update url
        return data.value;
    }
    /**
     * filter
     * 
     * add a filter to generated data
     *
     * @param {function(!Array<?Course>):boolean} filter_fun
     *
     * @returns {!Lazy}
     *
     * @constant
     */
    filter(filter_fun){
	this.filters.push(filter_fun);
	return this;
    }
}

/**
 * app.autoConstruct
 * 
 * return a Lazy object which spits out valid schedules, and cache it so we don't need to generate the lazy more than once
 * 
 * @param {!Array<?Course>} courses
 * @param {boolean}         [ignoreClosed]
 *
 * @returns {!Lazy}
 *
 * @memberof app
 * @constant
 */
app.autoConstruct = function(courses, ignoreClosed = false){
    if(courses[0] === undefined || courses[0] === null) return new Lazy([]); // no courses - go no further
    if(courses.slice(-1)[0] === undefined || courses.slice(-1)[0] === null) // remove empty at end when no class is selected
	courses.pop();
    if(app.mode == "Manual"){
	courses = (app.closed || ignoreClosed) ? courses : courses.filter(c => c.seatsAvailable > 0 || c.locked);
	if("M"+courses.map(course => course.URLcode).join() == app.savedCourseGenerator)
	    return app.courses_generator || new Lazy([]); // don't have to run the calculation for every hour in every day
	if(app.savedCourseGenerator[0] == "A" && app.course != null){ // switching from automatic to manual - update app.course
	    if(app.courses_generator){
		if(app.courses_generator.get(app.course_list_selection)){
		    var tmp = app.courses_generator.get(app.course_list_selection);
		    courses = Array.isArray(tmp) ? tmp : []; // slight optimization for caching
		}
	    }
	    app.course = courses.filter(function(course){
		return (app.course !== null ) && (course.home == app.courses[app.course].home);
	    })[0].index; // replace app.course with the proper one automatically assigned
	    document.getElementById("selectBox").value = app.course.toString();
	    //and fix a render bug
	}
	app.savedCourseGenerator = "M"+courses.map(el => el.URLcode).join();
	app.courses_generator = new Lazy(courses);
	return app.courses_generator;
    }
    //automatic generator
    if("A"+app.removeDuplicatesBy(course => course.home, courses).map(el => el.home.URLcode).filter(c => c).join() + (app.closed ? "C" : "") == app.savedCourseGenerator)
	return app.courses_generator || new Lazy([]); // don't have to run the calculation for every hour in every day
    if(app.savedCourseGenerator[0] == "M" && app.course){ // switching from manual to automatic - update app.course
	app.course = app.courses[app.course].home.index; // basically just a render bug
	document.getElementById("selectBox").value = app.course.toString();
    }
    app.course_list_selection = 0; // Reset on each new sched gen
    var range = document.getElementById('Range');
    range.max = 0;
    range.value = 0; // and reset render
    app.courses_generator = new Lazy(app.cartesianProduct(app.removeDuplicatesBy(course => course.home, courses).reduce(function(acc, course){ // expands courses into all alt lists
	course.home.alts.forEach(function(typePack){ // move in every typePack
	    // first, factor in any locked courses
	    let locked = typePack.filter(c => c.locked);
	    if(locked.length)
		typePack = locked; // force 0-length typePack
	    else
		//then, we need to check if we need to move any courses to the front of their typePack
		//this makes auto<->manual switches behave as expected
		courses.forEach(function(compareCourse){
		    if(typePack.includes(compareCourse)){
			typePack = typePack.filter(c => c!=compareCourse); // remove course
			typePack.unshift(compareCourse); // then re-add it to front
		    }	
		});
	    acc.push(app.closed ? typePack : typePack.filter(c => c.seatsAvailable > 0 || c.locked)); // filter out courses that are closed
	});
	//76584
	//83912
	return acc;
    }, []))).filter(app.schedCompat);
    app.savedCourseGenerator = "A"+app.removeDuplicatesBy(course => course.home, courses).map(el => el.home.URLcode).filter(c => c).join() + (app.closed ? "C" : "");
    return app.courses_generator;
};

/**
 * app.removeDuplicatesBy
 *
 * remove duplicates by object key
 * 
 * @param {function(?*):boolean} keyFn
 * @param {!Array<?Object>}      array
 *
 * @returns {!Array<!Object>}
 *
 * @example
 * removeDuplicatesBy((obj => obj.a), [{a: 1}, {a: 2}, {a: 1}, {a: 3}])
 * returns {{a: 1}, {a: 2}, {a:3}]
 *
 * @memberof app
 * @constant
 */
app.removeDuplicatesBy = function(keyFn, array) {
    var mySet = new Set();
    return array.filter(function(x) {
	var key = keyFn(x), isNew = !mySet.has(key);
	if (isNew) mySet.add(key);
	return isNew;
    });
};

/**
 * app.cartesianProduct*(dimensions)
 *
 * Generates a Cartesian Product with given dimensions
 * Example: [['a', 'b'], ['c', 'd']] => [['a', 'c'], ['a', 'd'], ['b', 'c'], ['b', 'd']]
 * go read the wikipedia article on cartesian products for more info
 *
 * @param   {!Array<!Array<?Object>>} dimensions
 *
 * @returns {!Generator}
 *  yields  {!Array<?Object>}
 *
 * @memberof app
 * @constant
 */
app.cartesianProduct = function*(dimensions){
    if(dimensions.map(dimension => dimension.length == 0).reduce((acc, cur) => (acc || cur), false))
	return; // there's an empty dimension - this means all the courses in it are closed
    if(dimensions.length <= 1){ // no need to calculate for 1 length lists (0 neither) - just yield each schedule
	for(var i = 0; i<dimensions[0].length; ++i)
	    yield [dimensions[0][i]]; // wrap each course as its own schedule
	return; // generators are weird
    }
    var stack = new Array(dimensions.length).fill(0, 0, dimensions.length);
    while(true){ // This incriments over stack, treating it like a mixed-base number
	for(var i = 0; i<stack.length-1; ++i){ // check stack state for carry
	    if(stack[i] > dimensions[i].length-1){
		stack[i] = 0; // carry to next stack address
		stack[i+1]++;
	    }
	}
        if(stack[stack.length-1] > dimensions[dimensions.length-1].length-1) // if the last one needs carry...
	    return; // all done
	var schedule = new Array(dimensions.length-1);
	for(var i=0; i<dimensions.length; ++i) // map stack address values to dimension address values
	    schedule[i] = dimensions[i][stack[i]];
	yield schedule;
	stack[0]++; // incriment stack
    }
};

/**
 * app.schedCompat(sched)
 *
 * check if a schedule in the form of sched:[course...] has no conflicts
 *
 * @param   {!Array<!Course>} sched  schedule to check
 *
 * @returns {boolean}                  is this schedule compatable
 *
 * @memberof app
 * @constant
*/
app.schedCompat = function(sched){
    if(sched.length == 1)
	return true; // if there's one class, it's automatically valid
    var backStack = [sched[0]]; // create a stack full of courses to check each new course against
    var schedComp = 1;
    while(schedComp < sched.length){ // go until sched is empty
	for(var i = 0; i<backStack.length; ++i)
	    if(!app.courseCompat(backStack[i], sched[schedComp])) // check all of backStack against the last course in sched
		return false; // if any are incompatable, the whole schedule is incompatable
	backStack.push(sched[schedComp++]); // move the one we just checked against backStack into backStack to check against everything else
    } // we can't just pop because references
    return true; // if none are incompatable, then the schedule is valid
};

/**
 * app.courseCompat(a, b)
 *
 * expand courses into meeting times and check validity
 * this is needed because some courses have multiple meeting times
 *
 * @param   {!Course} a  schedule to check
 * @param   {!Course} b  schedule to check
 *
 * @returns {boolean}      are these two courses compatable
 *
 * @memberof app
 * @constant
*/
app.courseCompat = function(a, b){
    return a.meetings.reduce(function(a_compat, a_meeting){ // check every meeting in a...
	return a_compat && b.meetings.reduce(function(b_compat, b_meeting){ // against every meeting in b
	    return b_compat && app.meetingCompat(a_meeting, b_meeting);
	}, true); // so if every meeting in b is compatable with...
    }, true); // every meeting in a, return true else return false
};

/**
 * app.meetingCompat(a, b)
 *
 * Check if two meetings are compatable (don't overlap)
 *
 * @param   {!Meeting} a  meeting to check
 * @param   {!Meeting} b  meeting to check
 *
 * @returns {boolean}       are these two meetings compatable
 *
 * @memberof app
 * @constant
 */
app.meetingCompat = function(a, b){
    if(!["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].reduce(function(acc, day){ // check if any of the days overlap
	return acc || (a[day] && b[day]); // and carry over any trues
    }, false))
	return true; // if the two aren't even on the same days, we know it's compatable
    return !( (a.beginTime >= b.beginTime && a.beginTime <  b.endTime)|| // beginning time of a is within b
	      (a.endTime   >  b.beginTime && a.endTime   <= b.endTime)|| // end       time of a is within b
	      (b.endTime   >  a.beginTime && b.endTime   <= a.endTime)|| // beginning time of b is within a
	      (b.endTime   >  a.beginTime && b.endTime   <= a.endTime) ); // end       time of b is within a
};
