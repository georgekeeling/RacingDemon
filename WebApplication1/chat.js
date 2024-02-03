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

// the global connectionStarting is a dreadful bodge so that the onStartFunction can know
// what connection is being started. (there was a problem in uGroups.playBot3ConnectionReady)
// Typically the onStartFunction should begin with these two lines:
// restoreGlobals(connectionStarting.connectionId);
// connectionStarting = null;
var connectionStarting = null;
function startAny(onStartFunction) {
  if (connectionStarting != null) {
    alert("Attempt to start 2 connections simultaneously. chat.js");
    return;
  }
  connectionStarting = new signalR.HubConnectionBuilder()
    .withUrl("/chatHub")
    .configureLogging(new MyLogger())
    .build();
  console.log("chat, root: created connection, connection.start invoked");
  connectionStarting.start().then(onStartFunction);
  return connectionStarting;
}