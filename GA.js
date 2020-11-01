// Analytics - legacy for SIT
/**
 * shut up closure compiler
 * @param {string} a
 * @param {string} b
 * @param {string} [c]
 * @param {string} [d]
*/
function ga(a, b, c='', d=''){}
(function(i,s,o,g,r){
    i['GoogleAnalyticsObject']=r;
    i[r]=i[r]||function(){
	(i[r].q=i[r].q||[]).push(arguments);
    },i[r].l=1*new Date();
    var a=s.createElement(o);
    var m=s.getElementsByTagName(o)[0];
    a.async=1;
    a.src=g;
    m.parentNode.insertBefore(a,m);
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-96461430-1', 'auto');
ga('send', 'pageview');
