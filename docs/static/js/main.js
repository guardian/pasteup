require(['detect', 'topbar'], function(detect, topbar) {

	// If we look mobile, then hide the topbar.
	if (detect.getLayoutMode() === "base") {
		topbar.addLink();
	}

});