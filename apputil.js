/* apputil.js
This file contains a few app functions that are often in many other files.


In this file:

app.generateHash()
>generates a hash value string containing all information about a given schedule
>used for sharing URLs and saving schedules

app.changed()
>checks if the user has selected a saved schedule,
>and if there is any deviation between that saved schedule and what is actually on the board
>ie, modified but not yet saved

autoInAlts()
>check if two sections are of the same course (ex: MATH 101 lab and MATH 101 lecture)
*/

// generates hash string with all important schedule values included
// the hash will take the form of the following:
//     TERMCODE=CRN,CRN,CRN&IFCLOSED+NOTES
//   example:
//     201990=76589,76609,76710&C
//     this means term code 201990
//                selected courses are 76589,76609,76710
//                and we're showing closed courses
// if includeNotes is set to true (used for saving schedules),
// they are appended at the end of the hash, after a "+"
app.generateHash = function(includeNotes) {
    var hash = this.term + "=";
    hash += this.selected.map(function(s){
	return s.URLcode;
    }).sort((a, b) => parseInt(a)-parseInt(b)).join();
    if(this.closed)
	hash += "&C";
    if(includeNotes === true)
	hash += "+" + document.getElementById("notes").value;
    return hash;
};


// detects change from saved schedule
// this is done be first checking if there's a saved schedule selected
// then comparing the hash values of the two
app.changed = function(){
    if(this.selected.length == 0)
	return false;
    var saves = document.getElementById("saves").children; // first find if any saves are selected
    var ret = true;
    var foundIdx = -1; // this has to be done manually because Dom Collections don't have it
    for(var i=0; i < saves.length; ++i)
	if(saves[i].classList.contains("selected")) // this will be BEFORE render change
	    foundIdx = i;
    if(foundIdx > -1)
	ret = this.localStorage[saves[foundIdx].innerText] != this.generateHash(true);
    //save coming from, vs actual classes on the board
    else // edge case - if we're coming from no save selected and it happens to be the same
	for(var i=0; i < saves.length; ++i)
	    if(saves[i].classList.contains("preselect")) // this will be AFTER render change
		ret = this.localStorage[saves[i].innerText] != this.generateHash(true);
    // we need to split this up, because if we're going from one schedule to another schedule,
    // there would otherwise be no way to compare the two, or even see if we're going to
    // one and coming from another
    return ret;
};

// check if check_course exists within the alts of course_alts, but ONLY if we're in automatic mode
app.autoInAlts = function(check_course, course_alts){ // pretty much just fixes a render bug
    if(check_course == null || course_alts == null)
	return false; // if there's one or zero, we don't even need to check
    if(this.mode == "Manual")
	return check_course == course_alts;
    return check_course.home == course_alts.home; // automatic - if check_course is course_alts or is in its alts
};


