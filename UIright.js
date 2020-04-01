/* UIright.js
This file contains listeners and aux functions directly responsible for updating
the contents of <div class="right">. This includes terms, notes, mode selection,
and course selection.
This does NOT include webclass rendering. That's in UIschedule.js for continuity

In this file:

app.totalCredits()
>returns an integer value representing the total number of credits for all
>selected courses combined

app.updateCredits()
>Updates the "Total Credits" span according to totalCredits()

app.autoBar()
>Shows/hides automatic selection bar

app.genNext()
>Listener for the "Next" button in automatic mode. Calls out to selectionLogic.js to generate
>the next valid schedule, or loop. Also updates UI accordingly

app.changedTerm()
>Listener for the term selectionn box. Upon change, will load the new term and update the UI accordingly

app.genDivs()
>Generates two lists of divs used in automatic&manual mode which are placed in the main course selection box

app.updateTerms()
>Fills the term selection dropdown list

app.updatePercent()
>Update the current percent message

app.updateNotes()
>Listener for the notes textbox, will stretch or shrink the box according to the text within

app.fillSearch()
>Fills the course selection box

app.autoFilter()
>Filters out courses from the course selection box depending on the current mode

app.hideSearch()
>Filters out options from the course selection box depending on their filterSearch valie

app.filterSearch()
>Filters out a single option from the course selection box if the current search
>query should filter it out
*/

/**
 * app.totalCredits()
 *
 * adds up the credit values of all selected courses and returns it as an integer
 *
 * @returns {number}
 *
 * @memberof app
 * @constant
 */
app.totalCredits = function(){
    return app.selected.reduce(function(acc, cur){
	return acc+cur.credits;
    }, 0);
};

/**
 * app.updateCredits()
 * 
 * updates the "Total Credits" counter
 *
 * @memberof app
 * @constant
 */
app.updateCredits = function() {
    document.getElementById("credits").innerText = app.totalCredits();
};

/**
 * app.autoBar()
 *
 * shows or hides the automatic selection bar depending on the mode and number of courses selected
 * If there's only one valid schedule, don't bother giving the illusion of choice
 *
 * @memberof app
 * @constant
 */
app.autoBar = function(){
    var autoBar = document.getElementById("autoBar");
    autoBar.style.display = app.mode == 'Automatic' && (app.selected.length > 0 || app.course !== null) && app.autoConstruct(app.selected.concat(app.course !== null ? app.courses[app.course] : null)).get(1, false) ? "block" : "none";
    document.getElementById('nextButton').innerText='Next';
    if(autoBar.style.display == "none"){
	document.getElementById("selectBox").size = 25;
	document.getElementById("Automatic").style.marginBottom = "10px";
    } else {
	document.getElementById("selectBox").size = 24;
	document.getElementById("Automatic").style.marginBottom = "0px";
    }
};

/**
 * app.genNext(button)
 * 
 * generates and displays the next valid schedule in automatic mode
 *
 * @param {?Element} button
 *
 * @memberof app
 * @constant
 */
app.genNext = function(button){
    if(!button)
	return;
    if(app.courses_generator && app.courses_generator.get(app.courses_generator.data ? app.courses_generator.data.length : 0)){ // see if there's another valid schedule we haven't seen yet
	app.course_list_selection = (app.courses_generator.data ? app.courses_generator.data.length : 0)-1; // and show it to us
    } else { // done - start looping
	app.course_list_selection++;
	app.course_list_selection%=(app.courses_generator ? app.courses_generator.data.length : 0);
    }
    app.fillSchedule();
    var range = document.getElementById("Range");
    range.max = app.courses_generator ? app.courses_generator.data.length-1 : 0;
    range.value = app.course_list_selection;

    button.innerText = (app.courses_generator ? app.courses_generator.done : false) ? "Loop" : "Next";
};

/**
 * app.changedTerm (loadHash = false, referrer = null)
 *
 * listener for term selection box
 * loads in new term (see librequests.js) and places courses in course selection box
 * if loadHash is true, then render app.selected
 * if loadHash is "first", render from URL hash
 *
 * @param {boolean|string}   [loadHash]  should we be loading from URL hash?
 *                                       if == "first" it's a real share - notify GA
 * @param {?Element|?Object} [referrer]  term selection box
 *
 * @memberof app
 * @constant
 */
app.changedTerm = function(loadHash = false, referrer = null){
    if(!loadHash && referrer !== null && app.changed()){
        if (!window.confirm("Are you sure you want to discard your changes?")){
	    document.getElementById("termSelect").value = app.term;
	    return;
	}
    }
    if(loadHash != true && !app.clear((!loadHash && referrer !== null && app.changed()), loadHash == "first")){ // don't confirm twice
	document.getElementById("termSelect").value = app.term; // confirm
	return;
    }
    if(referrer){
	if(referrer.firstChild && referrer.firstChild.value == "") // clean up on first get
	    referrer.removeChild(referrer.firstChild);
	app.term = referrer.value;
    }
    if(!app.term)
	return; // empty
    app.course = null;
    document.getElementById("selectBox").value = "";
    document.getElementById("searchBox").value = "";
    app.selected = [];
    app.course_list_selection = 0;
    var range = document.getElementById('Range');
    range.max = 0;
    range.value = 0;
    app.courses_generator = null;
    app.savedCourseGenerator = "";
    if(loadHash != "first")
	app.fillSchedule(); // show empty while loading - don't need to on first load because it's already empty
    app.percent = "";

    document.getElementById("coursesBox").style.display = "none";
    document.getElementById("loadingCourses").style.display = "";
    //request new term to be loaded, and on success update UI
    app.termCacher.push(app.term, function(_loadHash){
	return function(courses){
	    // update UI
	    app.courses = courses;
	    app.genDivs();
	    app.fillSchedule();
	    app.fillSearch();
	    app.loadHash(_loadHash == "first");
	    var notes = document.getElementById("notes");
	    if(notes !== null)
		app.updateNotes(notes); // fix style in case notes have been cached
	};
    }(loadHash));
};

/**
 * app.genDivs(loadSelect = true)
 *
 * generate course selection box option list for manual and automatic mode
 * manual list is stored in app.courses_manual
 * auto list is stored in app.courses_auto
 *
 * @param {boolean} [loadSelect]
 *
 * @memberof app
 * @constant
 */
app.genDivs = function(loadSelect = true){
    app.courses_manual = "";
    for(var i = 0; i < app.courses.length; i++)
	app.courses_manual += '<option value="' + app.courses[i].index + '">' + app.courses[i].subject + ' ' + app.courses[i].courseNumber + (app.courses[i].sessionMod ? app.courses[i].sessionMod : "") + ': ' + app.courses[i].title + "</option>";
    app.courses_auto = "";
    for(var i=0; i < app.courses.length; ++i)
	if(i == 0 || (app.courses[i].subject + app.courses[i].courseNumber != app.courses[i-1].subject + app.courses[i-1].courseNumber))
	    app.courses_auto += '<option value="' + app.courses[i].index + '">' + app.courses[i].subject + ' ' + app.courses[i].courseNumber + ': ' + app.courses[i].title + "</option>";
    document.getElementById("coursesBox").style.display = "";
    document.getElementById("loadingCourses").style.display = "none";
};

/**
 * app.updateTerms()
 *
 * take the loaded terms values and display them in the term selection dropdown list
 * fired in mount.js
 *
 * @memberof app
 * @constant
 */
app.updateTerms = function(){
    var selectBox = document.getElementById("termSelect");
    while(selectBox.lastChild)
	selectBox.removeChild(selectBox.lastChild);
    for(var i = 0; i < app.terms.length; i++){
	var term = app.terms[i];
	var option = document.createElement("option");
	option.value = term.URLcode;
	option.innerText = term.title;
	selectBox.appendChild(option);
    }
    selectBox.value = app.term;
};

/**
 * app.updatePercent()
 *
 * update the percent message on screen
 * fired in librequests.js
 *
 * @memberof app
 * @constant
 */
app.updatePercent = function(){
    document.getElementById("loadingCourses").innerText = "Loading Courses... " + app.percent;
};

/**
 * app.updateNotes(noteBox)
 *
 * update the size of the notes box so it flexes with content
 *
 * @param {?Element} noteBox
 *
 * @memberof app
 * @constant
 */
app.updateNotes = function(noteBox){
    if(!noteBox)
	return;
    if(noteBox.style.height != (noteBox.scrollHeight+25)+'px'){
	noteBox.style.height='25px';
	noteBox.style.height=(noteBox.scrollHeight+25)+'px';
	app.saveMarker();
    }
};

/**
 * app.fillSearch(referrer = null)
 *
 * fills in the course selection box according to mode and search query
 *
 * @param {?Element} [referrer]
 *
 * @memberof app
 * @constant
 */
app.fillSearch = function(referrer = null) {
    var selectBox = document.getElementById("selectBox");
    var val = selectBox.value;
    selectBox.innerHTML = app.autoFilter(referrer);
    selectBox.value = val;
    app.hideSearch();
};

/**
 * app.autoFilter(referrer)
 *
 * returns the option list, dependent on mode
 * used to render course selection list
 *
 * @param   {?Element}         referrer
 *
 * @returns {string}
 *
 * @memberof app
 * @constant
 */
app.autoFilter = function(referrer){
    app.mode = referrer ? referrer.value : app.mode;
    return app.mode == "Manual" ? app.courses_manual : app.courses_auto;
};

/**
 * app.hideSearch(referrer = null)
 *
 * steps through each option in course selection box and hides it if the search string dictates
 *
 * @param {?HTMLElement} [referrer]
 *
 * @memberof app
 * @constant
 */
app.hideSearch = function(referrer = null) {
    if(referrer){
	app.closed = referrer.checked;
	location.hash = app.generateHash(false); // update url for closed value
    }
    var options = document.getElementById("selectBox").children;
    var search = document.getElementById("searchBox").value.toLowerCase();
    for(var i=1; i < options.length; ++i)
	options[i].style.display = app.filterSearch(app.courses[options[i].value], search) ? "" : "none";
};

/**
 * app.filterSearch(course, search)
 *
 * hideSearch but for a single option
 *
 * @param   {?Course} course   course to be acted on
 * @param   {string}  search   search string
 *
 * @returns {boolean}          should this course be shown?
 *
 * @memberof app
 * @constant
*/
app.filterSearch = function(course, search) {
    if(course === null)
	return false;
    if(app.selected.indexOf(course) !== -1) return false;
    if (!app.closed && (app.mode == "Manual" ? (course.seatsAvailable <= 0) : // if auto, check if it's possible to load in a full configuration
			 course.home.alts // grab alts -> [type:[c, c, c], type:[c, c, c]]
			 .map(altPack => altPack.map(c => c.seatsAvailable <= 0) // make alts into a closed field, value = closed -> [type:[true, false, false], type:[true, true, true]]
			      .reduce((acc, cur) => acc && cur, true)) // then pack each alt into "is every course closed = true" -> [type:[false], type:[true]]
			 .reduce((acc, cur) => acc || cur, false)) // then see if there's one alt type that has all sections closed - if so we know there's no way we can have a valid sched w/ this course
       ) return false;
    
    if(search && !(
	(course.subject + ' ' + course.courseNumber).toLowerCase().indexOf(search) > -1 ||
	    course.title.toLowerCase().indexOf(search) > -1 ||
	    course.URLcode.toString() == search // or exact URLcode number
    )) // not found in search
	return false; // this is done first because it's faster than constructing alts list
    
    if(app.mode == "Automatic"){
	if(course.home.alts.reduce(function(acc_list, cur){ // look all of course alts
	    return acc_list.concat(cur); // where cur is a typePack
	}, []).some(alt => app.selected.includes(alt))) // and check if any overlap with selected
	    return false;
    }
    
    return true;
};
