/* apputil.js
This file contains a few app functions that are often in many other files.


In this file:

app.generateHash()
>generates a hash value string containing all information about a given schedule
>used for sharing URLs and saving schedules

app.getHash()
>get the current location.hash with decodeURIComponent

app.changed()
>checks if the user has selected a saved schedule,
>and if there is any deviation between that saved schedule and what is actually on the board
>ie, modified but not yet saved

app.autoInAlts()
>check if two sections are of the same course (ex: MATH 101 lab and MATH 101 lecture)
*/


/**
 * generateHash(includeNotes)
 * 
 * generates hash string with all important schedule values included
 * the hash will take the form of the following:
 *     TERMCODE=CRN,CRN,CRN&IFCLOSED+NOTES
 *   example:
 *     201990=76589,76609,76710&C
 *     this means term code 201990
 *                selected courses are 76589,76609,76710
 *                and we're showing closed courses
 * if includeNotes is set to true (used for saving schedules),
 * they are appended at the end of the hash, after a "+"
 *
 * Additionally, after each CRN, if the course is locked, append a !
 *
 * @param   {boolean}  includeNotes  Add notes to return
 * @returns {string}                 Hash
 *
 * @memberOf app
 * @constant
 */
app.generateHash = function(includeNotes) {
    var hash = app.term + "=";
    var selected = app.selected;
    if(app.mode === "Automatic" && app.courses_generator && app.courses_generator.data && app.courses_generator.data[app.course_list_selection])
	selected = app.courses_generator.data[app.course_list_selection].selected;
    hash += selected.sort((a, b) => a.URLcode - b.URLcode).map(function(s){
	return s.URLcode + (Boolean(s.locked) ? "!" : "");
    }).join();
    if(app.closed)
	hash += "&C";
    if(includeNotes === true)
	hash += "+" + document.getElementById("notes").value;
    return hash;
};

/**
 * app.getHash()
 *
 * gets the current location.hash with decodeURIComponent
 *
 * @returns {string}
 * @memberOf app
 * @constant
 */
app.getHash = function(){
    return decodeURIComponent(location.hash);
};

/**
 * app.changed()
 *
 * detects change from saved schedule
 * this is done be first checking if there's a saved schedule selected
 * then comparing the hash values of the two
 *
 * @returns {boolean}
 * @memberOf app
 * @constant
 */
app.changed = function(){
    if(app.selected.length == 0)
	return false;
    var saves = document.getElementById("saves").children; // first find if any saves are selected
    var ret = true;
    var foundIdx = -1; // this has to be done manually because Dom Collections don't have it
    for(var i=0; i < saves.length; ++i)
	if(saves[i].classList.contains("selected")) // this will be BEFORE render change
	    foundIdx = i;
    if(foundIdx > -1)
	ret = JSON.parse(window.localStorage.schedules)[saves[foundIdx].innerText] != app.generateHash(true);
    //save coming from, vs actual classes on the board
    else // edge case - if we're coming from no save selected and it happens to be the same
	for(var i=0; i < saves.length; ++i)
	    if(saves[i].classList.contains("preselect")) // this will be AFTER render change
		ret = JSON.parse(window.localStorage.schedules)[saves[i].innerText] != app.generateHash(true);
    // we need to split this up, because if we're going from one schedule to another schedule,
    // there would otherwise be no way to compare the two, or even see if we're going to
    // one and coming from another
    return ret;
};

/**
 * app.autoInAlts(check_course, course_alts)
 *
 * check if check_course exists within the alts of course_alts, but ONLY if we're in automatic mode
 *
 * @param {?Course}   check_course
 * @param {?Course}   course_alts
 * @returns {boolean}
 *
 * @memberOf app
 * @constant
 */
app.autoInAlts = function(check_course, course_alts){ // pretty much just fixes a render bug
    if(check_course == null || course_alts == null)
	return false; // if there's one or zero, we don't even need to check
    if(app.mode == "Manual")
	return check_course == course_alts;
    return check_course.home == course_alts.home; // automatic - if check_course is course_alts or is in its alts
};


