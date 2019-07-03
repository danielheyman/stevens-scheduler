/* UIright.js
This file contains listeners and aux functions directly responsible for updating
the contents of <div class="right">. This includes terms, notes, mode selection,
and course selection.
This does NOT include webclass rendering. That's in UIschedule.js for continuity

In this file:

totalCredits()
>returns an integer value representing the total number of credits for all
>selected courses combined

updateCredits()
>Updates the "Total Credits" span according to totalCredits()

autoBar()
>Shows/hides automatic selection bar

genNext()
>Listener for the "Next" button in automatic mode. Calls out to selectionLogic.js to generate
>the next valid schedule, or loop. Also updates UI accordingly

changedTerm()
>Listener for the term selectionn box. Upon change, will load the new term and update the UI accordingly

genDivs()
>Generates two lists of divs used in automatic&manual mode which are placed in the main course selection box

updateTerms()
>Fills the term selection dropdown list

updatePercent()
>Update the current percent message

updateNotes()
>Listener for the notes textbox, will stretch or shrink the box according to the text within

fillSearch()
>Fills the course selection box

>autoFilter()
>Filters out courses from the course selection box depending on the current mode

hideSearch()
>Filters out options from the course selection box depending on their filterSearch valie

filterSearch()
>Filters out a single option from the course selection box if the current search
>query should filter it out

loadHash()
>Load the URL hash value into the schedule. Primarily used when recieving a schedule shared by URL
*/

// adds up the credit values of all selected courses and returns it as an integer
app.totalCredits = function(){
    return this.selected.reduce(function(acc, cur){
	return acc+cur.credits;
    }, 0);
};

// updates the "Total Credits" counter
app.updateCredits = function() {
    document.getElementById("credits").innerText = this.totalCredits();
};

// shows or hides the automatic selection bar depending on the mode and number of courses selected
app.autoBar = function(){
    var autoBar = document.getElementById("autoBar");
    autoBar.style.display = this.mode == 'Automatic' && this.selected.concat(app.courses[this.course])[0] != null ? "inline-block" : "none";
    document.getElementById('nextButton').innerText='Next';
};

// generates and displays the next valid schedule in automatic mode
app.genNext = function(button){
    if(app.courses_generator && app.courses_generator.get(app.courses_generator.data ? app.courses_generator.data.length : 0)){ // see if there's another valid schedule we haven't seen yet
	this.course_list_selection = (app.courses_generator.data ? app.courses_generator.data.length : 0)-1; // and show it to us
    } else { // done - start looping
	this.course_list_selection++;
	this.course_list_selection%=(app.courses_generator ? app.courses_generator.data.length : 0);
    }
    this.fillSchedule();
    var range = document.getElementById("Range");
    range.max = app.courses_generator ? app.courses_generator.data.length-1 : 0;
    range.value = this.course_list_selection;

    button.innerText = (app.courses_generator ? app.courses_generator.done : false) ? "Loop" : "Next";
};

// listener for term selection box
// loads in new term (see librequests.js) and places courses in course selection box
// if loadHash is true, then render app.selected
// if loadHash is "first", render from URL hash
app.changedTerm = function(loadHash = false, referrer = null){
    if(!loadHash && referrer && this.changed())
        if (!window.confirm("Are you sure you want to discard your changes?")){
	    document.getElementById("termSelect").value = this.term;
	    return false;
	}
    if(this.currentstorage && loadHash != true)
	if(!this.clear()){ // user declined - fix selection box then return
	    document.getElementById("termSelect").value = this.term;
	    return;
	}
    if(referrer){
	if(referrer.firstChild.value == "") // clean up on first get
	    referrer.removeChild(referrer.firstChild);
	this.term = referrer.value;
    }
    if(!this.term)
	return; // empty
    this.course = null;
    document.getElementById("selectBox").value = "";
    document.getElementById("searchBox").value = "";
    this.selected = [];
    this.course_list_selection = 0;
    var range = document.getElementById('Range');
    range.max = 0;
    range.value = 0;
    app.courses_generator = null;
    this.savedCourseGenerator = "";
    if(loadHash != "first")
	this.fillSchedule(); // show empty while loading - don't need to on first load because it's already empty
    this.percent = "";

    document.getElementById("coursesBox").style.display = "none";
    document.getElementById("loadingCourses").style.display = "";
    //request new term to be loaded, and on success update UI
    app.termCacher.push(this.term, function(_loadHash){
	return function(courses){
	    // update UI
	    app.updateNotes(document.getElementById("notes")); // fix style in case notes have been cached
	    app.courses = courses;
	    app.genDivs();
	    if(_loadHash)
		app.loadHash(_loadHash === "first");
	    app.fillSchedule();
	    app.fillSearch();
	}
    }(loadHash));
};

// generate course selection box option list for manual and automatic mode
// manual list is stored in app.courses_manual
// auto list is stored in app.courses_auto
app.genDivs = function(loadSelect = true){
    var courses_auto = app.courses.reduce(function(acc, cur){
	if(acc.length > 0){
	    if(cur.subject + cur.courseNumber != acc[acc.length-1].subject + acc[acc.length-1].courseNumber){
		return acc.concat(cur); // add new
	    } else {
		return acc; // ignore duplicate
	    }
	} else {
	    return [cur]; // first iteration - set up accumulator
	}
    }, []);
    app.courses_manual = [];
    for(var i = 0; i < app.courses.length; i++){
	var c = app.courses[i];
	var el = document.createElement("option");
	el.textContent = c.subject + ' ' + c.courseNumber + ': ' + c.title;
	el.value = c.index;
	app.courses_manual.push(el);
    }
    app.courses_auto = [];
    for(var i = 0; i < courses_auto.length; i++){
	var c = courses_auto[i];
	var el = document.createElement("option");
	el.textContent = c.subject + ' ' + c.courseNumber + ': ' + c.title;
	el.value = c.index;
	app.courses_auto.push(el);
    }
    document.getElementById("coursesBox").style.display = "";
    document.getElementById("loadingCourses").style.display = "none";
};

// take the loaded terms values and display them in the term selection dropdown list
// fired in mount.js
app.updateTerms = function(){
    var selectBox = document.getElementById("termSelect");
    while(selectBox.lastChild)
	selectBox.removeChild(selectBox.lastChild);
    for(var i = 0; i < this.terms.length; i++){
	var term = this.terms[i];
	var option = document.createElement("option");
	option.value = term.URLcode;
	option.innerText = term.title;
	selectBox.appendChild(option);
    }
    selectBox.value = this.term;
};

// update the percent message on screen
// fired in librequests.js
app.updatePercent = function(){
    document.getElementById("loadingCourses").innerText = "Loading Courses... " + this.percent;
};

// update the size of the notes box so it flexes with content
app.updateNotes = function(noteBox){
    noteBox.style.height='25px';
    noteBox.style.height=(noteBox.scrollHeight+25)+'px';
    this.saveMarker();
};

// fills in the course selection box according to mode and search query
app.fillSearch = function(referrer) {
    var selectBox = document.getElementById("selectBox");
    var val = selectBox.value;
    while(selectBox.lastChild.value != "")
	selectBox.removeChild(selectBox.lastChild);
    var courses = this.autoFilter(app.courses, referrer);
    for(var i = 0; i < courses.length; i++)
	selectBox.appendChild(courses[i]);
    selectBox.value = val;
    this.hideSearch();
};

// returns the option list, dependent on mode
// used to render course selection list
app.autoFilter = function(courses, referrer){
    this.mode = referrer ? referrer.value : this.mode;
    return this.mode == "Manual" ? app.courses_manual : app.courses_auto;
};

// steps through each option in course selection box and hides it if the search string dictates
app.hideSearch = function(referrer) {
    if(referrer){
	this.closed = referrer.checked;
	location.hash = app.generateHash(false); // update url for closed value
    }
    var options = document.getElementById("selectBox").children;
    var search = document.getElementById("searchBox").value.toLowerCase();
    for(var i=1; i < options.length; ++i)
	options[i].style.display = this.filterSearch(app.courses[options[i].value], search) ? "" : "none";
};

// hideSearch but for a single option
app.filterSearch = function(course, search) {
    if(this.selected.indexOf(course) !== -1) return false;
    if (!this.closed && !course.seatsAvailable) return false;
    
    if(search && !(
	(course.subject + ' ' + course.courseNumber).toLowerCase().indexOf(search) > -1 ||
	    course.title.toLowerCase().indexOf(search) > -1 ||
	    course.URLcode.toString() == search // or exact URLcode number
    )) // not found in search
	return false; // this is done first because it's faster than constructing alts list
    
    if(this.mode == "Automatic"){
	if(course.home.alts.reduce(function(acc_list, cur){ // look all of course alts
	    return acc_list.concat(cur); // where cur is a typePack
	}, []).some(alt => this.selected.includes(alt))) // and check if any overlap with selected
	    return false;
    }
    
    return true;
};
