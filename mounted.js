/* mounted.js
This file contains all one-time code for setting up the website. This includes:
-loading values from localStorage
-checking for CORS
-start loading courses
-setting up a few more complicated event listeners

This should be the last script to be loaded, as it depends on all other scripts to be loaded
*/

//style first
if(localStorage.darkMode == undefined) localStorage.darkMode = "false";
var styleSlider = document.getElementById("styleSlider");
styleSlider.checked = localStorage.darkMode == "true";
change_style(styleSlider);

//then check browser cache for radio buttons and checkboxes, update accordingly
app.mode = document.getElementById("Manual").checked ? "Manual" : "Automatic";
app.closed = Boolean(location.hash.split("&")[1]);
document.getElementById("closedCheck").checked = app.closed;

//check CORS
(new Searcher("test")).start(function(success){
    if(success){
	document.getElementById("loading").style.display = "none";
	document.getElementById("main").style.display = "";
    } else {
	document.getElementById("loading").style.display = "none";
	document.getElementById("cors").style.display = "";
    }
});

//load terms -> then load courses and everything else
(new Searcher("terms")).start(function(response){
    app.terms = app_config.PROCESSgetTerms(response);
    if (location.hash.match(/#\d+=[\d+,?]+/) && (index = app.terms.map(el => el.URLcode).indexOf(location.hash.split("=")[0].substr(1))) > -1){ //need to load from url
	app.term = app.terms[index].URLcode;
	app.updateTerms();
	app.changedTerm("first");
    } else {
	app.term = app.terms[0].URLcode;
	app.updateTerms();
	app.changedTerm(false);
    }
    document.getElementById("termSelect").value = app.term;
    if(localStorage.schedules)
	app.localStorage = JSON.parse(localStorage.schedules);
    app.updateSaved();
});


// set up genNext / loop nextButton longpress controls
var nextButton = document.getElementById("nextButton");
let longpress = { // namespace reasons
    waiter: null,
    advanceNextButton: function(e){
	app.genNext(nextButton);
	longpress.waiter = setTimeout(longpress.advanceNextButton, 50); // no idea why this.waiter doesn't work
    },
    pressingDown: function(e){
	app.genNext(nextButton);
	longpress.waiter = setTimeout(longpress.advanceNextButton, 750);
    },
    notPressingDown: function(e){
	clearTimeout(longpress.waiter);
	longpress.waiter = null;
    }
}

// Listening for the mouse and touch events    
nextButton.addEventListener("mousedown", longpress.pressingDown, false);
nextButton.addEventListener("mouseup", longpress.notPressingDown, false);
nextButton.addEventListener("mouseleave", longpress.notPressingDown, false);

nextButton.addEventListener("touchstart", longpress.pressingDown, false);
nextButton.addEventListener("touchend", longpress.notPressingDown, false);
