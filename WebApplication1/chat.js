"use strict";
// (c) George Arthur Keeling, Berlin 2023

class MyLogger {
  // see https://learn.microsoft.com/en-us/aspnet/core/signalr/diagnostics?view=aspnetcore-7.0#javascript-client-logging
  // do this to catch disconnect error due to sleepy client. When client wakes it is disconnected
  // See "..\V Studio notes\demon debug\d2023-07-16a\d2023-07-16a overview.docx"

  // it also pops up when other errors occur with very misleading message
  // see d2023-07-16a overview.docx for example (under Catch at end)
  
  log(logLevel, message) {
    // Use `message` and `logLevel` to record the log message to your own system
    //// line 274 of signalr.js defines var LogLevel; which can be
    // Trace = 0  (very common)
    // Debug = 1
    // Information = 2
    // Warning = 3
    // Error = 4
    // Critical = 5
    // None = 6 
    if (logLevel >= 4) {
      console.error("Log level " + logLevel + " " + message);
      alert("Fatal error level " + logLevel + "\n" + message +
        "\nSee code in chat.js MyLogger.log" + "\nPlease close window");
      window.close();
    }
    //console.error("My logging level " + logLevel + " " + message);
  }
}

var connection = new signalR.HubConnectionBuilder()
  .withUrl("/chatHub")
  .configureLogging(new MyLogger())
  .build();
// Disable create button until connection on
document.getElementById("buttonCreate").disabled = true;


connection.start().then(function () {
  document.getElementById("buttonCreate").disabled = false;
  // sometimes we get here before TellMeGroups in userGroups is loaded.
  // Have seen it failing "1 times", but then its OK
  if (typeof (uGroups) != 'undefined') {
    uGroups.TellMeGroups();
  } else {
    let tries = 1;
    const id = setInterval(retryTell, 500);

    function retryTell() {
      console.log("TellMeGroups absent " + tries + " times")
      if (typeof (uGroups) != 'undefined') {
        uGroups.TellMeGroups();
        clearInterval(id);
        return;
      }
      tries++;
      if (tries > 10) {
        alert("uGroups.TellMeGroups  absent 10 times");
        clearInterval(id);
        return;
      }
    }
  }
}).catch(function (err) {
  return console.error(err.toString());
});

