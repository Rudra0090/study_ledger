# Study Ledger — Daily Study & Work Tracker

A small, offline-friendly tracker built with HTML, CSS, and vanilla JavaScript.

## Run it
1. Extract `daily_study_ledger.zip`.
2. Open the `daily_study_ledger` folder.
3. Double-click `index.html` to open it in Chrome, Edge, or Firefox.

No Python, Flask, database, or installation is required.

## What is included
- **Daily page:** default subjects based on your screenshot, topic/details fields, time-in-minutes boxes aligned to the right, and extra activities such as finding resources, revision, and project work.
- **Dashboard:** total minutes, hours, number of timed entries, subject count, time distribution, and a seven-day chart.
- **History book:** dated pages with a paper/book appearance; select a page to open that date.
- **Autosave:** edits are saved in your browser's local storage as you type.
- **Export backup:** download a JSON backup of all saved days.

## Important storage note
Your entries are stored in the browser on this device, not in an online account. They remain after closing the browser, but clearing browser data or switching browsers/devices can remove or hide them. Use **Export backup** regularly. This version does not upload your records to a server.

## About the 11:59 PM total
The page recalculates totals immediately and stores edits as they happen. If the page is open at 11:59 PM, it also records a day-end total snapshot. If the page is closed, your entries are still saved and the total is calculated from them when you return; a background task cannot run while the browser is fully closed.

## Customizing subjects
Open `app.js` and edit the `SUBJECTS` array near the top. The current defaults come from the subjects visible in the provided screenshot. You can add or rename subjects there.
