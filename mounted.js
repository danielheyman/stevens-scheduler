/* mounted.js
This file contains all one-time code for setting up the website. This includes:
-loading values from localStorage
-checking for CORS
-start loading courses
-setting up a few more complicated event listeners

This should be the last script to be loaded, as it depends on all other scripts to be loaded
*/

//defines
if(window.localStorage.lastSaved == undefined) window.localStorage.lastSaved = "";

//style first
if(window.localStorage.darkMode == undefined) window.localStorage.darkMode = "false";
var styleSlider = document.getElementById("styleSlider");
styleSlider.checked = window.localStorage.darkMode == "true";
change_style(styleSlider);

//then check browser cache for radio buttons and checkboxes, update accordingly
app.mode = document.getElementById("Manual").checked ? "Manual" : "Automatic";
app.closed = Boolean(app.getHash().split("&")[1]);
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
    var foundIdx = (app.getHash().split("=")[1] || "").split("&")[0].length ?  app.terms.map(el => el.URLcode).indexOf(app.getHash().split("=")[0].substr(1)) : -1;
    if ((app.getHash().split("=")[1] || "").split("&")[0].length && foundIdx > -1){ //need to load from url
	app.term = app.terms[foundIdx].URLcode;
	app.updateTerms();
	app.changedTerm("first");
    } else {
	app.term = app.terms[0].URLcode;
	app.updateTerms();
	app.changedTerm(false);
    }
    document.getElementById("termSelect").value = app.term;
    app.updateSaved();
});


// set up genNext / loop nextButton longpress controls
var nextButton = document.getElementById("nextButton");
let longpress = { // namespace reasons
    waiter: null,
    advanceNextButton: function(e){
	app.genNext(nextButton);
	longpress.waiter = setTimeout(longpress.advanceNextButton, 50);
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


// SIT only
// HeadUser - will throw a warning when not on the correct domain (during testing)
(function () { var hu = document.createElement("script"); hu.type = "text/javascript"; hu.async = true; hu.src = "//www.heeduser.com/supfiles/Script/widget.js"; var s = document.getElementsByTagName("script")[0]; s.parentNode.insertBefore(hu, s); })()
var _heeduser = {
    type: "button",
    community: "sitscheduler",
    url: "http://sitscheduler.heeduser.com",
    placement: "middle-right",
    color: "#202021",
    widget_layout: "full",
    sso_token: ""
}
var heeduser_url = _heeduser.url + "/FeedbackWidget/Widget.aspx?sso_token=" + encodeURIComponent(_heeduser.sso_token);
document.getElementById("feedback").innerHTML = '<a id="heeduser_wb" href="JavaScript:heeduser_openwidget(heeduser_url,\'' + _heeduser.widget_layout + '\')">Leave your feedback!</a>';
