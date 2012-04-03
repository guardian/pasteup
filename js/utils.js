var guardian = {};

/* utility functions for low-level dom manipulation */
guardian.util = {

    /* native method to add a class */
    addClass: function(elm, classname) {
        var re = new RegExp(classname, 'g');
        if(!elm.className.match(re)){
            elm.className += ' ' + classname;
        }
    },

    /* native method to remove a class */
    removeClass: function(elm, classname) {
        var re = new RegExp(classname, 'g');
        elm.className = elm.className.replace(re, '');
    },

    /* convenience method to swap one class for another */
    swapClass: function(elm, classToRemove, classToAdd) {
        this.removeClass(elm, classToRemove);
        this.addClass(elm, classToAdd);
    }

};

// shim function for console logging, prevents IE errors
window.log = function() { 
    log.history = log.history || [];
    log.history.push(arguments);
    if (this.console) { 
        console.log(Array.prototype.slice.call(arguments));
    }
};