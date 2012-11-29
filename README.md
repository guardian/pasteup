Introduction
============

Pasteup is where design meets development. It is where the Guardian’s globally recognised design language is turned into code for the web, and the starting point when styling Guardian branded products for both internal teams and third parties.

**Why Pasteup?** It's a newspaper term for "the assemblage of pages by pasting type onto page mockups, which are then photographed to be made into metal plates for the printing press" (courtesy of John E McIntyre). This is quite a nice metaphor for how client-side development builds the Guardian's pages. Plus it sounds cool.

Getting started
---------------

    > ./setup.sh      # Installs build/server dependencies, including nodejs and npm.
    > cd build
    > node server.js  # Starts server on http://localhost:3000

You should now be able to reach the docs homepage at http://localhost:3000/docs/index.html. Any changes you make in the `/less`, `/js`, or `/content` directories will trigger a full build, and immediatley be available for viewing on localhost.

LESS
----

Pasteup uses LESS to build and minify CSS. Sometimes, if you ask nicely you can use a CSS variable - or maybe even a mixin.

RequireJS
---------

Pasteup uses RequireJS and the AMD pattern to split JavaScript into modules, along with the built in optimizer to build production versions of these modules.