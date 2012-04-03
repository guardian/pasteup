var EventEmitter = require("events").EventEmitter, fs = require("fs"), path = require("path");

var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) {
        if (__hasProp.call(parent, key)) {
            child[key] = parent[key];
        }
    }
    function ctor() {
        this.constructor = child;
    }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
};

var WatchClass = function() {
    "use strict";
    __extends(Watch, EventEmitter);
    function Watch(options) {}
    Watch.prototype.add = function(str_file_or_path, recursive) {
        recursive = recursive || false;
        return this.__handle(true, str_file_or_path, recursive);
    };
    Watch.prototype.remove = function(str_file_or_path, recursive) {
        recursive = recursive || false;
        return this.__handle(false, str_file_or_path, recursive);
    };
    Watch.prototype.onChange = function(cb) {
        this.on("change", cb);
        return this;
    };
    Watch.prototype.clearListeners = function() {
        this.removeAllListeners("change");
        return this;
    };
    Watch.prototype.__handle = function(add, str_file_or_path, recursive) {
        if (str_file_or_path.substring(0, 1) == ".") {
            str_file_or_path = process.cwd() + "/" + str_file_or_path;
        }
        str_file_or_path = path.normalize(str_file_or_path);
        if (fs.statSync(str_file_or_path).isFile()) {
            return this.__file(add, str_file_or_path);
        }
        if (fs.statSync(str_file_or_path).isDirectory()) {
            return this.__dir(add, str_file_or_path, recursive);
        }
    };
    Watch.prototype.__dir = function(add, dir, recursive) {
        var files = fs.readdirSync(dir);
        for (var i = 0; i < files.length; i++) {
            var full_path = dir + "/" + files[i];
            if (fs.statSync(full_path).isFile()) {
                this.__file(add, full_path);
            } else if (recursive && fs.statSync(full_path).isDirectory()) {
                this.__dir(add, full_path, true);
            }
        }
        this.__file(add, dir, recursive);
        return this;
    };
    Watch.prototype.__file = function(add, file, recursive) {
        recursive = recursive || false;
        var self = this;
        if (add) {
            fs.watchFile(file, function(prev, curr) {
                try {
                    if (fs.statSync(file) && fs.statSync(file).isDirectory()) {
                        self.__handle(false, file, recursive);
                        self.__handle(true, file, recursive);
                        if (prev.nlink !== curr.nlink) {
                            self.emit("change", file, prev, curr);
                        }
                    } else if (prev.mtime.getTime() !== curr.mtime.getTime()) {
                        self.emit("change", file, prev, curr);
                    }
                } catch (e) {
                    if (e.code === "ENOENT") {
                        return;
                    }
                    throw e;
                }
            });
        } else {
            fs.unwatchFile(file);
        }
        return self;
    };
    return Watch;
}();

module.exports = new WatchClass;