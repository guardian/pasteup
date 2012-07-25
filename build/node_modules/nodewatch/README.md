# node-watch

Simple utility for nodejs to watch file changes.

A file change is:

* a **file** whom's mtime is changed
* a **file** which is added to a 'watched' folder
* a **file** which is deleted form a 'watched' folder

A new feature is to watch folders recurively.
However, polling for changes on the file system is slow.
And I did not test this module on a large number of files and
nested folders.


This utility is handy for e.g. automatic testing in combination with a testing frame-work,
An example lives within the JakeFile (jake and docco required)

    run: jake autotest

Make changes in the src/watch.js file or the specs/watchSpec.js file and see te specs running automaticly

## Install:

     npm install nodewatch
     
(Use the "-g" global switch for installing nodewatch global)

## Usage:


     var watch = require('nodewatch');
     // Adding 2 dirs relative from process.cwd()
     // Nested dirs are not watched
     // dirs can also be added absolute
     watch.add("./spec").add("./lib/watch").onChange(function(file,prev,curr,action){
        console.log(action);
        console.log(file);
        console.log(prev.mtime.getTime());
        console.log(curr.mtime.getTime());
     });
     
     // Clear (remove) the listeners
     watch.clearListeners();
     
     // Remove dirs to watch
     watch.remove("./spec").remdDir("./lib/watch");
 

## Methods:


     // Add a dir or file relative from process.cwd()
     watch.add("./specs");
     // or
     watch.add("../specs");
     // or
     watch.add("../specs",true);
     // With the last argument = true, the specs folder
     // is recursive watched.

     // Just watch ONE file
     watch.add("../path/to/my/file.js")
     // Add a dir absolute 
     watch.add("/absolute/path");
     
     // Set a listener
     // It will provide a file (filename as string), prev and curr stats objects
     watch.onChange(function(file,prev,curr,action){
            // action is 'delete' || 'change' || 'new'
            console.log(action);
            console.log(file);
            console.log(prev.mtime.getTime());
            console.log(curr.mtime.getTime());
      });
     
     // Remove a dir or file (absolute or relative)
     watch.remove("./spec");
     
     // Clear the listener(s) attached via onChange();
     watch.clearListeners();



