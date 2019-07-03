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
    down: function(ref){ // used as onmousedown = animator.down(element);
	return function(element){
	    return function(e){
		window.addEventListener('selectstart', animator.disableSelect); // don't question the weird closure
		ref.element = element;
		ref.element.style.position = "relative";
		ref.startX = e.clientX;
		ref.startY = e.clientY;
		ref.startCenterX = ref.element.offsetLeft + ref.element.offsetWidth / 2;
		ref.startCenterY = ref.element.offsetTop + ref.element.offsetHeight / 2;
	    }
	}
    }(this),
    move: function(e){
	if(this.element !== undefined){
	    this.element.style.top = (e.clientY - this.startY).toString() + "px";
	    this.element.style.left = (e.clientX - this.startX).toString() + "px";

	    let centerX = this.element.offsetLeft + this.element.offsetWidth / 2;
	    if(this.element.nextSibling){
		let centerX_next = this.element.nextSibling.offsetLeft + this.element.nextSibling.offsetWidth / 2;
		if(centerX > centerX_next){
		    this.element.parentNode.insertBefore(this.element.nextSibling, this.element);
		    this.startX += (centerX-this.startCenterX)
		    this.startCenterX = centerX;
		    this.element.style.left = (e.clientX - this.startX).toString() + "px";
		}
	    }
	    if(this.element.previousSibling){
		let centerX_last = this.element.previousSibling.offsetLeft + this.element.previousSibling.offsetWidth / 2;
		if(centerX < centerX_last){
		    this.element.parentNode.insertBefore(this.element, this.element.previousSibling);
		    this.startX += (centerX-this.startCenterX)
		    this.startCenterX = centerX;
		    this.element.style.left = (e.clientX - this.startX).toString() + "px";
		}
	    }
	}
    },
    up: function(e){
	if(this.element !== undefined){
	    window.removeEventListener('selectstart', animator.disableSelect);
	    this.element.style.top = "auto";
	    this.element.style.left = "auto";
	    this.element.style.position = "static";

	    if(Math.abs(e.clientX - this.startX) > 5 || Math.abs(e.clientY - this.startY) > 5){
		//rearrange localStorage and then app.localStorage
		var entries = Object.entries(JSON.parse(localStorage.schedules)); // [[name, hash], ...]
		var order = this.element.parentNode.children;
		var builder = [];
		for(var i=0; i<order.length; ++i)
		    builder.push(entries.filter(e => e[0] == order[i].innerText)[0]); // no two saves share a name
		localStorage.schedules = JSON.stringify(Object.fromEntries(builder));
		app.localStorage = JSON.parse(localStorage.schedules);
	    } else { // normal click
		var wrapper = this.element.parentElement; // because changed() looks at style
		for(var i = 0; i < wrapper.children.length; ++i) // we need to do this twice in case load gets interrupted
		    wrapper.children[i].classList.remove("preselect");
		this.element.classList.add("preselect");
		var success = app.load(this.element.innerText); // we need to update look after
		for(var i = 0; i < wrapper.children.length; ++i)
		    wrapper.children[i].classList.remove("preselect");
		if(success){ // else user declined
		    for(var i = 0; i < wrapper.children.length; ++i)
			wrapper.children[i].classList.remove("selected");
		    this.element.classList.add("selected");
		    app.saveMarker();
		}
	    }
	    
	    this.element = undefined;
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
    document.getElementById("marker-save").style.display = this.changed() && this.selected.length ? "" : "none";
    document.getElementById("marker-discard").style.display = this.changed() && this.currentstorage && this.selected.length ? "" : "none";
    document.getElementById("marker-saveAsNew").style.display = this.currentstorage ? "" : "none";
    document.getElementById("marker-delete").style.display = this.currentstorage ? "" : "none";
    document.getElementById("marker-export").style.display = this.selected.length ? "" : "none";
    document.getElementById("marker-new").style.display = this.selected.length ? "" : "none";
};

// renders in all the saved schedules buttons into the <div id="saves"> tag
app.updateSaved = function() {
    if(!this.localStorage)
	return;
    var schedules = Object.keys(app.localStorage);
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
    this.saveMarker();
};

// save schedule
app.save = function() {
    if(!this.currentstorage) {
        var name = window.prompt("Please enter a name for the schedule");
        if(!name) return;
        this.currentstorage = name;
    }
    
    if(!localStorage.schedules) localStorage.setItem('schedules', JSON.stringify({}));
    var schedules = JSON.parse(localStorage.schedules);

    if(schedules[this.currentstorage] == undefined)
	gtag('event', 'Schedules Created');
    
    schedules[this.currentstorage] = this.generateHash(true);
    localStorage.setItem('schedules', JSON.stringify(schedules));
    this.localStorage = schedules;
    localStorage.setItem('lastSaved', this.generateHash(false) + "!" + this.currentstorage);
    
    this.updateSaved();
    gtag('event', 'Schedules Saved');
};

// load schedule
app.load = function(schedule) {
    if(this.changed())
        if (!window.confirm("Are you sure you want to discard your changes?"))
	    return false;
    this.currentstorage = schedule;
    document.getElementById("notes").value = this.localStorage[schedule].split("+")[1];
    location.hash = this.localStorage[schedule].split("+")[0];
    var currentTerm = location.hash.split("=")[0].substr(1);
    if ((index = this.terms.map(term => term.URLcode).indexOf(currentTerm)) > -1){ // make sure term is valid
        if(this.term != this.terms[index].URLcode) {
	    this.term = this.terms[index].URLcode;
	    this.updateTerms();
	    this.changedTerm(true);
        } else {
	    this.course = null;
	    document.getElementById("selectBox").value = "";
	    this.updateTerms();
	    this.loadHash(); // just an optimization hack - function found in UIright.js
        }
    }
    this.updateNotes(document.getElementById("notes")); // fix style in case notes have been cached
    this.fillSchedule();
    localStorage.setItem('lastSaved', this.generateHash(false) + "!" + this.currentstorage);
    return true;
};

// discard changes to a schedule
app.discard = function() {
    if(this.changed())
	if (!window.confirm("Are you sure you want to discard your changes?"))
	    return;
    var schedule = this.currentstorage;
    this.currentstorage = null;
    this.load(schedule);
    localStorage.setItem('lastSaved', JSON.stringify({}));
};

// creates a new schedule from an old schedule
app.saveNew = function() {
    this.currentstorage = null;
    this.save();
};

// deletes a saved schedule
app.deleteSchedule = function() {
    if (window.confirm("Are you sure you want to delete the schedule " + this.currentstorage + "?")) {
        var schedules = JSON.parse(localStorage.schedules);
        delete schedules[this.currentstorage];
        localStorage.setItem('schedules', JSON.stringify(schedules));
        this.localStorage = schedules;
        this.clear(true);
	this.updateSaved();
	this.fillSchedule();
	localStorage.setItem('lastSaved', JSON.stringify({}));
    }
};

// clears the board and deselects a saved schedule, if selected
app.clear = function(bypass = false) {
    if(!bypass && this.changed())
        if (!window.confirm("Are you sure you want to discard your changes?"))
	    return false;
    document.getElementById("selectBox").value = "";
    this.course_list_selection = 0;
    var range = document.getElementById('Range');
    range.max = 0;
    range.value = 0;
    app.courses_generator = null;
    this.savedCourseGenerator = "";
    location.hash = "";
    document.getElementById("notes").value = "";
    this.course = null;
    this.selected = [];
    this.currentstorage = null;
    this.updateSaved();
    this.fillSchedule();
    this.hideSearch();
    localStorage.setItem('lastSaved', JSON.stringify({}));
    return true;
};

// generates everything needed to share a schedule
app.showExport = function(){
    document.getElementById("export").style.display = "";
    document.getElementById("export-link").value = location.href;
    document.getElementById("export-text").value = this.selected.map(function(c) { return c.URLcode + ': ' + c.subject + ' ' + c.courseNumber }).join('\n');
};
