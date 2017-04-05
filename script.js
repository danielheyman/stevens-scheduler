Vue.use(VueResource);

var app = new Vue(
{
    el: '#app',
    data:
    {
        hovering: null,
        currentstorage: null,
        localStorage: [],
        terms: [],
        term: "",
        courses: [],
        course: null,
        selected: [],
        search: "",
        closed: false,
        changed: false,
        justLoaded: true,
        showExport: false
    },
    mounted: function()
    {
        this.$el.style.display = 'block';
        Vue.http.get('http://54.71.50.103/terms').then(function(res)
        {
            var termsxml = parseXml(res.body).getElementsByTagName("Terms")[0].getElementsByTagName("Term");
            var terms = new Array(termsxml.length);
            for ( var i = 0; i < termsxml.length; i++) {
                terms[i] = termsxml[i].getAttribute('Code');
            }
            this.terms = terms.reverse();
            if (this.hashExists() && (index = this.terms.indexOf(location.hash.slice(1, 6))) > -1)
            {
                this.term = this.terms[index];
            }
            else
            {
                this.term = this.terms[0];
            }
            this.changedTerm(true);
            
            if(localStorage.schedules) this.localStorage = JSON.parse(localStorage.schedules);
        }.bind(this), function(err) {});
    },
    computed:
    {
        totalCredits: function()
        {
            return this.selected.map(function(course)
            {
                return course.credits;
            }).concat(0).reduce(function(a, b)
            {
                return a + b;
            });
        },
    },
    methods:
    {
        filterSearch: function(course) {
            if(this.selected.indexOf(course) !== -1) return false;
            if (!this.closed && course.status != 'O') return false;

            if(this.search) {
                var search = this.search.toLowerCase();
                return course.section.toLowerCase().indexOf(search) > -1 ||
                    course.title.toLowerCase().indexOf(search) > -1 ||
                    course.instructor.toLowerCase().indexOf(search) > -1;
            }
            return true;
        },
        getHash: function() {
            return location.hash;
        },
        save: function() {
            ga('send', 'event', 'schedule', 'save');
            
            if(!this.currentstorage) {
                var name = window.prompt("Please enter a name for the schedule");
                if(!name) return;
                this.currentstorage = name;
            }
            
            if(!localStorage.schedules) localStorage.setItem('schedules', JSON.stringify({}));
            var schedules = JSON.parse(localStorage.schedules);
            schedules[this.currentstorage] = this.generateHash();
            localStorage.setItem('schedules', JSON.stringify(schedules));
            this.localStorage = schedules;
            this.changed = false;
        },
        load: function(schedule) {
            ga('send', 'event', 'schedule', 'load');

            if(this.changed && this.selected.length) {
                if (!window.confirm("Are you sure you want to discard your changes?")) {
                    return;
                }
            }
            if(this.currentstorage === schedule) return;
            this.currentstorage = schedule;
            this.changed = false;
            location.hash = this.localStorage[schedule];
            
            if ((index = this.terms.indexOf(location.hash.slice(1, 6))) > -1)
            {
                if(this.term != this.terms[index]) {
                    this.term = this.terms[index];
                    this.changedTerm(true);
                }
                else {
                    this.course = null;
                    this.search = "";
                    this.term = this.terms[index];
                    var hashes = location.hash.slice(7).split(',');
                    this.selected = this.courses.filter(function(course)
                    {
                        return hashes.indexOf(course.callNumber.toString()) > -1;
                    });
                }
            }
            this.justLoaded = false;
        },
        discard: function() {
            ga('send', 'event', 'schedule', 'discard');

            if (!window.confirm("Are you sure you want to discard your changes?")) {
                return;
            }
            this.changed = false;
            var schedule = this.currentstorage;
            this.currentstorage = null;
            this.load(schedule);
        },
        saveNew: function() {
            ga('send', 'event', 'schedule', 'save-new');

            this.currentstorage = null;
            this.save();
        },
        deleteSchedule: function() {
            ga('send', 'event', 'schedule', 'delete');

            if (window.confirm("Are you sure you want to delete the schedule " + this.currentstorage + "?")) {
                var schedules = JSON.parse(localStorage.schedules);
                delete schedules[this.currentstorage];
                localStorage.setItem('schedules', JSON.stringify(schedules));
                this.localStorage = schedules;
                this.changed = false;
                this.clear();
            }
        },
        clear: function() {
            ga('send', 'event', 'schedule', 'new');

            if(this.changed) {
                if (!window.confirm("Are you sure you want to discard your changes?")) {
                    return;
                }
            }
            this.selected = [];
            this.currentstorage = null;
            this.justLoaded = false;
        },
        webclasses: function(courses)
        {
            return courses.filter(function(course)
            {
                return course && course.daysTimeLocation[0].site == 'WS';
            });
        },
        changedTerm: function(loadHash)
        {
            ga('send', 'event', 'term', 'change');
            if(this.currentstorage) this.clear();
            this.course = null;
            this.search = "";
            this.courses = [];
            this.selected = [];
            Vue.http.get('http://54.71.50.103/' + this.term).then(function(res)
            {
                var xml = parseXml(res.body).getElementsByTagName("Semester")[0].getElementsByTagName("Course");
                var courses = new Array(xml.length);
                for ( var i = 0; i < xml.length; i++) {
                    courses[i] = {
                        section: xml[i].getAttribute('Section'),
                        title: xml[i].getAttribute('Title'),
                        callNumber: xml[i].getAttribute('CallNumber'),
                        credits: parseInt(xml[i].getAttribute('MinCredit')),
                        maxEnrollment: xml[i].getAttribute('MaxEnrollment'),
                        currentEnrollment: xml[i].getAttribute('CurrentEnrollment'),
                        status: xml[i].getAttribute('Status'),
                        instructor: xml[i].getAttribute('Instructor1'),
                        daysTimeLocation: []
                    };
                    for( var j = 0; j < xml[i].getElementsByTagName('Meeting').length; j++) {
                        courses[i].daysTimeLocation.push({
                            day: xml[i].getElementsByTagName('Meeting')[j].getAttribute('Day'),
                            startTime: xml[i].getElementsByTagName('Meeting')[j].getAttribute('StartTime'),
                            endTime: xml[i].getElementsByTagName('Meeting')[j].getAttribute('EndTime'),
                            site: xml[i].getElementsByTagName('Meeting')[j].getAttribute('Site'),
                            building: xml[i].getElementsByTagName('Meeting')[j].getAttribute('Building'),
                            room: xml[i].getElementsByTagName('Meeting')[j].getAttribute('Room'),
                            activity: xml[i].getElementsByTagName('Meeting')[j].getAttribute('Activity')
                        });
                    }
                }
                this.courses = courses;
                if (loadHash === true && this.hashExists())
                {
                    var hashes = location.hash.slice(7).split(',');
                    this.selected = this.courses.filter(function(course)
                    {
                        return hashes.indexOf(course.callNumber.toString()) > -1;
                    });
                }
            }.bind(this), function(err) {});
        },
        courseHere: function(day, hour, course)
        {
            if (!course) return;
            var res = null;
            course.daysTimeLocation.forEach(function(time)
            {
                if (!time.startTime || time.day.indexOf(day) === -1) return;
                var start = this.convertTime(time.startTime);
                var end = this.convertTime(time.endTime);
                if (start[0] != hour) return;
                res = {
                    top: start[1] / 60,
                    length: ((end[0] + end[1] / 60) - (start[0] + start[1] / 60)),
                    loc: !time.building ? 'Room N/A' : time.building + ' ' + time.room
                };
            }.bind(this));
            return res;
        },
        convertTime: function(time)
        {
            res = time.slice(0, 5).split(":").map(Number);
            res[0] += 4;
            return res;
        },
        click: function(course)
        {
            if (this.course == course)
            {
                ga('send', 'event', 'course', 'add');
                this.course = null;
                this.selected.push(course);
            }
            else
            {
                ga('send', 'event', 'course', 'remove');
                this.selected.splice(this.selected.indexOf(course), 1);
                this.hovering = false;
            }

            location.hash = this.generateHash();
            this.changed = true;
            this.justLoaded = false;
            
        },
        hashExists: function()
        {
            return location.hash.match(/#\d+[A|B|F|S]=[\d+,?]+/);
        },
        generateHash: function() {
            var hash = this.term + "=";
            hash += this.selected.map(function(s)
            {
                return s.callNumber;
            }).join();
            return hash;
        }
    }
});

function parseXml(xml)
{
    var dom = null;
    if (window.DOMParser)
    {
        try
        {
            dom = (new DOMParser()).parseFromString(xml, "text/xml");
        }
        catch (e)
        {
            dom = null;
        }
    }
    else if (window.ActiveXObject)
    {
        try
        {
            dom = new ActiveXObject('Microsoft.XMLDOM');
            dom.async = false;
            if (!dom.loadXML(xml)) // parse error ..

                window.alert(dom.parseError.reason + dom.parseError.srcText);
        }
        catch (e)
        {
            dom = null;
        }
    }
    else
        alert("cannot parse xml string!");
    return dom;
}

// Analytics
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-96461430-1', 'auto');
ga('send', 'pageview');


// HeadUser
(function () { var hu = document.createElement("script"); hu.type = "text/javascript"; hu.async = true; hu.src = "//www.heeduser.com/supfiles/Script/widget.js"; var s = document.getElementsByTagName("script")[0]; s.parentNode.insertBefore(hu, s); })()
var _heeduser = {
type: "button",
community: "sitscheduler",
url: "https://sitscheduler.heeduser.com",
placement: "middle-right",
color: "#202021",
widget_layout: "full",
sso_token: ""
}
var heeduser_url = _heeduser.url + "/FeedbackWidget/Widget.aspx?sso_token=" + encodeURIComponent(_heeduser.sso_token);
document.getElementById("feedback").innerHTML = '<a id="heeduser_wb" href="JavaScript:heeduser_openwidget(heeduser_url,\'' + _heeduser.widget_layout + '\')">Leave your feedback!</a>';
