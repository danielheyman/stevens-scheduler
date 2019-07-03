/* selectionLogic.js
This file contains the core logic behind finding and displaying valid schedules in automatic mode
This file also deals with manual mode schedules, but usually just optimizes them away

In this file:

Lazy class
>caches generated schedules

autoConstruct()
>creates a Lazy object which contains a generator for all valid courses of a given schedule

removeDuplicatesBy()
>util function which removes duplicates from an array based on an object value

cartesianProduct*()
>generator which returns a cartesian product from a given set of dimensions

schedCompat()
>checks if there are schedule conflicts in a given list of courses

courseCompat()
>checks if two courses have a schedule conflict

meetingCompat()
>checks if two meeting times conflict
*/

// a semi-memoized simplified, and specialized version of the Lazy class you can find online
// essentially, it creates an array from a generator function and populates on get requests
// also supports filter functions
/*
Example of use:
NOTE: this example won't actually work. It only works with courses, but this is a good illustration

var generator = function*(){
  for(var i=0; i<10; ++i)
    yield i;
}

var divisible_by_2 = function(a){
  return !(a%2);
}

var lazy = new Lazy(generator);
lazy.filter(divisible_by_2);

console..log(lazy.get(0))
// returns 0
console..log(lazy.get(1))
// returns 2
console..log(lazy.get(2))
// returns 4
console..log(lazy.get(3))
// returns 6
*/
class Lazy{
    constructor(inputgen){
        this.core = inputgen;
        this.data = [];
    	this.filters = [];
	this.done = false;
    }
    get(i, set=false){
        while(!this.done && (this.data.length <= i)){
	    var tmp = this.core.next();
	    if(tmp.done){
		this.done = true;
		break;
	    }
	    if(this.filters.reduce(function(acc, cur_filter){ // run all filters on value
		return acc && cur_filter(tmp.value);
	    }, true)){
		this.data.push({value: tmp.value, selected: tmp.value.filter(function(course){// => // cache selected change
		    return !course.home.alts.reduce(function(acc, cur){ // look through all of course offerings
			return acc.concat(cur); // where cur is a typePack
		    }, []).includes(app.courses[app.course]) // remove pending selection
		})}); // we need to do this here so it updates the url dynamically
            }
	}
	var data = this.data[i];
	if(!data)
	    return false; // no valid schedules
	if(set || this.data.length != 1) // set selected on either a click, or on a autobar change
	    app.selected = data.selected; // update selected on click
	location.hash = app.generateHash(false); // update url
        return data.value;
    }
    filter(filter_fun){
	this.filters.push(filter_fun);
	return this;
    }
}

// return a Lazy object which spits out valid schedules, and cache it so we don't need to generate the lazy more than once
app.autoConstruct = function(courses){
    if(courses[0] === undefined) return {get: function(i){return []}}; // no courses - go no further
    if(courses.slice(-1)[0] === undefined) // remove empty at end when no class is selected
	courses.pop();
    courses = courses.filter(course => course.seatsAvailable || this.closed);
    if(this.mode == "Manual"){
	if("M"+courses.map(course => course.URLcode).join() == this.savedCourseGenerator)
	    return app.courses_generator; // don't have to run the calculation for every hour in every day
	if(this.savedCourseGenerator[0] == "A" && this.course != null){ // switching from automatic to manual - update app.course
	    if(this.courses_generator)
		if(this.courses_generator.get(this.course_list_selection))
		    courses = this.courses_generator.get(this.course_list_selection); // slight optimization for caching
	    this.course = courses.filter(function(course){
		return course.home == app.courses[app.course].home;
	    })[0].index; // replace app.course with the proper one automatically assigned
	    document.getElementById("selectBox").value = this.course.toString();
	    //and fix a render bug
	}
	this.savedCourseGenerator = "M"+courses.map(el => el.URLcode).join();
	this.courses_generator = {get: function(i){return courses;}};
	return this.courses_generator;
    }
    //automatic generator
    if("A"+this.removeDuplicatesBy(course => course.home, courses).map(el => el.home.URLcode).filter(c => c).join() + (this.closed ? "C" : "") == this.savedCourseGenerator)
	return app.courses_generator; // don't have to run the calculation for every hour in every day
    if(this.savedCourseGenerator[0] == "M" && this.course){ // switching from manual to automatic - update app.course
	this.course = app.courses[this.course].home.index; // basically just a render bug
	document.getElementById("selectBox").value = this.course.toString();
    }
    this.course_list_selection = 0; // Reset on each new sched gen
    var range = document.getElementById('Range');
    range.max = 0;
    range.value = 0; // and reset render
    app.courses_generator = new Lazy(this.cartesianProduct(this.removeDuplicatesBy(course => course.home, courses).reduce(function(acc, course){ // expands courses into all alt lists
	course.home.alts.forEach(function(typePack){ // move in every typePack
	    //first, we need to check if we need to move any courses to the front of their typePack
	    //this makes auto<->manual switches behave as expected
	    courses.forEach(function(compareCourse){
		if(typePack.includes(compareCourse)){
		    typePack = typePack.filter(c => c!=compareCourse); // remove course
		    typePack.unshift(compareCourse); // then re-add it to front
		}	
	    })
	    acc.push(typePack);
	});
	return acc;
    }, []))).filter(function(schedule){
	return !schedule.filter(course => !course.seatsAvailable && !app.closed).length;
    }).filter(this.schedCompat);
    this.savedCourseGenerator = "A"+this.removeDuplicatesBy(course => course.home, courses).map(el => el.home.URLcode).filter(c => c).join() + (this.closed ? "C" : "");
    return app.courses_generator;
};

// remove duplicates by object key
/* Example:
removeDuplicatesBy((obj => obj.a), [{a: 1}, {a: 2}, {a: 1}, {a: 3}])
>{{a: 1}, {a: 2}, {a:3}]
 */
app.removeDuplicatesBy = function(keyFn, array) {
    var mySet = new Set();
    return array.filter(function(x) {
	var key = keyFn(x), isNew = !mySet.has(key);
	if (isNew) mySet.add(key);
	return isNew;
    });
};

// Generates a Cartesian Product with given dimensions
// Example: [['a', 'b'], ['c', 'd']] => [['a', 'c'], ['a', 'd'], ['b', 'c'], ['b', 'd']]
// go read the wikipedia article on cartesian products for more info
app.cartesianProduct = function*(dimensions){
    if(dimensions.length <= 1){// no need to calculate for 1 length lists (0 neither) - just yield each schedule
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
	perm = schedule
	yield schedule;
	stack[0]++; // incriment stack
    }
};

// check if a schedule in the form of sched:[course...] has no conflicts
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

// expand courses into meeting times and check validity
// this is needed because some courses have multiple meeting times
app.courseCompat = function(a, b){
    return a.meetings.reduce(function(a_compat, a_meeting){ // check every meeting in a...
	return a_compat && b.meetings.reduce(function(b_compat, b_meeting){ // against every meeting in b
	    return b_compat && app.meetingCompat(a_meeting, b_meeting);
	}, true); // so if every meeting in b is compatable with...
    }, true); // every meeting in a, return true else return false
};

// Check if two meetings are compatable (don't overlap)
app.meetingCompat = function(a, b){
    if(!["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].reduce(function(acc, day){ // check if any of the days overlap
	return acc || (a[day] && b[day]); // and carry over any trues
    }, false))
	return true; // if the two aren't even on the same days, we know it's compatable
    return !( (a.beginTime >= b.beginTime && a.beginTime <  b.endTime)|| // beginning time of a is within b
	      (a.endTime   >  b.beginTime && a.endTime   <= b.endTime)|| // end       time of a is within b
	      (b.endTime   >  a.beginTime && b.endTime   <= a.endTime)|| // beginning time of b is within a
	      (b.endTime   >  a.beginTime && b.endTime   <= a.endTime) ) // end       time of b is within a
};
