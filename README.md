Diabetes: LSE DV
================

[ ] - draft basic scatter chart
[ ] - body weight entry box
[ ] - blood sugar entry box
[ ] - hypoglycaemia bars


Deploy on github pages
======================

* The github pages branch contains two commits.  The first contains changes to
.gitignore and index.html to load from a bundled build.js file.  The second
holds the actual build.js file, and is recreated at each deploy.

Deploy recipe:

git checkout gh-pages
git rebase master
jspm bundle index.js --minify
git add .
git commit --amend
git push github gh-pages
