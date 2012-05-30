/*
    Module: site-search.js
    Description: Used across the site for global search.
*/
/*jshint strict: false */

define(function() {

	var url = 'http://www.guardian.co.uk/web';
	var val_to_url = {
		'web': 'http://www.guardian.co.uk/websearch',
		'search-contributions': 'http://www.guardian.co.uk/discussion/search/comments/'
	};

	var form = document.querySelector('.site-search form'),
		select = form.querySelector('select');

	if (form) {
		form.addEventListener('submit', function() {
			var val = select.options[select.selectedIndex].value;
			if (val_to_url[val]) {
				url = val_to_url[val];
				form.action = url;
			}
		}, false);
	}
});