require(['primary'], function() {
	
	console.log("the main");

	var secondary = 'secondary';
	require([secondary], function() {
		
		console.log('now secondary is loaded');

	})

});