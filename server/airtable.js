const Airtable = require("airtable");
const { airtableKey, airtableBase } = require("./credentials.json");
const { airtableBaseName } = require("./config.json");

Airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: airtableKey,
});
const base = Airtable.base(airtableBase);

function parseMember(member) {
  if (!Array.isArray(member ?? [])) return member.name;
  return (member ?? [{ name: "Not Assigned" }])
    .map((person) => {
      return person.name;
    })
    .join(", ");
}

module.exports.fetchAirtable = async function fetchAirtable(view = "Buffet Menu") {
  const tasks = [];
  try {
    const response = await base(airtableBaseName).select({
      view: view,
    });
    await response.eachPage((records, fetchNextPage) => {
      records.forEach(({ id, fields }) => {
        function adjustForTimezone(date) {
          var timeOffsetInMS = date.getTimezoneOffset() * 60000;
          date.setTime(date.getTime() + timeOffsetInMS);
          return date;
        }

        tasks.push({
          taskName: fields["Task"] ?? "",
          taskDescription: fields["Task Description"] ?? "",
          person: parseMember(fields["Person"]),
          status: fields["Status"] ?? "",
          currentProgress: fields["Current Progress"] ?? "",
          dueDate: adjustForTimezone(new Date(fields["Due Date"])),
          comments: fields["Comments"] ?? "",
          lastModifiedBy: parseMember(fields["Last Modified By"]),
          lastModified: adjustForTimezone(new Date(fields["Last Modified"])),
          createdBy: parseMember(fields["Created By"]),
          createdAt: adjustForTimezone(new Date(fields["Created"])),
          id: id,
        });
      });
      fetchNextPage();
    });
    tasks.sort((task1, task2) => task1.createdAt - task2.createdAt);
    return tasks;
  } catch (err) {
    console.log(err);
  }
};
