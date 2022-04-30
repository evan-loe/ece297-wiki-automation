# ECE297 Wiki Automation

This project was created in an attempt to procrastinate school work. There's a backend element that recieves POST requests that contain information on how to update the wiki page. There's also a neglected front end built using ReactJS that's not currently being used.

The backend also makes requests to an Airtable database to retrieve the data there and format it on the wiki.


### The Airtable Data
![alt text](https://github.com/evan-loe/ece297-wiki-automation/blob/main/images/airtable.png?raw=true)

⬇️ Server makes a get request and fetches this data. Every 5 minutes, the server logs into the wiki and updates the table

![alt text](https://github.com/evan-loe/ece297-wiki-automation/blob/main/images/updatedemo.gif?raw=true)


### Display on Wiki

The table and tasks descriptions under it are updated

![alt text](https://github.com/evan-loe/ece297-wiki-automation/blob/main/images/wikitable.png?raw=true)


# How to setup this project

For the server:
- close the repo into a directory
- npm install to get the required dependencies
    - this project uses puppeteer.js for logging in and updating the wiki page
- Change your team number in config.json
- The default page is 'start'. If you would like a different wiki page to get updated make sure to change it in the code
- Set up an airtable and copy in the key into credentials.json OR make your own post request to the server
- set up your login information in credentials.json
- npm start to start the server
