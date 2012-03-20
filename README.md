How to build these pages
========================

These pages come from a subset of the master branch

 - /docs
 - /css
 - /js (when this comes)

This is done by checking out a subset of master into gh-pages, along the lines of:

    git checkout gh-pages
    git checkout master -- /docs /css /js
    git commit -m "Updated docs from master."
    git push origin gh-pages:gh-pages

You could add a post-commit hook to master to automate this.
  