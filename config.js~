/* config.js
This file contains various configs for developing or adapting to other colleges
If you're lucky, this file contains everything you need to do so

The intent is to minimize the need to look around in other files when
adapting this for other colleges. Read through this entire file and
your job will be a lot easier. Each section has a small guide.

This file is split into sections, indicated by ascii art.
Those sections are as follows:
-Developer options
 L->Useful for testing non-production versions
-librequests URLS
 L->Used for configuring URLS for outgoing requests
-librequests processing
 L->Used to process incoming requests and construct course objects
-misc
 L->basically a big stringtable
*/

//config init -- don't touch this
let app_config = {}; // used for namespace and definition order reasons

/*_____  ________      ________ _      ____  _____  ______ _____  
 |  __ \|  ____\ \    / /  ____| |    / __ \|  __ \|  ____|  __ \ 
 | |  | | |__   \ \  / /| |__  | |   | |  | | |__) | |__  | |__) |
 | |  | |  __|   \ \/ / |  __| | |   | |  | |  ___/|  __| |  _  / 
 | |__| | |____   \  /  | |____| |___| |__| | |    | |____| | \ \ 
 |_____/|______|   \/   |______|______\____/|_|    |______|_|  \_\
                                                                  
   ____  _____ _______ _____ ____  _   _  _____ 
  / __ \|  __ \__   __|_   _/ __ \| \ | |/ ____|
 | |  | | |__) | | |    | || |  | |  \| | (___  
 | |  | |  ___/  | |    | || |  | | . ` |\___ \ 
 | |__| | |      | |   _| || |__| | |\  |____) |
  \____/|_|      |_|  |_____\____/|_| \_|_____/ 

This section contains options useful for non-production versions
*/

// Used for testing - out of a given term, this is how many courses are to be loaded
// A lower percentage means fewer courses, which means less functionality but faster loading & testing
app_config.test_percent_cap = 100;

// Used for performance tuning - for each large courses request, this is how many courses are requested
// A lower number means fewer courses requested per request and thus faster requests, but more requests overall
// For CSU, I've found that 300 gives the fastest loading times. However, the server will honor up to 500
app_config.chunk = 300;
//These values have been found from tested on my machine. Feel free to test yourself
//500---> Finish: 46.84s, 49.08s, 42.61s = 46.176s avg
//400---> Finish: 44.52s, 40.94s, 37.04s = 40.826s avg
//300---> Finish: 38.30s, 35.46s, 38.66s = 37.473s avg ***
//200---> Finish: 42.70s, 43.13s, 38.08s = 41.303s avg
//100---> Finish: 45.26s, 34.36s, 36.82s = 38.813s avg


/*_      _____ ____  _____  ______ ____  _    _ ______  _____ _______ _____ 
 | |    |_   _|  _ \|  __ \|  ____/ __ \| |  | |  ____|/ ____|__   __/ ____|
 | |      | | | |_) | |__) | |__ | |  | | |  | | |__  | (___    | | | (___  
 | |      | | |  _ <|  _  /|  __|| |  | | |  | |  __|  \___ \   | |  \___ \ 
 | |____ _| |_| |_) | | \ \| |___| |__| | |__| | |____ ____) |  | |  ____) |
 |______|_____|____/|_|  \_\______\___\_\\____/|______|_____/   |_| |_____/
  _    _ _____  _       _____ 
 | |  | |  __ \| |     / ____|
 | |  | | |__) | |    | (___  
 | |  | |  _  /| |     \___ \ 
 | |__| | | \ \| |____ ____) |
  \____/|_|  \_\______|_____/

Nessicary for handling URLS for outgoing requests
VERY important for making this work with other colleges
This area will need the most tweaking, and librequests.js might 
need some as well

IMPORTANT NOTE:
The first step in adapting this for another college is getting data
to come through in the first place. Here's a rough gide on how to do that.

1) Find out where the courses data server is located
This can be done a few ways, but the easiest way is through dev tools in
your browser. Open it and start looking at network traffic. Then, head
to your college's course catalogue or registration site. Somewhere
that courses are loaded in a big list and you can search through them.
Then, get to the point where you're about to load some courses. Clear
the network traffic log, then load in some courses. You'll see some
requests coming in. Sort through them until you find the one (or more)
that contain course JSON data. If your college doesn't use JSON, good luck.
Note the URL where the JSON comes from. This is the data server.

2) Find the URLprefix
Repeat step 1 with a few different things. Try loading what terms are
available for registration, courses, descriptions, etc. All the URLs
should have a common prefix. If they don't, they do, even if it's just
'https://' -- fill this out below as app_config.URLprefix.

3) Find URL patterns
Now that you have a list of URLs for getting data, start looking at them closer.
You'll notice some patterns when requesting courses. For CSU, it's
like this after the prefix:
searchResults/searchResults?txt_term=TERMCODE&startDatepicker=&endDatepicker=&pageOffset=START&pageMaxSize=CHUNK&sortColumn=subjectDescription&sortDirection=asc
-where TERMCODE is the code used to specify what term courses are coming from
-where START is where we want to start from in the big master list of courses
-where CHUNK is how many courses we want to load
Now, figure out what these patterns are for available terms, courses in each term,
and (if applicable) where you can find course descriptions. Fill these in as:
app_config.URLgetTerms()
app_config.URLgetCourses()
app_config.URLgetDescription()
Now, if these are all GET requests, easy. If they're post requests, pay attention
to the parameters too, you can fill those in too. Use the GETPOST parameter.

4) Learn a bit about what courses are available
We need to know the total number of courses available to load for any given term.
Fill out:
app_config.URLgetCourseTotalCount()

5) Get it working by itself
Now that you have all the URLS you need, you need to be able to actually make requests.
Why is this important to note? Some colleges require session authentication cookies,
which make it impossible to come out of the blue and request courses, but possible
to request courses on the college's website. This is usually done through a request
on each session, or a request on each term change. In order to handle both of these
scenarios, there are two built in request functions. They are as follows:
app_config.URLtest() and app_config.URLprime()
URLtest  deals with the session approach
URLprime deals with the term    approach
They can be used together, appart, or not at all. At this point, figure out what
requests you need to make in order to make term and course requests off of the
official site. Then fill out:
app_config.URLtest()
app_config.URLprime()

After these steps, you should be able to get JSON incoming. Check the network traffic
for this page while it's trying to load terms. For now, ignore errors in the JS console
and things breaking on the page. The important part is being able to check each request
and see JSON coming in properly. If you can get this to work, continue on to the next section
*/

// app_config.URLprefix
// The common URL prefix for all incoming data from your university's server
// should look like 'https://server.college.edu/courseCommon/'
// every request will start with this string, and have data appended to it
// if you have a special case, it can be addressed in specific functions
// this is for convienence only
app_config.URLprefix = 'https://bannerxe.is.colostate.edu/StudentRegistrationSsb/ssb/';

// app_config.URLgetTerms()
// This function is used to get the URL needed for querying available terms
// the response of which will be processed in app_config.PROCESSgetTerms()
//
// this is where the GETPOST parameter is introduced. It has three important members
// that MUST be set:
// 1) url
//    L-> the URL which the request takes place
// 2) openMethod
//    L-> must be set to either "GET" or "POST", which corresponds to the needed request type
// 3) postData
//    L-> used when openMethod is "POST", and contains the data to post
//    L-> may be left as null if not a POST request
app_config.URLgetTerms = function(GETPOST){
    GETPOST.openMethod = "GET";
    // GET request - no need to set postData
    GETPOST.url = app_config.URLprefix + "classSearch/getTerms?searchTerm=&offset=1&max=100&_=1554348528566";
}

// app_config.URLgetCourses()
// This function is used to get the URL needed for quering courses residing in a specific term
// this function takes three additional parameters:
// 1) "termCode", which is the URL code used to represent a term in a term request.
//     termCode is calculated in app_config.PROCESSgetTerms
// 2) "offset", which is passed as a decimal number, which represents the starting index of the
//     desired chunk in a master list of all courses
// 3) "size", which is passed as a decimal number, which represents the total number
//     of courses being requested
// offset and size are automatically generated and handled in librequests.js
app_config.URLgetCourses = function(GETPOST, termURLcode, offset, size){
    GETPOST.openMethod = "GET";
    GETPOST.url = app_config.URLprefix + "searchResults/searchResults?txt_term=" + termURLcode + "&startDatepicker=&endDatepicker=&pageOffset=" + offset.toString() + "&pageMaxSize=" + size.toString() + "&sortColumn=subjectDescription&sortDirection=asc";
}

// app_config.URLgetDescription()
// This function is used to get the URL needed for quering a course description
// this function takes two additional parameters:
// 1) "termURLcode", which is the URL code used to represent a term in a term request.
//     termURLcode is calculated in app_config.PROCESSgetTerms
// 2) "courseURLcode", which is the URL code representing a course ID
app_config.URLgetDescription = function(GETPOST, termURLcode, courseURLcode){
    GETPOST.openMethod = "POST";
    GETPOST.url = app_config.URLprefix + "searchResults/getCourseDescription";
    GETPOST.postData = "term=" + termURLcode + "&courseReferenceNumber=" + courseURLcode;
}

// app_config.URLgetCourseTotalCount()
// This function returns the URL needed for checking how many courses can be loaded in a single term
//
// For example, if we're looking at Fall 2019 and there are 6610 courses in this term, this function
// should return the URL which when loaded has data containing 6610.
//
// NOTE: if your college doesn't give you a total number, good luck because this is suprisingly hard
// to account for - check librequests.js in the TermManager object for how courses are counted
app_config.URLgetCourseTotalCount = function(GETPOST, termURLcode){
    // this example just loads as few courses as possible to get some data - may not be the same
    // at every school
    GETPOST.openMethod = "GET";
    GETPOST.url = app_config.URLprefix + "searchResults/searchResults?txt_term=" + termURLcode + "&startDatepicker=&endDatepicker=&pageOffset=0&pageMaxSize=10&sortColumn=subjectDescription&sortDirection=asc";
}

// app_config.URLtest()
// This function returns the URL needed for two things
// 1) setting session auth cookies
// 2) testing whether or not we're being blocked by CORS
//     During development, you'll probbaly be blocked by CORS and will need an extension to disable it
//     This function decides whether or not you need that extension
// so you must make a requst here, even if it's to the course main page
// This function is activated only once, on load of the webpage
app_config.URLtest = function(GETPOST){
    GETPOST.openMethod = "GET";
    GETPOST.url = app_config.URLprefix;
}

// app_config.URLprime()
// This function is used to get the URL needed for "priming" a request,
// or asking the server for cookies needed to make requests.
// This function is activated on every term change before requesting courses
// This function takes an additional parameter:
//  "termCode", which is the URL code used to represent a term in a term request.
//   termCode is calculated in app_config.PROCESSgetTerms
app_config.URLprime = function(GETPOST, termURLcode){
    GETPOST.openMethod = "POST";
    GETPOST.url = app_config.URLprefix + "term/search?mode=search";
    GETPOST.postData = "term=" + termURLcode + "&studyPath=&studyPathText=&startDatepicker=&endDatepicker=";
}


/*_      _____ ____  _____  ______ ____  _    _ ______  _____ _______ _____ 
 | |    |_   _|  _ \|  __ \|  ____/ __ \| |  | |  ____|/ ____|__   __/ ____|
 | |      | | | |_) | |__) | |__ | |  | | |  | | |__  | (___    | | | (___  
 | |      | | |  _ <|  _  /|  __|| |  | | |  | |  __|  \___ \   | |  \___ \ 
 | |____ _| |_| |_) | | \ \| |___| |__| | |__| | |____ ____) |  | |  ____) |
 |______|_____|____/|_|  \_\______\___\_\\____/|______|_____/   |_| |_____/
  _____  _____   ____   _____ ______  _____ _____ _____ _   _  _____ 
 |  __ \|  __ \ / __ \ / ____|  ____|/ ____/ ____|_   _| \ | |/ ____|
 | |__) | |__) | |  | | |    | |__  | (___| (___   | | |  \| | |  __ 
 |  ___/|  _  /| |  | | |    |  __|  \___ \\___ \  | | | . ` | | |_ |
 | |    | | \ \| |__| | |____| |____ ____) |___) |_| |_| |\  | |__| |
 |_|    |_|  \_\\____/ \_____|______|_____/_____/|_____|_| \_|\_____|

This sections is used for processing incoming data and preparing it to work
with the rest of the source code.
This is important because it takes less work to modify data than it does to
modify source code.

So let's assume you followed the librequests URLs guide and you're ready
to get some stuff up on screen. In order to make that happen, you need to
process incoming data, and it stands to reason that incoming data will
be different for each college. So, here's a guide on how to process your
data in such a way that it will magically work with the rest of the site:

---Process URL recieved data
So let's assume you've overcame the hardest part: getting things to load.
Now you need to get that stuff to display on screen. First up is terms.
In each of the PROCESSget functions, results are daken directly from the
URLget functions we defined eariler. Specific instructions and templates
are found in functions. Fill them out in this order:
app_config.PROCESSgetTerms()
app_config.PROCESSgetCourseTotalCount()
app_config.PROCESSgetCourses()
app_config.PROCESSgetDescription()
*/


// app_config.PROCESSgetTerms()
// This function is used to process incoming term data into a way
// the source can understand
// This function takes one parameter: responseText. This is more
// or less taken directly from the XMLHttpRequest.onreadystatechange
// method as this.responseText, and should be treated as such
//
// Now, for processing rules. With the input of responseText, construct
// a list of objects which hold two values: URLcode and title.
// -URLcode is the URL representation of a term. It's what's passed
//  to app_config.URLgetCourses, the pattern should be evident
// -title is nothing more than the human readable version of the term
//  this can be "Summer 2019" or such. You may need to construct this
// so long as you can get both of these working, you should be perfect
//
// here's an example:
/*
responseText (literal text):
[
  {
    "code": "201990",
    "description": "Fall Semester 2019"
  },
  {
    "code": "201960",
    "description": "Summer Session 2019"
  },
  {
    "code": "201910",
    "description": "Spring Semester 2019"
  }
]

desired return value as an array of objects:
[
  {
    URLcode: "201990",
    title: "Fall Semester 2019"
  },
  {
    URLcode: "201960",
    title: "Summer Session 2019"
  },
  {
    URLcode: "201910",
    title: "Spring Semester 2019"
  }
]
*/
app_config.PROCESSgetTerms = function(responseText){
    var termJSON = JSON.parse(responseText);
    var ret = [];
    termJSON.forEach(function(termObj){
	ret.push({URLcode: termObj.code, title: termObj.description});
    });
    return ret;
}


// app_config.PROCESSgetCourseTotalCount()
// This function is similar to app_config.PROCESSgetTerms, but a lot more simple
// 
// The goal here is to take incoming responseText and return an integer
// representing the total number of courses that can be loaded for a term
//
// This function will process the responseText of app_config.URLgetCourseTotalCount
app_config.PROCESSgetCourseTotalCount = function(responseText){
    return JSON.parse(responseText).totalCount;
}

// app_config.PROCESSgetCourses()
// This function is similar to app_config.PROCESSgetTerms
//
// The goal here is to take incoming responseText and coax it into a form
// the rest of the source code will understand.
//
// NOTE: Do NOT filter any courses here. The length of the returned array is
// very important.
//
// Now, for the processing rules. With the input of responseText, construct
// an array of objects, each representing a course. They should have the
// following values:
/*
-courseNumber: if the course is MATH 101, this value should be "101"
-URLcode: the URL code used to get the course description, passed to app_config.URLgetDescription()
-title: if the course is MATH 101, this value should be "Introduction to College Algebra"
-credits: integer representation of a course's credit hours
-faculty: string of faculty, such as "Jon Doe, Mike Smith, and Sarah Williams"
-meetings: a list of meetings. See below for more details
           If meetings is an empty list, this course will be automatically filtered out later
	   *If the course is held online (partially or fully), there should be a meeting who's
	   *building is "ONLINE"
	   *This is so if a course is held both in class and online, it can be handled properly
-scheduleTypeDescription: "Lecture", "Laboratory", "Rescission", etc.
-subject: if the course is MATH 101, this value should be "MATH"

and if available:
-maximumEnrollment: if there are 25/100 seats available (75 taken), this value should be "100"
-seatsAvailable: if there are 25/100 seats available (75 taken), this value should be "25"
-waitAvailable: same as above but on a waitlist
-waitCapacity: same as above but on a waitlist
*/
// Now, meetings have some strange rules. They are as follows:
/*
the meetings property should be an array of objects, all of which have a few properties:

-building: if the section is held in BC 104, this value should be "BC"
-room: if the section is held in BC 104, this value should be "104"
-beginTime: string value represented in military time for the start
            this is to be zero-truncated and missing the :
            if the course starts at 2:45pm, this should be "1445"
            if the course starts at 8:30am, this should be "830"
            if the course starts at 1:00pm, this should be "1300"
-endTime: same as above but for end
-monday: Boolean - is the section held on monday?
-tuesday: same as above
-wednesday: etc
-thursday
-friday
-saturday
-sunday
*/
// an example of a constructed course is as follows:
/*
{
 courseNumber: "101"
 URLcode: "29948"
 title: "Introduction to College Algebra"
 credits: 4
 faculty: "Jon Doe, Mike Smith, and Sarah Williams"
 meetings: [
            {
	     building: "BC"
	     room: "104"
	     beginTime: "900"
	     endTime: "1030"
	     monday: true
	     tuesday: false
	     wednesday: true
	     thursday: false
	     friday: true
	     saturday: false
	     sunday: false
	    },
            {
	     building: "RA"
	     room: "209"
	     beginTime: "1230"
	     endTime: "1400"
	     monday: false
	     tuesday: true
	     wednesday: false
	     thursday: true
	     friday: false
	     saturday: false
	     sunday: false
	    }
           ]
 scheduleTypeDescription: "Lecture"
 subject: "MATH"
 maximumEnrollment: "100"
 seatsAvailable: "25"
}
*/
// Remember to return a LIST of constructed courses
app_config.PROCESSgetCourses = function(responseText){
    var coursesJSON = JSON.parse(responseText).data;
    ret_courses = [];
    coursesJSON.forEach(function(courseJSON){
	ret_course = {};
	ret_course.courseNumber = courseJSON.courseNumber;
	ret_course.URLcode = courseJSON.courseReferenceNumber;
	ret_course.title = courseJSON.courseTitle;
	
	ret_course.credits = 0;
	if(courseJSON.creditHours != undefined)
	    ret_course.credits = courseJSON.creditHours;
	else if(courseJSON.creditHourLow != undefined)
	    ret_course.credits = courseJSON.creditHourLow;
	else if(courseJSON.creditHourHigh != undefined)
	    ret_course.credits = courseJSON.creditHourHigh;

	if(courseJSON.faculty.length == 0)
	    ret_course.faculty = "STAFF";
	else
	    ret_course.faculty = courseJSON.faculty.map((obj, index, array) => (array.length > 1 && index == array.length-1 ? "and " : "") + obj.displayName.split(", ").reverse().join(" ")).join(", ");
	// make a list in form of "first last, first last, and first last"
	// from ["last, first", "last, first", "last, first"] w/ keys

	ret_course.scheduleTypeDescription = courseJSON.scheduleTypeDescription;
	ret_course.subject = courseJSON.subject;
	ret_course.maximumEnrollment = courseJSON.maximumEnrollment;
	ret_course.seatsAvailable = courseJSON.seatsAvailable;
	ret_course.waitAvailable = courseJSON.waitAvailable;
	ret_course.waitCapacity = courseJSON.waitCapacity;

	ret_course.meetings = courseJSON.meetingsFaculty.map(function(meetingFaculty){
	    return {
		building: meetingFaculty.meetingTime.building,
		room: meetingFaculty.meetingTime.room,
		beginTime: meetingFaculty.meetingTime.beginTime,
		endTime: meetingFaculty.meetingTime.endTime,
		monday: meetingFaculty.meetingTime.monday,
		tuesday: meetingFaculty.meetingTime.tuesday,
		wednesday: meetingFaculty.meetingTime.wednesday,
		thursday: meetingFaculty.meetingTime.thursday,
		friday: meetingFaculty.meetingTime.friday,
		saturday: meetingFaculty.meetingTime.saturday,
		sunday: meetingFaculty.meetingTime.sunday
	    }
	});
	
	ret_courses.push(ret_course);
    })
    return ret_courses;
}


// app_config.PROCESSgetDescription()
// Again, very similar to app_config.PROCESSgetTerms, but even more simple
//
// The goal here is to take responseText, process it to look friendly on screen,
// and return the value, that's it
app_config.PROCESSgetDescription = function(responseText){
    var ret = responseText.replace(/<br>/g, "\r\n").replace(/<BR>/g, "\r\n").trim(); // format
    
    while(ret.substr(0, 2) == "\r\n")
	ret = ret.substr(2, ret.length);
    //remove leading newlines
    
    while(ret.substr(ret.length-2, ret.length-1) == "\r\n")
	ret = ret.substr(0, ret.length-2);
    //remove trailing newlines
    return ret;
}



/*__  __ _____  _____  _____ 
 |  \/  |_   _|/ ____|/ ____|
 | \  / | | | | (___ | |     
 | |\/| | | |  \___ \| |     
 | |  | |_| |_ ____) | |____ 
 |_|  |_|_____|_____/ \_____|
                             
                             
This section is pretty much a big string table, all about UI.
Specifically, this is mostly about what your college names things.

Just go throuugh and fill everything out, most of it is
self explanatory
*/

app_config.collegeName = "Colorado State University";
app_config.collegeNameShort = "CSU";
app_config.siteTitle = "CSU Scheduler - Course Scheduler for Colorado State University";
app_config.siteTitleShort = "CSU Scheduler";

// app_config.courseURLcodeName
// For many colleges, when a student wants to register for a class they put in a number instead
// of the course name. At CSU, this is a 5 digit number representing the course id.
// This value will be shown to the user if they actually want to register for a class
// Earlier, we defined this value as courseURLcode
// This varible holds an abreviated (~3-4 char) name for that value that the user will understand
//
// For example, at CSU, this value is called the Course Reference Number, and is abreviated as CRN
app_config.courseURLcodeName = "CRN";

// This is important when developing, go read up on CORS
// This message will be shown at the bottom of the page when a user is locked out due to cors
// It might be a good idea to fill in some details about who controls the web servers at your college
// That way, if people start using your tool, you can get them to talk to whoever can make it open access
app_config.CORScustom = "If you\'d like to use this tool without needing an extension, go bother Joe Rymski, Director of Web Communications, (Joe.Rymski@colostate.edu) you like this tool and want to see it used freeley.";

// app_config.getLogoName()
// Should return the file path/name of your college's logo, the one saved in this directory
// At this point, you should go download the logos and place them in the same directory as this file
// If you only have one logo, just return that file's name. If you want to have two, one for light
// and one for dark mode, the isDarkMode parameter should be self explanatory
app_config.getLogoName = function(isDarkMode){
    return "CSU-Signature-Stacked-357-617" + (isDarkMode ? "-rev" : "") + ".svg";
}

// You should also go to index.html and do a few things
// 1) Go set up google analytics, then go to the top of index.html and change the tracking tag
// 2) Change the second <meta> tag's content to have a description of this website tailored for your college

// At this point, just edit the README and you should be all done
