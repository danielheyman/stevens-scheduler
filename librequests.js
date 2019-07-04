/* librequests.js
Provides an interface for talking to the course data server

In this file:

string server(string)
>URL prefix for all requests

void preProcessDataPack(dataPack_object)
>Takes a freshly loaded JSON object for a large course request and strips out unwanted data
>Uses references to do this in place

[courses_object...] postProcessCourses([courses_object...])
>For each course in the list, remove or modify it to fit in line
*/

// Prepends common URL prefix
let server = function(h) { return app_config.URLprefix + h; };

// after a term is fully loaded, all courses are extracted and ran through here
// a few important steps are taken:
// 1) if a course has no meeting times, get rid of it
// 2) if a course is a honors section, remove the honors in the scheduleTypeDescription
//    this allows honors sections to still appear as honors but render like normal courses
// 3) build alts list
//    this step is important for automatic mode
//    this will take all classes with the same number (ex: MATH 101)
//    then seperate them into lectures, labs, recitation, workshops, ect.
//    and place those in a list of [[lecture...],[lab...],[rec...]]
//    then, link that list in the FIRST course of that name
//    and for all other courses, add a .home member which points to that first course
// 4) add an index to each course
//    this is done because HTML <selection>s don't support objects in <option>s
//    so, instead we store the index of the course and when we pull it out, look in the big list by index
let postProcessCourses = function(courses){
    return courses
	.filter(function(course){ // remove courses that don't have a scheduled time / can't be shown on the board
	    return course.meetings.reduce(function(acc, cur){
		return acc||["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].reduce((_acc,_cur)=>_acc||cur[_cur], false)||cur.building=="ONLINE";
	    }, false);
	})
	.map(function(course){ // fix honors vs non-honors courses
	    // this fixes a bug where autoConstruct would assume we want both
            // normal and Honors courses like strict co-reqs (similar to Labs and Recs)
	    if(course.scheduleTypeDescription.includes("Honors "))
		course.scheduleTypeDescription = course.scheduleTypeDescription.split("Honors ")[1];
	    return course;
	})
    // now, start constructing alts list
	.reduce(function(acc, cur){ // collect all courses into lists of same subject + number (ECE101)
	    if(acc.length > 0){ // this is done in case courses are stored in a weird order
		if(acc[acc.length-1][0].subject + acc[acc.length-1][0].courseNumber == cur.subject + cur.courseNumber) // compare to previous packet
		    acc[acc.length-1].push(cur); // push to last packet where it's the same
		else
		    acc.push([cur]); // or set up a new packet
		return acc;
	    } else { // set up the first one
		return [[cur]];
	    }
	}, []) // now in the form of [[MATH 101 courses...], [MATH 102 courses...], etc...]
	.map(function(packet){ // process each packet
	    //the processing goes as follows - one of each type of scheduleTypeDescription needs to be applied
	    //this can be one Lecture, one Lab, and one Recitation, or any combonation or extension
	    //alts show up in the form of alts:[typePacks:[courses...]...]
	    //automatic mode will only look at alts, and pick one from each type
	    packet[0].home = packet[0];
	    packet[0].alts = [[packet[0]]]; // set up first one
	    for(var i=1; i<packet.length; ++i){ // start at the second one
		packet[i].home = packet[0]; // set the home - used for referencing alts
		var foundIndex = packet[0].alts.findIndex(typePack => typePack[0].scheduleTypeDescription == packet[i].scheduleTypeDescription);
		if(foundIndex > -1) // there exists a typePack in alts which has the same type as packet[i]
		    packet[0].alts[foundIndex].push(packet[i]); // add to revalent typePack
		else // the type of packet[i] is new to typePack
		    packet[0].alts.push([packet[i]]); // add as a new typePack
	    }
	    return packet;
	}) // still in the form of [[MATH 101 courses...], [MATH 102 courses...], etc...]
	.reduce(function(acc, cur){ // then unwrap packets back into the big course list
	    return acc.concat(cur);
	}, []) // back in the form of [courses...]
	.map(function(course, i){ // and add indices
	    course.index = i;
	    return course;
	});
}

// A wrapper around a single XMLhttp request
// supports starting, stopping, and intelligent data retrieval
//
// methods:
//   constructor(type, term = null, offset = null, size = null)
//   >Sets up the Searcher object with data.
//   >>type is a string, see switch case in .start() for types
//   >>term is the term string code for the URL
//   >>offset is used in loading courses. If there's a master list of courses, you're starting at this index
//   >>size of a course list request. Start at offset's index, and end at (offset+size)'s index
//
//   start(callback = null)
//   >starts the request
//   >>callback(loadedData) is a function which will be executed upon completion
//   >if already loaded, callback is executed immediatly
//
//   stop()
//   >aborts the pending request
class Searcher{
    // A wrapper to perform a single XMLHttpRequest
    // Allows for stopping and starting of request
    constructor(type, term = null, offset = null, size = null){ // when offset == null or isn't provided, just prime
	this.term = term;
	this.data = [];
	this.done = false;
	this.offset = offset; // if type == desc, offset is interpreted as the course reference number
	this.size = size;
	this.xhr = null;
	this.type = type;
    }
    start(callback = null){
	if(this.xhr || this.done) // don't restart if not needed
	    return;
	var GETPOST = {};
	GETPOST.postData = null;
	GETPOST.openMethod = null;
	GETPOST.url = null;
	switch(this.type){
	case "prime":
	    app_config.URLprime(GETPOST, this.term);
	    break;
	case "count":
	    app_config.URLgetCourseTotalCount(GETPOST, this.term);
	    break;
	case "courses":
	    app_config.URLgetCourses(GETPOST, this.term, this.offset, this.size);
	    break;
	case "terms":
	    app_config.URLgetTerms(GETPOST);
	    break;
	case "desc":
	    app_config.URLgetDescription(GETPOST, this.term, this.offset);
	    break;
	case "test":
	    app_config.URLtest(GETPOST);
	    break;
	default:
	    console.error("Invalid type in Searcher");
	}
	// check to make sure config.js has set GETPOST correctly
	if(GETPOST.url == null)
	    console.error("url not set for request of type " + this.type + ". There's an erorr in config.js");
	if(GETPOST.url == "" && ((this.type == "prime") || (this.type == "count"))){
	    this.xhr = null;
	    this.done = true;
	    callback(false); // false -> let hedRequest know we're not counting anything
	    return; // in the case where a college's servers are designed well and we don't need to check these
	}
	if(GETPOST.openMethod == null)
	    console.error("openMethod not set for request of type " + this.type + ". There's an erorr in config.js");
	if(GETPOST.openMethod == "POST" && GETPOST.postData == null)
	    console.error("postData is missing for POST request of type " + this.type + ". There's an erorr in config.js");
	// start making the request
	this.xhr = new XMLHttpRequest();
	this.xhr.onreadystatechange = function(ref){ // callback
	    return function(){
		if(this.readyState == 4){
		    this.done = true;
		    ref.xhr = null;
		}
		if(ref.type == "test" && this.readyState === 4 && this.status === 0){ // test failed
		    console.error("CORS DENIED - please enable a CORS-everywhere extension or ask " + app_config.collegeNameShort + " to let us in");
		    if(callback)
			callback(false);
		    return;
		}
		if(ref.type == "test" && this.readyState === 4){ // test was successful
		    if(callback)
			callback(true);
		    return;
		}
		if(ref.type == "test")
		    return; // forget about everything else if it's just a test
		if (this.readyState === 4 && this.status === 200){ // everything else
		    if(callback)
			callback(this.responseText);
		    ref.done = true;
		    ref.xhr = null;
		    return;
		}
		else if(this.status != 200 && this.status != 0){
		    console.error("A network request failed with code " + this.status.toString()); // might need in the future for testing errors
		}
	    }
	}(this);
	this.xhr.open(GETPOST.openMethod, GETPOST.url); // local sync
	this.xhr.withCredentials = true; // needed for auth cookies
	if(GETPOST.openMethod == "POST")
	    this.xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); // needed for submitting form data - posts and descriptions
	this.xhr.send(GETPOST.postData);
    }
    stop(){
	if(!this.xhr || this.done) // can't stop what's not there to stop
	    return;
	this.xhr.abort();
	this.xhr = null;
    }
}

// A wrapper around an entire term's worth of Searcher requests
// .start() will handle any cookie based requests, and then load all courses
// then it will fire callback
// A TermManager will also cache partially loaded results if asked to stop
// then it will pick back up where it left off when started again
//
// methods:
//   constructor(term)
//   >sets up obect
//   >>term is the URL string term code
//
//   start(callback)
//   >starts loading a term
//   >>callback(courses) will fire after the entire term is loaded
//   >if term is already loaded, just fire the callback
//
//   stop()
//   >aborts all pending Searcher requests
class TermManager{
    constructor(term){
	this.term = term;
	this.data = []; // partially cached data, or a list of all courses when all done
	this.done = false;
	this.requests = []; // all course data requests
	this.headRequest = null; // request(s) needed for cookie auth
	this.main_callback_wrapper = {callback: null}; // MUST be placed in an object because JS is weird
    }
    stop(){ // abort all requests and prime for a restart
	if(this.done) // why stop something that's already done?
	    return;
	this.main_callback_wrapper.callback = null;
	if(this.headRequest){
	    this.headRequest.stop();
	    this.headRequest = null; // in case we stopped during a head request
	}
	this.requests.forEach(function(request){
	    request.stop(); // stop each one
	});
    }
    start(main_callback, bypass = false){ // construct all requests and send, or if already constructed just send
	// bypass is only used for recursing from inside here
	this.main_callback_wrapper.callback = main_callback;
	//main_callback is what to do after the term is done loading. It's like an await
	if(this.done){ // if it's already done, run the callback and exit
	    if(main_callback)
		main_callback(this.data);
	    return;
	}
	if(this.headRequest){ // already started, but not finished. Just need to change the main_callback (already done)
	    return; // don't bother re-starting
	}
	var callback = function(TermManager_ref){ // set up callback for the first Searcher request, actual execution is after definition
	    return function(ignored){ // this one is just needed to get cookies in line
		if(TermManager_ref.requests.length){ // we've already made some requests - just finish them
		    var loadedAmount = TermManager_ref.data.reduce(function(acc, cur){ // check how many courses we have loaded so far
			return acc + cur.courses.length; // by summing them all up
		    }, 0);
		    if(TermManager_ref.totalCount !== undefined){
			app.percent = loadedAmount.toString() + "/" + TermManager_ref.totalCount.toString();
			app.updatePercent();
		    }
		    TermManager_ref.headRequest = null;
		    TermManager_ref.requests.forEach(function(request){
			request.start(function(responseData){ // individual callbacks
			    var preProcessedCourses = app_config.PROCESSgetCourses(responseData);
			    TermManager_ref.data.push({courses: preProcessedCourses, offset: request.offset}); // cache...
			    // and check if we're done
			    var loadedAmount = TermManager_ref.data.reduce(function(acc, cur){ // check how many courses we have loaded
				return acc + cur.courses.length; // by summing them all up
			    }, 0);
			    
			    if(TermManager_ref.totalCount !== undefined){
				app.percent = loadedAmount.toString() + "/" + TermManager_ref.totalCount.toString();
				app.updatePercent();
			    }
			    if((TermManager_ref.totalCount === undefined) || (loadedAmount >= app_config.test_percent_cap*TermManager_ref.totalCount/100)){ // and see if we've got enough
				app.percent += "\nProcessng courses...";
				app.updatePercent();
				// if so, process data and mark term complete
				TermManager_ref.data = postProcessCourses(
				    TermManager_ref.data // take fufilled requests
					.sort((a, b) => a.offset - b.offset) // sort them all, because they probably won't load in order
					.reduce(function(acc, cur){ // and unwrap them all
					    return acc.concat(cur.courses); // into one big array
					}, [])
				); // then post process them so automatic mode actually works
				
				TermManager_ref.done = true;
				TermManager_ref.requests = []; // free up some memory
				// finally ready to run the callback. Probably for updating UI
				if(TermManager_ref.main_callback_wrapper.callback) // it's weird because we can't close in the function, we need to make sure it can change
				    TermManager_ref.main_callback_wrapper.callback(TermManager_ref.data);
				
				// if we get here, we automatically know there are no other term requests running
				// so instead of having down time, start looking for other terms to load
				// we'll only work on loading the terms that are sitting in saves because
				// those are most likely to be looked at
				// we won't just load all terms because that's a good bit of data
				var saves = document.getElementById("saves").children;
				var saveTerms = [];
				// look through each save and grab their terms
				for(var i=0; i<saves.length; ++i)
				    saveTerms.push(app.localStorage[saves[i].innerText].split("=")[0]);
				// then look through loaded terms and grab their terms
				var completedTerms = app.termCacher.termManagers.filter(manager => manager.done).map(manager => manager.term);
				// then find the first save term that doesn't have a fully loaded term
				for(var i=0; i<saveTerms.length; ++i){
				    if(!completedTerms.find(term => term == saveTerms[i])){
					// and if we find one, start loading it in the background
					app.termCacher.push(saveTerms[i], null);
					return;
				    }
				}
				// if we reach here, all of our saves are loaded and there's nothing else to do
			    }
			});
		    });
		} else { // first time requesting - do a small request first to gauge total size, then fill up
		    app.percent = "0/?";
		    app.updatePercent(); // update loading bar (if running in the background, it will be hidden)
		    TermManager_ref.headRequest = new Searcher("count", TermManager_ref.term);
		    TermManager_ref.headRequest.start(function(responseData){
			TermManager_ref.headRequest = null; // head requests are all done
			if(responseData === false){ // this can only happen when config.js says we don't
			                            // need to count and all courses will be in 1 request
			    app.percent = "";
			    app.updatePercent();
			    var searcher = new Searcher("courses", TermManager_ref.term, 0, 0);
			    searcher.offset = 0;
			    TermManager_ref.requests.push(searcher);
			    TermManager_ref.start(TermManager_ref.main_callback_wrapper.callback, true);
			} else {
			    TermManager_ref.totalCount = app_config.PROCESSgetCourseTotalCount(responseData);
			    app.percent = "0/" + TermManager_ref.totalCount.toString();
			    app.updatePercent();
			    let offsets = []; // stores offset values for each subsequent required request
			    for(var i = 0; i<app_config.test_percent_cap*TermManager_ref.totalCount/100; i+=app_config.chunk)
				offsets.push(i); // fill offsets with integer values starting at 0
			    // offset by app_config.chunk size, and going up to only what we need to request
			    
			    offsets.forEach(function(offset){ // construct all subsequent requests
				var searcher = new Searcher("courses", TermManager_ref.term, offset, app_config.chunk);
				searcher.offset = offset; // we carry offset through so we can sort courses in the
				// correct order after they're all loaded in
				TermManager_ref.requests.push(searcher);
			    });
			    TermManager_ref.start(TermManager_ref.main_callback_wrapper.callback, true); // recurse into start. Now that requests is filled, it'll just start them all
			}
		    });
		}
	    }
	}(this);
	
	if(bypass){ // recursing -- don't bother POSTing again
	    callback(null);
	} else { // not recursing -- POST and then run callback
	    this.headRequest = new Searcher("prime", this.term); // prime it
	    this.headRequest.start(callback);
	}
    }
}


// A wrapper around many TermManagers
// meant to be the main interface for doing term data requests
// will cache all results
//
// methods:
//   constructor()
//   >Not much
//
//   push(term, callback=null)
//   >>term is the URL term string
//   >>callback(courses) is the function to be called on completion of loading - removed upon interruption
//   >sets up a new (or existing) term for loading
//   >will continue to load this term until it's finished, or another term needs loaded
class TermCacher{
    constructor(){
	this.termManagers = [];
    }
    push(term, callback=null){ // start loading a term
	//first, sift through termManagers and see if we've already got one loaded/loading
	var index = this.termManagers.findIndex(termManager => termManager.term == term);
	if(index > -1 && this.termManagers[index].done){ // if it's already done
	    // see if there's a term already being requested
	    this.termManagers.forEach(function(termManager){
		// if there are, let it continue but only to cache it's data
		termManager.main_callback_wrapper.callback = null;
	    });
	    // then run callback for the completed term
	    // following line is same as callback(this.termManagers[index].data) but a bit safer
	    this.termManagers[index].start(callback);
	    return;
	    // explanation:
	    // we check first in case term is already cached. This way, if another term is loading in and a new
	    // request is made for an already loaded term, we don't bother stopping the one loading and let it
	    // keep loading in the background for a fast switch down the road
	}
	// If we get here, we know we need to start/resume a request
	// and, because we can't have multiple terms loading (for cookie reasons)
	// we need to stop all the other requests
	var activeManager = null;
	// but first, check if we're resuming instead of making a new one
	if(index > -1){ // signaling a resume (instead of a cold start)
	    // without stopping the (possibly) running request, remove it from the termManagers list
	    activeManager = this.termManagers.splice(index, 1)[0];
	}
	// stop all the other ones
	this.termManagers.forEach(function(termManager){
	    termManager.stop();
	})
	// then resume/start the target manager
	// if it's already in there, we removed it earlier. Just add it back and update the callback
	this.termManagers.push(index > -1 ? activeManager : new TermManager(term));
	this.termManagers[this.termManagers.length-1].start(callback); // and re/start it
    }
}
