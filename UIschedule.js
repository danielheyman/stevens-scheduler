/* UIschedule.js
This file contains listeners and aux functions directly responsible for updating
the UI in the schedule. That is, if a course is rendered, it's done here

This file contains:
EventListener for escape/delete
>removes app.course and re-renders - used to deselect a course

change_style()
>toggles between dark mode and light mode

app.autoAndLabs()
>gets all selected sections which are of the same course as the input section
>used to render hovering

app.fillSchedule()
>Renders courses into the on screen schedule

window.onhashchange()
>detects a URL shared schedule during normal operation

app.courseHere()
>Checks if a course section is offered during a given day/hour
>If so, returns a minimal rendering object

app.convertTime()
>Converts a time string into a float offset value for rendering

app.autoFilter()
>for automatic mode - removes all 

app.webclasses()
>takes in a list of courses, filters, and returns only web courses

app.fetchDescription()
>grabs a course's description from data server and shows it to the user

app.dayUpdate()
>looks through all courses to be rendered. If any of those courses are on
>a weekend, expand the schedule to show those courses

app.loadHash()
>used to load a hash from a save or a URL

app.click()
>handles a doubleclick on a rendered course

app.loadHash()
>loads a hash from URL
 */

// remove app.course and re-render
// used to de-select a pending (rendered in blue) course
window.addEventListener("keydown", function (e) {
    if(e.key == "Escape"){   // when pressing escape
	document.getElementById("selectBox").value = "";
	app.course = null;
	app.savedCourseGenerator = "";
	app.courses_generator = null; // force a recalculation to reflect change in app.course
	app.fillSchedule();
    }
});

/**
 * change_style(styleSlider)
 *
 * this function loads / unloads style_dark.css to switch between dark and light mode
 *
 * @param {!Element} styleSlider  top left slider
 */
let change_style = function(styleSlider){
    for(var i = 0; i<document.styleSheets.length; ++i)
	if(document.styleSheets[i].href.includes("style_dark.min.css"))
	    document.styleSheets[i].disabled = !styleSlider.checked;
    document.getElementById('logo').src = app_config.getLogoName(styleSlider.checked);
    window.localStorage.darkMode = styleSlider.checked.toString(); // see mounted.js for storage value handling on page re/load
};

/**
 * app.autoAndLabs(check_course)
 *
 * grab the course, and pair it with any labs (and recs, etc). Determines hover style in auto
 *
 * @param   {?Course}          check_course  course to check
 * @returns {!Array<!Course>}
 *
 * @memberOf app
 * @constant
 */
app.autoAndLabs = function(check_course){
    if(check_course == null)
	return []; // if there's one or zero, we don't even need to check
    if(app.mode == "Manual")
	return [check_course]; // Manual mode - only hover on one section
    return app.courses_generator ? app.courses_generator.get(app.course_list_selection).filter(course => course && course.home == check_course.home) : [];
};

/**
 * app.fillSchedule(referrer = null)
 *
 * renders courses into the on screen schedule
 *
 * @param   {?HTMLElement} [referrer]  HTML element calling function
 *
 * @memberOf app
 * @constant
 */
app.fillSchedule = function(referrer = null) {
    if(referrer)
	app.course_list_selection = referrer.value;
    app.course = document.getElementById("selectBox").value != "" ? parseInt(document.getElementById("selectBox").value, 10) : null;
    var wrappers = document.getElementsByClassName("wrapperInternal");
    var schedule = app.autoConstruct(app.selected.concat(app.course !== null ? app.courses[app.course] : null)).get(app.mode == 'Manual' ? 0 : app.course_list_selection);
    // Then, cycle through and build a divlist -- needed for onclick listeners
    var divTracker = [];
    for(var i=0; i < wrappers.length; ++i){
	var wrapper = wrappers[i];
	var day = wrapper.getAttribute("data-day");
	var hour = wrapper.getAttribute("data-hour");
	while(wrapper.firstChild) // clear
	    wrapper.removeChild(wrapper.firstChild);
	for(var j=0; j<schedule.length; ++j){
	    var course = schedule[j];
	    var courseHere = app.courseHere(day, hour, course);
	    if(course && courseHere){
		var ext = document.createElement("div");
		if(app.mode == "Automatic" || !app.autoInAlts(course, app.course !== null ? app.courses[app.course] : null)){
		    var checkWrapper = document.createElement("div");
		    checkWrapper.className = "autoLock";
		    if(course.locked)
			checkWrapper.innerText = "🔒"; // closed lock
		    else
			checkWrapper.innerText = "🔓 "; // open lock
		    checkWrapper.onclick = function(c){
			return function(ref){
			    app.autoConstruct(app.selected.concat(app.course !== null ? app.courses[app.course] : null)).get(app.course_list_selection, true); // set selected to what's shown on schedule
			    c.locked = !c.locked;
			    app.savedCourseGenerator = ""; // force recalc
			    app.fillSchedule();
			    if(app.course !== null && !app.autoInAlts(app.courses[app.course], c))
				location.hash = app.generateHash(false); // force hash update
			};
		    }(course);
		    checkWrapper.style.top = courseHere.top * 100 + '%';
		    ext.appendChild(checkWrapper);
		}
		
		var div = document.createElement("div");
		div.className = "item";
		var innerText = course.subject + ' ' + course.courseNumber + '\n' + course.title.replace(/&ndash;/g, "–") + '\n' + (course.faculty.trim().length ? (course.faculty + '\n') : "") + (courseHere.loc.length ? (courseHere.loc + '\n') : "") + course.credits + ' credit' + (course.credits !=1 ? 's' : '') + '\n';
		if((course.seatsAvailable !== undefined) && (course.maximumEnrollment !== undefined))
		    innerText += Math.max(0, course.seatsAvailable) + '/' + course.maximumEnrollment + ' seats open\n';
		if((course.waitAvailable !== undefined) && (course.waitAvailable !== undefined))
		    innerText += course.waitAvailable + '/' + course.waitCapacity + ' waitlist open\n';
		innerText += app_config.courseRegistrationCodeName + ': ' + course.courseRegistrationCode + '\n';
		div.innerText = innerText; // need to assign all at once so newlines work properly
		var link = document.createElement("a");
		link.className = "link";
		link.onclick = function(c){ // we need to close this in, else it looks at the last
		    return function(){app.fetchDescription(c);}; // value of course to be updated
		}(course);
		link.innerText = "Description";
		div.appendChild(link);
		div.setAttribute("data-index", course.index);
		div.setAttribute("data-length", courseHere.length);
		div.setAttribute("data-top", courseHere.top);
		if(!app.autoInAlts(course, app.course !== null ? app.courses[app.course] : null)) // run an update instantle - fixes flashes
		    div.classList.add("selected");
		div.style.top = div.getAttribute("data-top") * 100 + '%';
		div.style.height = app.hovering.includes(course) ? 'auto' : div.getAttribute("data-length") * 100 + '%';
		div.style.minHeight = !app.hovering.includes(course) ? 'auto' : div.getAttribute("data-length") * 100 + '%';
		ext.appendChild(div);
		wrapper.appendChild(ext);
		divTracker.push(div);
	    }
	}
    }

    //WEB CLASSES
    var webWrapper = document.getElementById("webWrapper");
    var web = document.getElementById("web");
    while(web.firstChild)
	web.removeChild(web.firstChild);
    var webClasses = Array.isArray(schedule) ? app.webclasses(schedule) : [];
    webWrapper.style.display = webClasses.length ? "" : "none";
    for(var j=0; j<webClasses.length; ++j){
	var course = webClasses[j];
	if(course){
	    var ext = document.createElement("div");
	    if(app.mode == "Automatic" || !app.autoInAlts(course, app.course !== null ? app.courses[app.course] : null)){
		var checkWrapper = document.createElement("div");
		checkWrapper.className = "autoLock";
		if(course.locked)
		    checkWrapper.innerText = "🔒"; // closed lock
		else
		    checkWrapper.innerText = "🔓 "; // open lock
		checkWrapper.onclick = function(c){
		    return function(ref){
			app.autoConstruct(app.selected.concat(app.course !== null ? app.courses[app.course] : null)).get(app.course_list_selection, true); // set selected to what's shown on schedule
			c.locked = !c.locked;
			app.savedCourseGenerator = ""; // force recalc
			app.fillSchedule();
			if(app.course !== null && !app.autoInAlts(app.courses[app.course], c))
			    location.hash = app.generateHash(false); // force hash update
		    };
		}(course);
		ext.appendChild(checkWrapper);
	    }
	    
	    var div = document.createElement("div");
	    div.className = "item";
	    var innerText = course.subject + ' ' + course.courseNumber + '\n' + course.title.replace(/&ndash;/g, "–") + '\n' + (course.faculty.trim().length ? (course.faculty + '\n') : "") + course.credits + ' credit' + (course.credits !=1 ? 's' : '') + '\n';
	    if((course.seatsAvailable !== undefined) && (course.maximumEnrollment !== undefined))
		innerText += Math.max(0, course.seatsAvailable) + '/' + course.maximumEnrollment + ' seats open\n';
	    if((course.waitAvailable !== undefined) && (course.waitAvailable !== undefined))
		innerText += course.waitAvailable + '/' + course.waitCapacity + ' waitlist open\n';
	    innerText += app_config.courseRegistrationCodeName + ': ' + course.courseRegistrationCode + '\n';
	    div.innerText = innerText; // need to assign all at once so newlines work properly
	    var link = document.createElement("a");
	    link.className = "link";
	    link.onclick = function(c){ // we need to close this in, else it looks at the last
		return function(){app.fetchDescription(c);}; // value of course to be updated
	    }(course);
	    link.innerText = "Description";
	    div.appendChild(link);
	    div.setAttribute("data-index", course.index);
	    if(!app.autoInAlts(course, app.course !== null ? app.courses[app.course] : null)) // run a single update instantly - fixes flashing in some cases
		div.classList.add("selected");
	    ext.appendChild(div);
	    web.appendChild(ext);
	    divTracker.push(div);
	}
    }

    //Set listeners
    var update = function(divs){
	return function(){
	    for(var k=0; k<divs.length; ++k){
		var div = divs[k];
		var course = app.courses[div.getAttribute("data-index")];
		if(!app.autoInAlts(course, app.course !== null ? app.courses[app.course] : null))
		    div.classList.add("selected");
		else
		    div.classList.remove("selected");
		let autoLock = div.parentElement.getElementsByClassName("autoLock");
		if(course !== null && app.hovering.includes(course)){
		    if(autoLock.length)
			autoLock[0].classList.add("hovering");
		    div.classList.add("hovering");
		} else {
		    if(autoLock.length)
			autoLock[0].classList.remove("hovering");
		    div.classList.remove("hovering");
		}
		if(div.getAttribute("data-top")){ // non-web
		    div.style.top = div.getAttribute("data-top") * 100 + '%';
		    div.style.height = (course !== null && app.hovering.includes(course)) ? 'auto' : div.getAttribute("data-length") * 100 + '%';
		div.style.minHeight = !(course !== null && app.hovering.includes(course)) ? 'auto' : div.getAttribute("data-length") * 100 + '%';
		}
	    }
	};
    }(divTracker);
    for(var j=0; j<divTracker.length; ++j){
	divTracker[j].ondblclick = function(course){
	    return function(){
		app.click(course);
		app.course = null;
		document.getElementById("selectBox").value = "";
	    };
	}(app.courses[divTracker[j].getAttribute("data-index")]);
	divTracker[j].onmouseenter = function(course){
	    return function(){
		app.hovering = app.autoAndLabs(course);
		update();
	    };
	}(app.courses[divTracker[j].getAttribute("data-index")]);
	divTracker[j].onmouseleave = function(){
	    return function(){
		app.hovering = [];
		update();
	    };
	}();
    }
    
    app.dayUpdate(); // and all the other stuff
    app.autoBar();
    app.saveMarker();
    app.updateCredits();

    //Deal with the "you can deselect" thing
    document.getElementById("escTip").style.display = (app.course != null) ? "" : "none";

    window.localStorage.setItem('lastViewed', app.generateHash(false));
};

/**
 * app.disableOnHashChange
 *
 * Works with window.onhashchange (below) as a means of internal bypassing
 * Ex, if we're testing a course without adding it to selected, don't change hash
 *
 * @type {boolean}
 *
 * @memberof app
 */
app.disableOnHashChange = false;
/**
 * window.onhashchange
 *
 * handler for catching shared scheduled mid-operation without a refresh
 * this only works because the onhashchange function fires after a normal fillSchedule
 * so, all we need to do is detect if we just ran a fill schedule
 * if so, ignore the hash change. If not, we know there's been a manual change -- refill
 * and alert GA of a schedule shared
 *
 * @memberof app
 * @constant
 */
window.onhashchange = function(){
    //first, check if we need to load
    //IE, if hash agrees with loaded schedule
    if(!app.disableOnHashChange && !(app.generateHash(false) == app.getHash().substr(1))){
	if(!app.getHash().substr(1).split("=")[0].length){ // empty hash
	    app.clear();
	} else {
	    //then load selected & render on screen
	    app.changedTerm("first", {value: app.terms[app.terms.map(el => el.URLcode).indexOf(app.getHash().split("=")[0].substr(1))].URLcode}); // need to pend a term change, just like loading a schedule
	    app.updateTerms();
	}
    }
    app.disableOnHashChange = false;
};

/**
 * app.courseHere
 *
 * tests whether or not a course is in a day/hour, and if so returns a render object
 *
 * @param   {string}   day
 * @param   {string}  _hour
 * @param   {?Course}  course
 *
 * @returns {?Object}
 *
 * @memberof app
 * @constant
 */
app.courseHere = function(day, _hour, course){
    if (!course) return null;
    var hour = parseInt(_hour, 10);
    var res = null;
    // if course is in day&hour, res will become an object with css information
    
    course.meetings.forEach(function(meeting){
	if (meeting.building == 'WS' || !meeting.beginTime || !meeting[day]) return;
	var start = app.convertTime(meeting.beginTime);
	var end = app.convertTime(meeting.endTime);
	if (Math.trunc(start) != hour-8) return;
	res = {
	    top: start-Math.trunc(start),
	    length: end-start,
	    loc: ((Boolean(meeting.building) && meeting.building.trim().length && Boolean(meeting.room) && meeting.room.trim().length) ? (meeting.building + " " + meeting.room) : ""),
	};
    });
    return res;
};

/**
 * app.convertTime(time)
 *
 * converts a time from hour-minute (ex: 1230) format into a float format representing
 * the offset between the time value and the top of the schedule
 *
 * @param   {string} time
 *
 * @returns {number}
 *
 * @memberof app
 * @constant
 */
app.convertTime = function(time){
    var minute = time.substr(-2);
    return parseFloat(time.substr(0, time.length-minute.length))+parseFloat(minute)/60-8;
};

/**
 * app.webclasses(courses)
 *
 * takes a list of courses and returns only the web courses
 *
 * @param   {?Array<?Course>} courses
 *
 * @returns {!Array<!Course>}
 *
 * @memberof app
 * @constant
 */
app.webclasses = function(courses){
    return courses ? courses.filter(function(course){
	return course && (course.meetings.map(el => el.building == "ONLINE").reduce((a, b) => (a || b), false));
    }) : [];
};

/**
 * app.fetchDescription
 *
 * fetches the description of a course and displays it in the foreground
 *
 * @param {!Course} course
 *
 * @memberof app
 * @constant
 */
app.fetchDescription = function(course){
    ga('send', 'event', 'description', 'fetch');
    //first, show description box
    document.getElementById("description-fetch").style.display = "";
    document.getElementById("description-show").style.display = "none";
    document.getElementById("description").style.display = "";
    document.getElementById("description-strong").innerText = course.subject + " " + course.courseNumber + ":";
    var updater = function(text){
	//remove loading message and show description
	var show = document.getElementById("description-show");
	show.innerText = text;
	show.style.display = "";
	document.getElementById("description-fetch").style.display = "none";
    };
    if(!course.description){
	// if it's not loaded, load it and cache it in the course object
	(new Searcher("desc", app.term.toString(), course.URLcode.toString())).start(function(response){
	    response = app_config.PROCESSgetDescription(response);
	    updater(response);
	    course.description = response;
	});
    } else {
	// if it's already loaded, go ahead and show it
	updater(course.description);
    }
};

/**
 * app.dayUpdate()
 *
 * if needed, expands schedule to include Saturdays and Sundays - and show "No valid schedules"
 *
 * @memberof app
 * @constant
 */
app.dayUpdate = function(){
    //first, hide weekends
    if(app.mode == "Automatic"){ // check if valid
	if((app.selected.length == 0) || (app.courses_generator && app.courses_generator.data && app.courses_generator.data[app.course_list_selection])) //good to go
	    document.getElementById("noSchedWrapper").style.display = "none";
	else // no valid schedules - show msg
	    document.getElementById("noSchedWrapper").style.display = "";
    } else { // Manual - always valid
	document.getElementById("noSchedWrapper").style.display = "none";
	if(document.getElementById("schedTbody").children[0].children[1].style.display == "none"){
	    for(var i=1; i<=5; ++i){
		var trs = document.getElementById("schedTbody").children;
		for(var j=0; j<trs.length; ++j){
		    trs[j].children[i].style.display = "";
		}
	    }
	}
    }
    
    //then, show only what needed
    if((app.course === null ? app.selected : app.selected.concat(app.courses[app.course])) // saturday
       .filter(c => c.meetings
	       .filter(m => m.saturday || m.sunday)
	       .length > 0)
       .length > 0){
	document.getElementById("schedThead").children[6].style.display = "";
	var trs = document.getElementById("schedTbody").children;
	for(var i=0; i<trs.length; ++i){
	    trs[i].children[6].style.display = "";
	}
    } else {
	document.getElementById("schedThead").children[6].style.display = "none";
	var trs = document.getElementById("schedTbody").children;
	for(var i=0; i<trs.length; ++i){
	    trs[i].children[6].style.display = "none";
	}
    }
    
    if((app.course === null ? app.selected : app.selected.concat(app.courses[app.course])) // sunday
       .filter(c => c.meetings
	       .filter(m => m.sunday)
	       .length > 0)
       .length > 0){
	document.getElementById("schedThead").children[7].style.display = "";
	var trs = document.getElementById("schedTbody").children;
	for(var i=0; i<trs.length; ++i){
	    trs[i].children[7].style.display = "";
	}
    } else {
	document.getElementById("schedThead").children[7].style.display = "none";
	var trs = document.getElementById("schedTbody").children;
	for(var i=0; i<trs.length; ++i){
	    trs[i].children[7].style.display = "none";
	}
    }
};

/**
 * app.loadHash(first = false){
 *
 * Loads a schedule from URL hash, and checks whether or not that course is a saved course
 *
 * @param {boolean} [first]
 *
 * @memberof app
 * @constant
*/
app.loadHash = function(first = false){
    if(!app.getHash().split("=")[0].length){
	app.clear();
	return; // no term data - nothing to load
    }
    var hashes = app.getHash().split("=")[1].split("&")[0].split(",");
    app.selected = app.courses.filter(function(course){
	let ret = hashes.map(hash => hash.replace("!", "")).indexOf(course.URLcode.toString());
	if(ret > -1)
	    course.locked = hashes[ret][hashes[ret].length-1] == "!";
	return ret > -1;
    });
    document.getElementById("closedCheck").checked = Boolean(app.getHash().split("&")[1]);
    app.closed = Boolean(app.getHash().split("&")[1]);
    if(first){ // loading hash from URL - check if there's a save which matches, and if so select it
	// this will choose the firstmost schedule that matches
	var possible = [];
	for(var i=0,saves = document.getElementById("saves").children; i < saves.length; ++i)
	    if(JSON.parse(window.localStorage.schedules)[saves[i].innerText].split("+")[0] == app.getHash().split("#")[1])
		possible.push(saves[i]);
	var lastMatch = possible.filter(function(element){ // sees if there's any save that was also most recently used
	    return JSON.parse(window.localStorage.schedules)[element.innerText].split("+")[0] + "?" + element.innerText == window.localStorage.lastSaved;
	});
	if(possible.length){ // no matches - probably completly new
	    (lastMatch.length ? lastMatch[0] : possible[0]).classList.add("selected"); // if we're reloading, go for the known correct schedule. Else, go for the first one to match
	    app.currentstorage = (lastMatch.length ? lastMatch[0] : possible[0]).innerText;
	    // and update notes too
	    document.getElementById("notes").value = JSON.parse(window.localStorage.schedules)[app.currentstorage].split("+")[1];
	}
    }
};

/**
 * app.click(course)
 *
 * handles a double click on a rendered schedule
 * this adds or removes the course from app.selected
 * but this needs extra steps and resets in auto mode
 *
 * @param {?Course} course
 *
 * @memberof app
 * @constant
 */
app.click = function(course){
    if(course === null)
	return;
    if (app.autoInAlts(app.course !== null ? app.courses[app.course] : null, course)){ // needs to be added to selected
	ga('send', 'event', 'course', 'add');
	document.getElementById("selectBox").value = "";
	if(app.mode == "Manual"){
	    app.course = null;
	    app.selected.push(course);
	} else {
	    var intended = app.autoConstruct(app.selected.concat(app.course !== null ? app.courses[app.course] : null)).get(app.course_list_selection).filter(c => app.autoInAlts(app.course !== null ? app.courses[app.course] : null, c));
	    app.course = null;
	    intended.forEach(c => app.selected.push(c));
	    app.savedCourseGenerator = "A";
	    app.autoConstruct(app.selected).get(app.course_list_selection, true); // force url update & selected update
	}
    }
    else
    {
	ga('send', 'event', 'course', 'remove');
	if(app.mode == "Manual") {
	    course.locked = false; // release
	    app.selected.splice(app.selected.indexOf(course), 1);
	} else {
	    let toUnlock = app.selected.filter(c => course.home == c.home);
	    for(let i=0; i<toUnlock.length; ++i)
		toUnlock[i].locked = false;
	    app.selected = app.selected.filter(c => course.home != c.home);
	}
        app.hovering = [];
    }

    location.hash = app.generateHash(false);
    app.course_list_selection = 0;
    var range = document.getElementById('Range');
    range.max = 0;
    range.value = 0; // fix render on auto bar
    app.hideSearch();
    app.fillSchedule();
};
