/* UIsavebar.js
This file contains listeners and aux functions for everything 
directly related to the <div class="footer"> tag

In this file:

animator object
>contains functions needed for drag-drop rearranging saves
>also adds window.onmouseup and window.onmousedown listeners for animator

saveMarker()
>shows/hides everything in <div class="floatRight"> tag

updateSaved()
>renders in all the saved schedules buttons into the <div id="saves"> tag

save()
>saves the currently selected schedule

load()
>loads the selected saved schedule

discard()
>discards changes made to a loaded schedule

saveNew()
>saves the currently selected schedule into a new save

deleteSchedule()
>removes the saved schedule which the user is currently viewing

clear()
>clears the board and de-selects any currently selected schedules

showExport()
>generates and shows everything needed to share a schedule
*/

// everything needed to drag-drop rearrange saves
let animator = {
    element: undefined,
    down: function(element){ // used as onmousedown = animator.down(element);
	return function(e){
	    window.addEventListener('selectstart', animator.disableSelect); // don't question the weird closure
	    animator.element = element;
	    animator.element.style.position = "relative";
	    animator.startX = e.clientX;
	    animator.startY = e.clientY;
	    animator.startCenterX = animator.element.offsetLeft + animator.element.offsetWidth / 2;
	    animator.startCenterY = animator.element.offsetTop + animator.element.offsetHeight / 2;
	}
    },
    move: function(e){
	if(animator.element !== undefined){
	    animator.element.style.top = (e.clientY - animator.startY).toString() + "px";
	    animator.element.style.left = (e.clientX - animator.startX).toString() + "px";

	    let centerX = animator.element.offsetLeft + animator.element.offsetWidth / 2;
	    if(animator.element.nextSibling){
		let centerX_next = animator.element.nextSibling.offsetLeft + animator.element.nextSibling.offsetWidth / 2;
		if(centerX > centerX_next){
		    animator.element.parentNode.insertBefore(animator.element.nextSibling, animator.element);
		    animator.startX += (centerX-animator.startCenterX)
		    animator.startCenterX = centerX;
		    animator.element.style.left = (e.clientX - animator.startX).toString() + "px";
		}
	    }
	    if(animator.element.previousSibling){
		let centerX_last = animator.element.previousSibling.offsetLeft + animator.element.previousSibling.offsetWidth / 2;
		if(centerX < centerX_last){
		    animator.element.parentNode.insertBefore(animator.element, animator.element.previousSibling);
		    animator.startX += (centerX-animator.startCenterX)
		    animator.startCenterX = centerX;
		    animator.element.style.left = (e.clientX - animator.startX).toString() + "px";
		}
	    }
	}
    },
    up: function(e){
	if(animator.element !== undefined){
	    window.removeEventListener('selectstart', animator.disableSelect);
	    animator.element.style.top = "auto";
	    animator.element.style.left = "auto";
	    animator.element.style.position = "static";

	    if(Math.abs(e.clientX - animator.startX) > 5 || Math.abs(e.clientY - animator.startY) > 5){
		// need to rearrange localStorage.schedules
		var ordered_saves = document.getElementById("saves").children;
		var builder = [];
		for(var i=0; i<ordered_saves.length; ++i){ // recalculate
		    builder.push([ordered_saves[i].innerText, JSON.parse(window.localStorage.schedules)[ordered_saves[i].innerText]]);
		}
		var obj_builder = {};
		for(var i=0; i<builder.length; ++i){
		    obj_builder[builder[i][0]] = builder[i][1];
		}
		window.localStorage.schedules = JSON.stringify(obj_builder);
	    } else { // normal click
		var wrapper = animator.element.parentElement; // because changed() looks at style
		for(var i = 0; i < wrapper.children.length; ++i) // we need to do animator twice in case load gets interrupted
		    wrapper.children[i].classList.remove("preselect");
		animator.element.classList.add("preselect");
		var success = app.load(animator.element.innerText); // we need to update look after
		for(var i = 0; i < wrapper.children.length; ++i)
		    wrapper.children[i].classList.remove("preselect");
		if(success){ // else user declined
		    for(var i = 0; i < wrapper.children.length; ++i)
			wrapper.children[i].classList.remove("selected");
		    animator.element.classList.add("selected");
		    app.saveMarker();
		}
	    }
	    
	    animator.element = undefined;
	}
    },
    disableSelect: function(event){
	event.preventDefault();
    }
};
window.onmouseup = animator.up; // we need to go off the window in case user moves too fast where mouse isn't...
window.onmousemove = animator.move; // ...on element for one frame

// shows/hides everything in <div class="floatRight"> tag
app.saveMarker = function() {
    document.getElementById("marker-save").style.display = app.changed() && app.selected.length ? "" : "none";
    document.getElementById("marker-discard").style.display = app.changed() && app.currentstorage && app.selected.length ? "" : "none";
    document.getElementById("marker-saveAsNew").style.display = app.currentstorage ? "" : "none";
    document.getElementById("marker-delete").style.display = app.currentstorage ? "" : "none";
    document.getElementById("marker-export").style.display = app.selected.length ? "" : "none";
    document.getElementById("marker-new").style.display = (app.currentstorage || app.selected.length) ? "" : "none";
};

// renders in all the saved schedules buttons into the <div id="saves"> tag
app.updateSaved = function() {
    var schedules = Object.keys(JSON.parse(window.localStorage.schedules));
    if(!schedules.length)
	return;
    var saves = document.getElementById("saves");
    for(var i=0; i<saves.children.length; ++i){
	var save = saves.children[i];
	var index = schedules.findIndex(el => el == save.innerText);
	if(index == -1){ // need to remove
	    saves.removeChild(save); // remove child
	    --i; // and step back into it's index
	} else {
	    schedules.splice(index, 1); // track the ones we've already found
	}
    }
    for(var i=0; i<schedules.length; ++i){
	var div = document.createElement("div");
	div.className = "option draggable";
	div.innerText = schedules[i];
	saves.appendChild(div);
    }
    var options = saves.children;
    for(var i = 0; i<options.length; ++i){
	options[i].onmousedown = animator.down(options[i]);
    }
    for(var i=0; i<options.length; ++i){
	var option = options[i];
	if(app.currentstorage == option.innerText)
	    option.classList.add("selected");
	else
	    option.classList.remove("selected");
    }
    app.saveMarker();
};

// save schedule
app.save = function() {
    if(!app.currentstorage) {
        var name = window.prompt("Please enter a name for the schedule");
        if(!name) return;
        app.currentstorage = name;
    }
    //legacy GA                      
    ga('send', 'event', 'schedule', 'save');
    
    if(!window.localStorage.schedules) window.localStorage.setItem('schedules', '{}');
    var schedules = JSON.parse(window.localStorage.schedules);
    
    schedules[app.currentstorage] = app.generateHash(true);
    window.localStorage.setItem('schedules', JSON.stringify(schedules));
    window.localStorage.setItem('lastSaved', app.generateHash(false) + "!" + app.currentstorage);
    
    app.updateSaved();
};

// load schedule
app.load = function(schedule) {
    if(app.changed())
        if (!window.confirm("Are you sure you want to discard your changes?"))
	    return false;
    //legacy GA                             
    ga('send', 'event', 'schedule', 'load');
    app.currentstorage = schedule;
    document.getElementById("notes").value = JSON.parse(window.localStorage.schedules)[schedule].split("+")[1];
    app.disableOnHashChange = true;
    location.hash = JSON.parse(window.localStorage.schedules)[schedule].split("+")[0];
    var currentTerm = app.getHash().split("=")[0].substr(1);
    var foundIdx = app.terms.map(term => term.URLcode).indexOf(currentTerm);
    if (foundIdx > -1){ // make sure term is valid
        if(app.term != app.terms[foundIdx].URLcode) { // need to switch term
	    app.term = app.terms[foundIdx].URLcode;
	    app.updateTerms();
	    app.changedTerm(true);
        } else { // already on correct term
	    app.course = null;
	    document.getElementById("selectBox").value = "";
	    app.updateTerms();
	    app.loadHash(); // just an optimization hack - function found in UIright.js
        }
    }
    app.updateNotes(document.getElementById("notes")); // fix style in case notes have been cached
    app.fillSchedule();
    window.localStorage.setItem('lastSaved', app.generateHash(false) + "!" + app.currentstorage);
    return true;
};

// discard changes to a schedule
app.discard = function() {
    if(app.changed())
	if (!window.confirm("Are you sure you want to discard your changes?"))
	    return;
    //legacy GA                                
    ga('send', 'event', 'schedule', 'discard');
    var schedule = app.currentstorage;
    app.currentstorage = null;
    app.load(schedule);
    window.localStorage.setItem('lastSaved', "{}");
};

// creates a new schedule from an old schedule
app.saveNew = function() {
    ga('send', 'event', 'schedule', 'save-new');
    app.currentstorage = null;
    app.save();
};

// deletes a saved schedule
app.deleteSchedule = function() {
    if (window.confirm("Are you sure you want to delete the schedule " + app.currentstorage + "?")) {
        var schedules = JSON.parse(window.localStorage.schedules);
        delete schedules[app.currentstorage];
        window.localStorage.setItem('schedules', JSON.stringify(schedules));
        app.clear(true);
	app.updateSaved();
	app.fillSchedule();
	window.localStorage.setItem('lastSaved', "{}");
    }
};

// clears the board and deselects a saved schedule, if selected
app.clear = function(bypass = false, share = false) {
    // bypass is true when recieving a shared schedule or when deleting a schedule (the latter so messages make sense to user)
    if(!bypass && app.changed()){ // don't confirm on bypass
        if (!window.confirm("Are you sure you want to discard your changes?")){
	    location.hash = app.generateHash(false);
	    return false;
	}
    }
    ga('send', 'event', 'schedule', 'new');
    document.getElementById("selectBox").value = "";
    app.course_list_selection = 0;
    var range = document.getElementById('Range');
    range.max = 0;
    range.value = 0;
    app.courses_generator = null;
    app.savedCourseGenerator = "";
    if(!share) // on share, keep hash the same
	location.hash = "";
    document.getElementById("notes").value = "";
    app.course = null;
    app.selected = [];
    app.currentstorage = null;
    app.updateSaved();
    app.fillSchedule();
    app.hideSearch();
    window.localStorage.setItem('lastSaved', "{}");
    return true;
};

// generates everything needed to share a schedule
app.showExport = function(){
    document.getElementById("export").style.display = "";
    document.getElementById("export-link").value = location.href;
    document.getElementById("export-text").value = app.selected.map(function(c) { return c.courseRegistrationCode + ': ' + c.subject + ' ' + c.courseNumber }).join('\n');
};
