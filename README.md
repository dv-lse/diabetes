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

Deploy recipe (rebases the last commit on gh-pages):

git checkout gh-pages
git rebase master
jspm bundle-sfx index.js --minify
git add build.js*
git commit --amend
git push github gh-pages --force
