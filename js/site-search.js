/*
    Module: site-search.js
    Description: Used across the site for global search.
*/
/*jshint strict: false */

define(function() {

	var form = document.querySelector('.site-search form'),
		select = form.querySelector('select');

	if (form) {
		form.addEventListener('submit', function() {
			var url = select.options[select.selectedIndex].value;
			if (url) {
				form.action = url;
			}
		}, false);
	}
});