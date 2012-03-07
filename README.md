Introduction
============

Pasteup is where design meets development. It is where the Guardian's design language is turned into code, and the starting point for styling Guardian branded web products.

Swim-laning CSS
---------------

Bootstrap gives us an opportunity to extract the common patterns from across the Guardian's web apps into a central shared repository. Over time it give us a number of benefits:

 - Encourages re-use - everyone knows where to get code that implements the core Guardian designs. These styles don't get forked and inconsistent (unless that's desirable).
 - Decoupled from app code - The Guardian design language stays isolated and can evolve separately to the applications it sits on top of; although they may incorporate it in their build/deploy processes.
 - Testing - if these components are isolated from our product codebases it makes them easier to unit test distinct modules, and regression test the code.
 - Third-parties - allows us to more easily explain how to implement Guardian branding to partners (in conjunction with improved Third-Party Toolkit).
 - Refactor core R2 pages - As the bootstrap develops it will get to the point where it can replace many of the core stylesheets used in R2 and other existing applications.
 - General CSS refactor - As we move code into the bootstrap it gives us an opportunity to create tests for it, and safely refactor it to use more modern best-practice coding style and methodology.