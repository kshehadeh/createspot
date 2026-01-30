---
name: changelog
description: Add to Changelog - document recent changes in JSON for notifications
disable-model-invocation: true
---

# Add to Changelog

## Overview
The goal of this is to document the changes that were recently made in a JSON file that can be used elsewhere to notify people of changes. The number of days to look back is configuratble by the associated context in the prompt.  Also, we will not duplicate changes that have already been documented.  A single commit does not mean a single change record.  Some commits have multiple changes.  Use the commit message and the content of the change to determine what discrete changes were made.  But if we already have a record for that commit, do not add new ones because it could duplicate it.

## How
I want to look at the last commit that was made and summarize the changes in as brief a way as possible.  When summarizing we are going to break the change down into a structured object.  

### Structure
"time", "commit", "type", "area", "description"

* "time" is the date time of the commit
* "commit" is the sha (multiple records could have the same commit)
* "type" is the type of change: fix, improvement, feature, documentation
* "area" is the area the change was made in: "global" "content", "profile", "portfolio", "collection", "games", "tools"
  * Global: Navigation, Authentication
  * Content: About pages, home page, etc
  * Portfolio: Viewing, editing, sharing portfolios
  * Collections: Viewing, editing, creating, sharing collections
  * Games: Prompt and other inspiration games
  * Tools: Image editor  
* "description" is a brief description (no more than one sentence) of the change that was made.  If it's long, it might need to be two different records.

### Output
Now take that object and add it to a file in the `changelogs` folder.  The files are organized by day so if there is already a day (e.g. 2025-11-25.json) then add to that file.  Otherwise, create a new file with the current date.  


### Important
Check if we already have a reference to the date and commit that was found.  Also, take as input to the command information about how far back to look (in days).  For example if the command is `/changelog The last 5 days` then look for commits in that period.
