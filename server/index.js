const express = require("express");
const app = express();
const puppeteer = require("puppeteer");
const PORT = process.env.PORT ?? 5000;
const cors = require("cors");
const fs = require("fs");
const { fetchAirtable } = require("./airtable");
const cron = require("node-cron");
const { _teamNum, mainPage } = require("./config.json");
const teamNumber = (_teamNum < 10) ? `00${_teamNum}` : ((_teamNum < 100) ? `0${_teamNum}` : _teamNum.toString());

app.use(cors());

function getMonday(d) {
  d = new Date(d);
  var day = d.getDay(),
    diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const taskDescriptionHeader = "====Task Descriptions====\n";

const bodyParser = require("body-parser");
app.use(bodyParser.json());

app.get("/cats", (req, res) => {
  res.json({ message: "here are some cats" });
});

/*
The /update post route expects json in the body as follows:
{
  data: {
    taskName: "string",
    taskDescription: "string",
    person: "string",
    status: "string",
    dueDate: Date(),
    currentProgress: "string",
    comments: "string"
  },
  username: "string",
  password: "string:"
}

*/

function saveTasks(data, filePath) {
  fs.writeFile(filePath, JSON.stringify(data), (err) => {
    if (err) console.log("Error writing to file");
    else console.log("Saved tasks to file " + filePath);
  });
}

function currentTimeDateString() {
  return new Date(Date.now()).toLocaleTimeString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "2-digit",
    hour12: true,
  });
}

async function loginDoku(username, password, wikiPage = "start") {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.goto(
    `http://ug251.eecg.utoronto.ca/wiki297s/doku.php?id=cd${teamNumber}:${wikiPage}`
  );

  // log in user with username and password
  await page
    .$("input[name=u]")
    .then((usernameField) => {
      return usernameField.type(username);
    })
    .catch((err) => {
      console.log(err);
    });
  await page
    .$("input[name=p]")
    .then((passwordField) => {
      return passwordField.type(password, { delay: 100 });
    })
    .catch((err) => {
      console.log(err);
    });
  const button = await page.$("input[value=Login]");
  button.click();
  await page.waitForNavigation();
  return { page, browser };
}

async function updateDoku(req, res) {
  const {
    username,
    password,
    data,
    modifyDescription,
    wikiPage,
    sectionHeader,
  } = req.body;

  const { browser, page } = await loginDoku(username, password, wikiPage);

  // go to page to allow for editing
  await page.goto(
    `http://ug251.eecg.utoronto.ca/wiki297s/doku.php?id=cd${teamNumber}:${wikiPage}&do=edit`,
    {
      waitUntil: "networkidle0",
    }
  );

  // find text box, format text, and replace
  await (
    await page.$("#wiki__text")
  ).evaluate(
    (element, { data, sectionHeader, taskDescriptionHeader, wikiPage }) => {
      const tasks = data.tasks.reduce((string, task) => {
        // const date = new Date(Date.parse(task.dueDate));
        const taskTitle = task.taskName.trim()
          ? `[[${wikiPage}#${task.taskName}|${task.taskName}]]`
          : "";
        return `${string}|${taskTitle} |${task.person} |${task.status
          .replace("Waiting", ":WAITING:")
          .replace("Done", ":DONE:")
          .replace("Todo", ":TO-DO:")
          .replace("Not started", ":TASK:")
          .replace("In progress", ":INPROGRESS:")} |${
          task.currentProgress
        } |${new Date(Date.parse(task.dueDate)).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })} |${task.comments} |\n`;
      }, sectionHeader);
      const descriptions = data.tasks.reduce((string, task) => {
        return `${string}===${task.taskName}===\n>  ${task.taskDescription
          .replaceAll("\n", "\n>  ")
          .replaceAll("Note:", "**Note:**")}\n`;
      }, taskDescriptionHeader);
      element.value = element.value.replace(
        /\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\n[\s\S]+\n\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~/,
        `~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n${tasks}${descriptions}\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`
      );
    },
    { data, sectionHeader, taskDescriptionHeader, wikiPage }
  );

  await (
    await page.$("#edit__summary")
  ).evaluate(
    (element, { modifyDescription }) => {
      element.value = modifyDescription;
    },
    { modifyDescription }
  );

  // click save button
  page.$("#edbtn__save").then((submitEdit) => {
    submitEdit.click();
  });
  await page.waitForNavigation();
  // logout user from doku wiki
  page.$("a[title=Logout]").then((logout) => {
    logout.click();
    console.log("Successfully logged out");
  });
  await page.waitForNavigation();
  await browser.close();
  res.json({
    message: `${currentTimeDateString()} - Successfully updated Doku Wiki page '${wikiPage}'`,
  });
}

app.post("/update", updateDoku);

app.post("/status-update", async (req, res) => {
  const { username, password } = require("./credentials.json");
  const { text, wikiPage, statusPage, member, modifyDescription } = req.body;

  const { browser, page } = await loginDoku(username, password, wikiPage);

  await page.goto(
    `http://ug251.eecg.utoronto.ca/wiki297s/doku.php?id=cd${teamNumber}:${wikiPage}&do=edit`,
    {
      waitUntil: "networkidle0",
    }
  );

  // find text box, format text, and replace
  await (
    await page.$("#wiki__text")
  ).evaluate(
    async (element, { text, member }) => {
      let currText = element.value.match(
        /==============================\n(?<text>[\s\S]*)\\\\ \n\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~/
      );
      currText = currText.groups ? currText.groups.text : "";
      const updates = currText.split("\\\\ \n");
      updates.push(
        `**${member}:** (${new Date(Date.now()).toLocaleTimeString("en-US", {
          weekday: "short",
          day: "numeric",
          month: "short",
          hour12: true,
          minute: "2-digit",
          hour: "numeric",
        })}) ${text}`
      );
      element.value = element.value.replace(
        /==============================\n[\s\S]+\\\\ \n\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~/,
        `==============================\n${updates
          .slice(Math.max(updates.length - 10, 0))
          .join("\\\\ \n")}\\\\ \n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`
      );
    },
    { text, member }
  );

  await (
    await page.$("#edit__summary")
  ).evaluate(
    (element, { modifyDescription }) => {
      element.value = modifyDescription;
    },
    { modifyDescription }
  );
  page.$("#edbtn__save").then((submitEdit) => {
    submitEdit.click();
  });
  await page.waitForNavigation();

  await page.goto(
    `http://ug251.eecg.utoronto.ca/wiki297s/doku.php?id=cd${teamNumber}:${statusPage}&do=edit`,
    {
      waitUntil: "networkidle0",
    }
  );

  await (
    await page.$("#wiki__text")
  ).evaluate(
    async (element, { text, member }) => {
      console.log(element.value);
      let currText = element.value.match(
        /==============================\n(?<text>[\s\S]*)\n==============================/
      );
      currText = currText.groups ? currText.groups.text : [""];
      console.log(currText);
      const updates = currText.split("\\\\ \n");
      updates.push(
        `**${member}:** (${new Date(Date.now()).toLocaleTimeString("en-US", {
          weekday: "short",
          day: "numeric",
          month: "short",
          hour12: true,
          minute: "2-digit",
          hour: "numeric",
        })}) ${text}`
      );
      element.value = element.value.replace(
        /==============================\n[\s\S]*\n==============================/,
        `==============================\n${updates.join(
          "\\\\ \n"
        )}\n==============================`
      );
    },
    { text, member }
  );

  await (
    await page.$("#edit__summary")
  ).evaluate(
    (element, { modifyDescription }) => {
      element.value = modifyDescription;
    },
    { modifyDescription }
  );
  page.$("#edbtn__save").then((submitEdit) => {
    submitEdit.click();
  });
  await page.waitForNavigation();
  // logout user from doku wiki
  page.$("a[title=Logout]").then((logout) => {
    logout.click();
    console.log("Successfully logged out");
  });
  await page.waitForNavigation();
  await browser.close();
  res.json({
    message: `${currentTimeDateString()} - Successfully updated status on pages '${wikiPage} and ${statusPage}'`,
  });
});

app.get("/tasks", (req, res) => {
  console.log("cheese");
  fs.readFile("server/tasks/tasks.json", "utf-8", (err, data) => {
    if (err) {
      console.log(err);
      res.status(400);
    } else {
      res.json(JSON.parse(data.toString()));
    }
  });
});

app.post("/login", updateDoku);

app.listen(PORT, (req, res) => {
  console.log("Listening on port 5000!\n\n\n");
});

function sortTasks(tasks) {
  tasks.sort((task1, task2) => task1.createdAt - task2.createdAt);
}

function reviveDate(dateString) {
  return new Date(Date.parse(dateString));
}

// code from https://www.30secondsofcode.org/articles/s/javascript-object-comparison
const tasksEqual = (a, b) => {
  if (a === b) return true;
  if (a instanceof Date && b instanceof Date && isNaN(a) && isNaN(b))
    return true;
  if (a instanceof Date && b instanceof Date)
    return a.getTime() === b.getTime();
  if (!a || !b || (typeof a !== "object" && typeof b !== "object"))
    return a === b;
  if (a.prototype !== b.prototype) return false;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((k) => tasksEqual(a[k], b[k]));
};

async function checkAirtableUpdate() {
  const { username, password } = require("./credentials.json");
  const tasksFile = JSON.parse(fs.readFileSync("server/tasks/tasks.json"));
  const airTable = await fetchAirtable();
  tasksFile.tasks.forEach((task, index) => {
    tasksFile.tasks[index].dueDate = reviveDate(task.dueDate);
    tasksFile.tasks[index].lastModified = reviveDate(task.lastModified);
    tasksFile.tasks[index].createdAt = reviveDate(task.createdAt);
  });
  sortTasks(tasksFile.tasks);
  const leftover = tasksFile.tasks.filter((val, index) => {
    return !tasksEqual(
      val,
      airTable.find((task) => task.id == val.id)
    );
  });
  const airLeftover = airTable.filter((val, index) => {
    return !tasksEqual(
      val,
      tasksFile.tasks.find((task) => task.id == val.id)
    );
  });

  let modifyDescription = "";
  if (leftover.length === 0 && airLeftover.length === 0) {
    // if both are 0 the lists are identical
    process.stdout.write("\033[2A");
    process.stdout.clearLine();
    console.log(
      currentTimeDateString() + ": No change to tasks since last update"
    );
    process.stdout.write("\033[1B");

    return;
  } else {
    if (leftover.length < airLeftover.length) {
      // if cache has less items than air we created new items
      modifyDescription = leftover.reduce((prev, curr) => {
        return (
          prev + `${curr.lastModifiedBy} modified task: '${curr.taskName}'\n`
        );
      }, "");

      airLeftover.filter((val, index) => {
        return leftover.find((task) => task.id === val.id);
      });
      modifyDescription += airLeftover.reduce((prev, curr) => {
        return (
          prev + `${curr.lastModifiedBy} created task: '${curr.taskName}'\n`
        );
      }, "");
    } else if (airLeftover.length < leftover.length) {
      // if air has less items than cache we removed items
      // create description for all the tasks we modified
      modifyDescription = airLeftover.reduce((prev, curr) => {
        return (
          prev + `${curr.lastModifiedBy} modified task: '${curr.taskName}'\n`
        );
      }, "");

      // remove the tasks we modified from leftover
      leftover.filter((val, index) => {
        return leftover.find((task) => task.id === val.id);
      });
      // the rest of the tasks must be delete ones from cache so create description for them
      modifyDescription += leftover.reduce((prev, curr) => {
        return (
          prev + `${curr.lastModifiedBy} deleted task: '${curr.taskName}'\n`
        );
      }, "");
    } else {
      // corner cases I don't have to deal with (ex create and delete item at same time) or just regular updates
      modifyDescription = airLeftover.reduce((prev, curr) => {
        return (
          prev + `${curr.lastModifiedBy} modified task: '${curr.taskName}'\n`
        );
      }, "");
    }
    saveTasks({ tasks: airTable }, "server/tasks/tasks.json");
    console.log(mainPage);
    updateDoku(
      {
        body: {
          username,
          password,
          data: {
            tasks: airTable,
          },
          modifyDescription,
          wikiPage: mainPage,
          sectionHeader: `======Week of ${getMonday(
            new Date()
          )} - Tasks======\nUpdated: ${new Date(Date.now()).toLocaleTimeString(
            "en-US",
            {
              weekday: "long",
              year: "numeric",
              day: "numeric",
              month: "short",
              hour12: true,
              minute: "2-digit",
              hour: "numeric",
            }
          )}\n^ To Do ^ Name ^ Status ^ Current Progress ^ Due Date ^ Comments ^\n`,
        },
      },
      {
        json: (package) => {
          console.log(package);
          console.log("\n");
        },
      }
    ).catch((err) => {
      console.log(err);
    });
  }
}

checkAirtableUpdate();
cron.schedule("*/2 * * * *", checkAirtableUpdate);

async function updateArchivePage() {
  const { username, password } = require("./credentials.json");
  const archiveTable = require("./tasks/archive.json");
  const table = await fetchAirtable("Archive");

  archiveTable.tasks.forEach((task, index) => {
    archiveTable.tasks[index].dueDate = reviveDate(task.dueDate);
    archiveTable.tasks[index].lastModified = reviveDate(task.lastModified);
    archiveTable.tasks[index].createdAt = reviveDate(task.createdAt);
  });
  sortTasks(archiveTable.tasks);
  const leftover = archiveTable.tasks.filter((val, index) => {
    return !tasksEqual(
      val,
      table.find((task) => task.id == val.id)
    );
  });
  const airLeftover = table.filter((val, index) => {
    return !tasksEqual(
      val,
      archiveTable.tasks.find((task) => task.id == val.id)
    );
  });

  if (leftover.length === 0 && airLeftover.length === 0) {
    // if both are 0 the lists are identical
    process.stdout.write("\033[1A");
    process.stdout.clearLine();
    console.log(
      currentTimeDateString() + ": No change to archive since last update"
    );
    return;
  }
  saveTasks({ tasks: table }, "server/tasks/archive.json");
  updateDoku(
    {
      body: {
        username,
        password,
        data: {
          tasks: table,
        },
        modifyDescription: `Server updated archived tasks: ${currentTimeDateString()}`,
        wikiPage: "archive",
        sectionHeader: `======Archived Tasks before ${getMonday(
          new Date()
        )}======\nUpdated: ${new Date(Date.now()).toLocaleTimeString("en-US", {
          weekday: "long",
          year: "numeric",
          day: "numeric",
          month: "short",
          hour12: true,
          minute: "2-digit",
          hour: "numeric",
        })}\n^ To Do ^ Name ^ Status ^ Current Progress ^ Due Date ^ Comments ^\n`,
      },
    },
    {
      json: (package) => {
        console.log(package);
        console.log("\n");
      },
    }
  ).catch((err) => {
    console.log(err);
  });

  // TODO: move tasks to archive
}

updateArchivePage();
// scheduler for moving done tasks to archive page
// updateArchivePage();
cron.schedule("*/3 * * * *", updateArchivePage);

// catch all errors, I know, very bad but I don't have time to catch them
// separately in their specific scope even though its easy to enclose my
// async functions in try catch blocks
process.on("uncaughtException", (err) => {
  console.log(err);
});
