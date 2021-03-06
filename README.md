Diabetes: LSE DV
================

  - [x] draft basic scatter chart
  - [x] body weight entry box
  - [x] blood sugar entry box
  - [x] hypoglycaemia bars

  - [ ] axes should be centered at base, not metformin
  - [ ] check stats calc

  - [x] initial screen needs labels
  - [x] mouseovers in single-axis modes
  - [ ] axis labels in x-only overlaps  ALTERNATING SIDES WILL HANDLE THIS
  - [ ] show opposite axis while dragging?  NOT DO TO
  - [x] order circle alphabetically
  - [x] put metformin in center of circle
  - [x] match circle to screen size

  - [x] sliders for stat entry
  - [x] axis animates out?
  - [x] move axis to current? or move dots?
  - [ ] push extent out 10% both axes
  - [x] hide collapsed labels

  - [ ] move metformin & others in 2 stages, temporary signpost labels?
  - [x] rule lines for each drug
  - [x] move rule lines for each mouseover?
  - [ ] put axis labels on alternating sides, per tick
  - [ ] duplicate axis labels in small black

  - [ ] weight only config needs to rotate other labels too
  - [ ] selected drugs should be in a javascript variable, not a CSS class

  - [ ] visualise risk of hypoglycaemia:  as spill of days across screen, some of
          which get caught in the drug circles?

  - [ ] circle of drugs in non-focus mode?
  - [ ] make selected drug pulse?
  - [ ] shoot rule text in from side  NOT TO DO


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
  git commit --amend --no-edit
  git push github gh-pages --force
