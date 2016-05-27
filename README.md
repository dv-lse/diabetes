Diabetes: LSE DV
================

  - [x] draft basic scatter chart
  - [ ] body weight entry box
  - [ ] blood sugar entry box
  - [ ] hypoglycaemia bars

  - [ ] check stats calc
  - [ ] sliders for stat entry
  - [ ] axis animates out?
  - [ ] move axis to current? or move dots?
  - [ ] push extent out 10% both axes
  - [x] hide collapsed labels

  - [ ] move metformin & others in 2 stages, temporary signpost labels?
  - [ ] rule lines for each drug



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
