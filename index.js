/* index.js
This file contains code to fill tedious tables so that index.html isn't unreadably long
It also does some config things to make developing for other colleges easier

Anon functions are used when needed so things don't pollute the global namespace
*/

//config.js stuff
document.title = app_config.siteTitle;
if(app_config.CORStest === true){
    document.getElementById("cors").innerHTML = 'Hi, and welcome to ' + app_config.siteTitleShort + '! This is a tool for creating, editing, testing, and sharing schedules for ' + app_config.collegeName + '.<br>' +
	'<br>' +
	'I can see you\'re locked out of the ' + app_config.collegeNameShort + ' systems. Unfortunately, there isn\'t anything the developer can do about this problem. This is because ' + app_config.collegeNameShort + ' won\'t recognize this website as friendly.<br>' +
	'<b>In order to use this tool, please download and use a CORS-everywhere extension</b> and refresh. This intercepts data coming from ' + app_config.collegeNameShort + '\'s servers and makes your browser think ' + app_config.collegeNameShort + ' trusts us, so that your browser doesn\'t lock you out. Here are a few I recommend:<br>' +
	'<a href="https://addons.mozilla.org/en-US/firefox/addon/cors-everywhere/">Firefox</a><br>' +
	'For Chrome, it\'s a bit more envolved. See <a href="https://www.codevoila.com/post/75/how-to-disable-same-origin-policy-in-chrome">this</a> for more details.' +
	'<br>' +
	'NOTE: it is technically unsafe to browse with CORS-everywhere enabled. Please, disable it when not using this tool.<br>' +
	'<br><b>' + app_config.CORScustom + '</b>';
} else {
    document.getElementById("cors").innerHTML = 'Hi, and welcome to ' + app_config.siteTitleShort + '! This is a tool for creating, editing, testing, and sharing schedules for ' + app_config.collegeName + '.<br>' +
	'<br>' +
	'<b>The ' + app_config.collegeNameShort + ' servers seem to be down right now. Check back later.</b><br>' +
	'<br>' +
	'If you\'re a developer, this might be a CORS related issue.';
}

// thead - fill with days of the week
// see comment in index.html within <td id="schedThead">
(function(){
    var thead = document.getElementById("schedThead");
    var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    for(var i=0; i<days.length; ++i){
	var day = days[i];
	var td = document.createElement("th");
	td.innerText = day;
	thead.appendChild(td);
    }
})();

// tbody - fill with lots of stuff
// see commend in <tbody id="schedTbody">
(function(){
    var tbody = document.getElementById("schedTbody");
    var hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    var days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    var tr_template = document.createElement("tr"); // CSS says Saturday & Sunday are hidden
    var td0 = document.createElement("td");
    td0.className = "time";
    //td0.innerText = ((hour - 1) % 12 + 1) + ':00'; - set later
    tr_template.appendChild(td0);

    var td_template = document.createElement("td");
    td_template.className = "block";
    var div0 = document.createElement("div");
    div0.className = "wrapper";
    var div00 = document.createElement("div");
    div00.className = "wrapperInternal";
    //div00.data-hour = hour, div00.data-day = day - set later
    div0.appendChild(div00);
    div0.appendChild(document.createElement("div"));
    div0.appendChild(document.createElement("div"));
    td_template.appendChild(div0);
    
    for(var i=0; i<hours.length; ++i){
	var hour = hours[i];
	var tr = tr_template.cloneNode(true);
	tr.firstChild.innerText = ((hour - 1) % 12 + 1) + ':00';
	for(var j=0; j<days.length; ++j){
	    var day = days[j];
	    var td = td_template.cloneNode(true);
	    td.firstChild.firstChild.setAttribute("data-hour", hour);
	    td.firstChild.firstChild.setAttribute("data-day", day);
	    tr.appendChild(td);
	}
	tbody.appendChild(tr);
    }
})();

// Hide Saturday and Sunday - will be shown on request
(function(){
    var ths = document.getElementById("schedThead").children;
    ths[6].style.display = "none";
    ths[7].style.display = "none";
    var trs = document.getElementById("schedTbody").children;
    for(var i=0; i<trs.length; ++i){
	trs[i].children[6].style.display = "none";
	trs[i].children[7].style.display = "none";
    }
})();

/** window.onresize
 * 
 * Watches for content in weekTable body to be overflowing - IE there's a scrollbar
 * If so, add some padding to header compensate and keep looking good
 */
window.onresize = function(){
    let w = document.getElementById("weekTableWrapper");
    document.getElementById("weekTableHead").style.borderRight = (w.offsetWidth - w.clientWidth).toString() + "px solid " + getComputedStyle(document.getElementById("schedThead")).backgroundColor;
};
