var guardian = {};

/* utility functions for low-level dom manipulation */
guardian.util = {

    /* native method to add a class */
    add_class: function(elm, classname) {
        var re = new RegExp(classname, 'g');
        if(!elm.className.match(re)){
            elm.className += ' ' + classname;
        }
    },

    /* native method to remove a class */
    remove_class: function(elm, classname) {
        var re = new RegExp(classname, 'g');
        elm.className = elm.className.replace(re, '');
    },

    /* convenience method to swap one class for another */
    swap_class: function(elm, class_to_remove, class_to_add) {
        this.remove_class(elm, class_to_remove);
        this.add_class(elm, class_to_add);
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