/*!
 * jQuery Sticky Footer 1.1
 * Corey Snyder
 * http://tangerineindustries.com
 * https://github.com/coreysyms/foundationStickyFooter
 *
 * Released under the MIT license
 *
 * Copyright 2013 Corey Snyder.
 *
 * Date: Thu Jan 22 2013 13:34:00 GMT-0630 (Eastern Daylight Time)
 * Modification for jquery 1.9+ Tue May 7
 */

$(window).load(function() {
	stickyFooter();
  
	//IE 6,7,8 does not support mutation events so old skool here
	if (!jQuery.support.leadingWhitespace) {
		setInterval(checkForDOMChange, 100);
	}
});

//check for changes to the DOM
function checkForDOMChange() {
	//leading white space will tell us if this is IE 9 or greater
	if (jQuery.support.leadingWhitespace) {
		$(document).unbind("DOMSubtreeModified");
	}
	stickyFooter();
}

//check for resize event if not IE 9 or greater
if (jQuery.support.leadingWhitespace) {
	$(window).resize(function() {
		stickyFooter();
	});
}

function stickyFooter() {

	if ($("footer").attr('style')) {
		$("footer").removeAttr('style');
	}

	if (window.innerHeight != document.body.offsetHeight) {
		var offset = window.innerHeight - document.body.offsetHeight;
		var current = parseInt($("footer").css("margin-top"));

		if (current+offset > parseInt($("footer").css("margin-top"))) {
			$("footer").css({"margin-top":(current+offset)+"px"});
		}
	}

	if (jQuery.support.leadingWhitespace) {
		$(document).bind("DOMSubtreeModified", checkForDOMChange);
	}
}

/*
! end sticky footer
*/