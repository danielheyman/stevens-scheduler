/* UIschedule.js
This file contains listeners and aux functions directly responsible for updating
the UI in the schedule. That is, if a course is rendered, it's done here

This file contains:
EventListener for escape/delete
>removes app.course and re-renders - used to deselect a course

change_style()
>toggles between dark mode and light mode

autoAndLabs()
>gets all selected sections which are of the same course as the input section
>used to render hovering

fillSchedule()
>Renders courses into the on screen schedule

window.onhashchange()
>detects a URL shared schedule during normal operation

courseHere()
>Checks if a course section is offered during a given day/hour
>If so, returns a minimal rendering object

convertTime()
>Converts a time string into a float offset value for rendering

autoFilter()
>for automatic mode - removes all 

webclasses()
>takes in a list of courses, filters, and returns only web courses

fetchDescription()
>grabs a course's description from data server and shows it to the user

dayUpdate()
>looks through all courses to be rendered. If any of those courses are on
>a weekend, expand the schedule to show those courses

loadHash()
>used to load a hash from a save or a URL

click()
>handles a doubleclick on a rendered course
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
})

// this function loads / unloads style_dark.css to switch between dark and light mode
let change_style = function(styleSlider){
    document.styleSheets[1].disabled = !styleSlider.checked;
    document.getElementById('logo').src = app_config.getLogoName(styleSlider.checked);
    localStorage.darkMode = styleSlider.checked.toString(); // see mounted.js for storage value handling on page re/load
}

// grab the course, and pair it with any labs (and recs, etc). Determines hover style in auto
app.autoAndLabs = function(check_course){
    if(check_course == null)
	return []; // if there's one or zero, we don't even need to check
    if(this.mode == "Manual")
	return [check_course]; // Manual mode - only hover on one section
    return app.courses_generator ? app.courses_generator.get(this.course_list_selection).filter(course => course && course.home == check_course.home) : [];
};

// renders courses into the on screen schedule
app.fillSchedule = function(referrer) {
    if(referrer)
	this.course_list_selection = referrer.value;
    this.course = document.getElementById("selectBox").value != "" ? parseInt(document.getElementById("selectBox").value) : null;
    var wrappers = document.getElementsByClassName("wrapperInternal");
    var schedule = this.autoConstruct(this.selected.concat(app.courses[this.course])).get(this.mode == 'Manual' ? 0 : this.course_list_selection);
    // Then, cycle through and build a divlist
    var divTracker = [];
    for(var i=0; i < wrappers.length; ++i){
	var wrapper = wrappers[i];
	var day = wrapper.getAttribute("data-day");
	var hour = wrapper.getAttribute("data-hour");
	while(wrapper.firstChild) // clear
	    wrapper.removeChild(wrapper.firstChild);
	for(var j=0; j<schedule.length; ++j){
	    var course = schedule[j];
	    var courseHere = this.courseHere(day, hour, course);
	    if(course && courseHere){
		var div = document.createElement("div");
		div.className = "item";
		var innerText = course.subject + ' ' + course.courseNumber + '\n' + course.title.replace(/&ndash;/g, "–") + '\n' + course.faculty + '\n' + courseHere.loc + '\n' + course.credits + ' credit' + (course.credits !=1 ? 's' : '') + '\n';
		if(course.seatsAvailable && course.maximumEnrollment)
		    innerText += Math.max(0, course.seatsAvailable) + '/' + course.maximumEnrollment + ' seats open\n';
		if(course.waitAvailable && course.waitAvailable > 0)
		    innerText += course.waitAvailable + '/' + course.waitCapacity + ' waitlist open\n';
		innerText += app_config.courseURLcodeName + ': ' + course.URLcode + '\n';
		div.innerText = innerText; // need to assign all at once so newlines work properly
		var link = document.createElement("a");
		link.className = "link";
		link.onclick = function(c){ // we need to close this in, else it looks at the last
		    return function(){app.fetchDescription(c);}; // value of course to be updated
		}(course);
		link.innerText = "Description";
		div.appendChild(link)
		div.setAttribute("data-index", course.index);
		div.setAttribute("data-length", courseHere.length);
		div.setAttribute("data-top", courseHere.top);
		if(!app.autoInAlts(course, app.courses[app.course])) // run an update instantle - fixes flashes
		    div.classList.add("selected");
		div.style.top = div.getAttribute("data-top") * 100 + '%';
		div.style.height = app.hovering.includes(course) ? 'auto' : div.getAttribute("data-length") * 100 + '%';
		div.style.minHeight = !app.hovering.includes(course) ? 'auto' : div.getAttribute("data-length") * 100 + '%';
		wrapper.appendChild(div);
		divTracker.push(div);
	    }
	}
    }

    //WEB CLASSES
    var webWrapper = document.getElementById("webWrapper");
    var web = document.getElementById("web");
    while(web.firstChild)
	web.removeChild(web.firstChild);
    var schedule = this.autoConstruct(this.selected.concat(app.courses[this.course])).get(this.mode == 'Manual' ? 0 : this.course_list_selection);
    var webClasses = this.webclasses(schedule);
    webWrapper.style.display = webClasses.length ? "" : "none";
    for(var j=0; j<webClasses.length; ++j){
	var course = webClasses[j];
	if(course){
	    var div = document.createElement("div");
	    div.className = "item";
	    var innerText = course.subject + ' ' + course.courseNumber + '\n' + course.title.replace(/&ndash;/g, "–") + '\n' + course.faculty + '\n' + course.credits + ' credit' + (course.credits !=1 ? 's' : '') + '\n';
	    if(course.seatsAvailable && course.maximumEnrollment)
		innerText += Math.max(0, course.seatsAvailable) + '/' + course.maximumEnrollment + ' seats open\n';
	    if(course.waitAvailable && course.waitAvailable > 0)
		innerText += course.waitAvailable + '/' + course.waitCapacity + ' waitlist open\n';
	    innerText += app_config.courseURLcodeName + ': ' + course.URLcode + '\n';
	    div.innerText = innerText; // need to assign all at once so newlines work properly
	    var link = document.createElement("a");
	    link.className = "link";
	    link.onclick = function(c){ // we need to close this in, else it looks at the last
		return function(){app.fetchDescription(c);}; // value of course to be updated
	    }(course);
	    link.innerText = "Description";
	    div.appendChild(link)
	    div.setAttribute("data-index", course.index);
	    if(!app.autoInAlts(course, app.courses[app.course])) // run a single update instantly - fixes flashing in some cases
		div.classList.add("selected");
	    web.appendChild(div);
	    divTracker.push(div);
	}
    }

    //Set listeners
    var update = function(divs){
	return function(){
	    for(var k=0; k<divs.length; ++k){
		var div = divs[k];
		var course = app.courses[div.getAttribute("data-index")];
		if(!app.autoInAlts(course, app.courses[app.course]))
		    div.classList.add("selected");
		else
		    div.classList.remove("selected");
		if(app.hovering.includes(course))
		    div.classList.add("hovering");
		else
		    div.classList.remove("hovering");
		if(div.getAttribute("data-top")){ // non-web
		    div.style.top = div.getAttribute("data-top") * 100 + '%';
		    div.style.height = app.hovering.includes(course) ? 'auto' : div.getAttribute("data-length") * 100 + '%';
		    div.style.minHeight = !app.hovering.includes(course) ? 'auto' : div.getAttribute("data-length") * 100 + '%';
		}
	    }
	}
    }(divTracker);
    for(var j=0; j<divTracker.length; ++j){
	divTracker[j].ondblclick = function(course){
	    return function(){
		app.click(course);
		app.course = null;
		document.getElementById("selectBox").value = "";
	    }
	}(app.courses[divTracker[j].getAttribute("data-index")]);
	divTracker[j].onmouseenter = function(course){
	    return function(){
		app.hovering = app.autoAndLabs(course);
		update();
	    }
	}(app.courses[divTracker[j].getAttribute("data-index")]);
	divTracker[j].onmouseleave = function(){
	    return function(){
		app.hovering = [];
		update();
	    }
	}();
    }
    
    this.dayUpdate(); // and all the other stuff
    this.autoBar();
    this.saveMarker();
    this.updateCredits();

    //Deal with the "you can deselect" thing
    document.getElementById("escTip").style.display = this.course != null && (this.closed || app.courses[this.course].seatsAvailable) ? "" : "none";

    localStorage.setItem('lastViewed', this.generateHash(false));
    if(this.selected.length > 0)
	gtag('event', 'Schedules Tested');
};

// handler for catching shared scheduled mid-operation without a refresh
// this only works because the onhashchange function fires after a normal fillSchedule
// so, all we need to do is detect if we just ran a fill schedule
// if so, ignore the hash change. If not, we know there's been a manual change -- refill
// and alert GA of a schedule shared
onhashchange = function(){
    //first, check if we need to load
    //IE, if hash agrees with loaded schedule
    if(!(app.generateHash(false) == location.hash.substr(1))){
	//first change term
	app.term = app.terms[app.terms.map(el => el.URLcode).indexOf(location.hash.split("=")[0].substr(1))].URLcode;
	//then load selected & render on screen
	app.updateTerms();
	app.changedTerm("first");
    }
};

// tests whether or not a course is in a day/hour, and if so returns a render object
app.courseHere = function(day, hour, course){
    if (!course) return;
    var res = null;
    // if course is in day&hour, res will become an object with css information
    
    course.meetings.forEach(function(meeting){
	if (meeting.building == 'WS' || !meeting.beginTime || !meeting[day]) return;
	var start = this.convertTime(meeting.beginTime);
	var end = this.convertTime(meeting.endTime);
	if (Math.trunc(start, 0) != hour-8) return;
	res = {
	    top: start-Math.trunc(start,0),
	    length: end-start,
	    loc: meeting.building + " " + meeting.room,
	}
    }.bind(this));
    return res;
};

// converts a time from hour-minute (ex: 1230) format into a float format representing
// the offset between the time value and the top of the schedule
app.convertTime = function(time){
    var minute = time.substr(-2);
    return parseFloat(time.substr(0, time.length-minute.length), 10)+parseFloat(minute)/60-8;
};

// takes a list of courses and returns only the web courses
app.webclasses = function(courses){
    return courses ? courses.filter(function(course){
	return course && (course.meetings.map(el => el.building == "ONLINE").reduce((a, b) => (a || b), false));
    }) : [];
};

// fetches and dislpays the description of a course
app.fetchDescription = function(course){
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
    }
    if(!course.description){
	// if it's not loaded, load it and cache it in the course object
	(new Searcher("desc", this.term.toString(), course.URLcode.toString())).start(function(response){
	    response = app_config.PROCESSgetDescription(response);
	    updater(response);
	    course.description = response;
	});
    } else {
	// if it's already loaded, go ahead and show it
	updater(course.description);
    }
};

// if needed, expands schedule to include Saturdays and Sundays
app.dayUpdate = function(){
    var test = false;
    //first, hide weekends
    if(this.mode == "Automatic"){
	if(app.courses_generator)
	    if(app.courses_generator.data){
		if(app.courses_generator.data[this.course_list_selection]){
		    test = app.courses_generator.data[this.course_list_selection].value;
		    document.getElementById("noSchedWrapper").style.display = "none";
		    if(document.getElementById("schedTbody").children[0].children[1].style.display == "none"){
			for(var i=1; i<=5; ++i){
			    var trs = document.getElementById("schedTbody").children;
			    for(var j=0; j<trs.length; ++j){
				trs[j].children[i].style.display = "";
			    }
			}
		    }
		} else { // no valid schedules - show msg
		    document.getElementById("noSchedWrapper").style.display = "";
		    if(document.getElementById("schedTbody").children[0].children[1].style.display == ""){
			for(var i=1; i<=5; ++i){
			    var trs = document.getElementById("schedTbody").children;
			    for(var j=0; j<trs.length; ++j){
				trs[j].children[i].style.display = "none";
			    }
			}
		    }
		} // let it continue - will wipe saturdays & sundays
	    }
    } else { // Manual
	test = this.selected.concat(app.courses[this.course]);
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
    if(test != false ? test.map(function(c){ // Any of the courses are held on a Saturday (or Sunday)
	if(!c) return false;
	return c.meetings.map(function(meeting){
	    return meeting.saturday || meeting.sunday
	}).reduce(function(a, b){
	    return a || b;
	})
    }).reduce(function(a, b){
	return a || b;
    }, false) : false){
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
    
    if(test != false ? test.map(function(c){ // Any of the courses are held on a Sunday
	if(!c) return false;
	return c.meetings.map(function(meeting){
	    return meeting.sunday
	}).reduce(function(a, b){
	    return a || b;
	})
    }).reduce(function(a, b){
	return a || b
    }, false) : false){
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
}

// used to load in a schedule from either a save or a shared URL
app.loadHash = function(first){
    var hashes = location.hash.split("=")[1].split("&")[0].split(",");
    this.selected = app.courses.filter(function(course){
	return hashes.indexOf(course.URLcode.toString()) > -1;
    });
    document.getElementById("closedCheck").checked = !!location.hash.split("&")[1];
    this.closed = !!location.hash.split("&")[1];
    if(first){ // loading hash from URL - check if there's a save which matches, and if so select it
	// this will choose the firstmost schedule that matches
	var possible = [];
	for(var i=0,saves = document.getElementById("saves").children; i < saves.length; ++i)
	    if(this.localStorage[saves[i].innerText].split("+")[0] == location.hash.split("#")[1])
		possible.push(saves[i]);
	var lastMatch = possible.filter(function(element){ // sees if there's any save that was also most recently used
	    return app.localStorage[element.innerText].split("+")[0] + "!" + element.innerText == localStorage.lastSaved;
	});
	if(!possible.length){ // no matches - probably completly new
	    if((location.hash.split("&")[0].split("=")[1].length > 0) && (this.generateHash(false) != localStorage["lastViewed"])) // make sure there are actually some courses
		gtag('event', 'Schedules Shared'); // is completly new
	} else { // previous - load and update
	    (lastMatch.length ? lastMatch[0] : possible[0]).classList.add("selected"); // if we're reloading, go for the known correct schedule. Else, go for the first one to match
	    app.currentstorage = (lastMatch.length ? lastMatch[0] : possible[0]).innerText;
	}
    }
};

// handles a double click on a rendered schedule
// this adds or removes the course from app.selected
// but this needs extra steps and resets in auto mode
app.click = function(course){
    if (this.autoInAlts(this.courses[this.course], course)) // needs to be added to selected
    {
	document.getElementById("selectBox").value = "";
	if(this.mode == "Manual"){
	    this.course = null;
	    this.selected.push(course);
	} else {
	    var intended = this.autoConstruct(this.selected.concat(this.courses[this.course])).get(this.course_list_selection).filter(c => this.autoInAlts(this.courses[this.course], c))
	    this.course = null;
	    intended.forEach(c => app.selected.push(c));
	    this.savedCourseGenerator = "A";
	    this.autoConstruct(this.selected).get(this.course_list_selection, true); // force url update & selected update
	}
    }
    else
    {
	if(this.mode == "Manual")
	    this.selected.splice(this.selected.indexOf(course), 1);
	else
	    this.selected = this.selected.filter(c => course.home != c.home);
        this.hovering = [];
    }

    location.hash = this.generateHash(false);
    this.course_list_selection = 0;
    var range = document.getElementById('Range');
    range.max = 0;
    range.value = 0; // fix render on auto bar
    this.hideSearch();
    this.fillSchedule();
};
