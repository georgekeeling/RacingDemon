"use strict";
// (c) George Arthur Keeling, Berlin 2024
// here are the main objects
// some can be created immediately, others must wait until page
// After load. Initialise is called
// then connection.start in chat.js gets called
// parsing the URL and other things take place from there
var pack: Pack;
var table: Table;
var sound: Sound;
var racingDemon: RacingDemon;
var dragPileI: number;        // will be set to RDflyPile0 + playerI in rd.deal2()
var dragPile: Pile;       // will be set to pile[dragPileI]
var mouse: Mouse;
var uGroups: UGroups;
var bot: Bot;
var connection;   // will be instance of HubConnection, comes out of chat.js

console.log("main, root: created mouse,bot");

function toPage(target) {
  document.getElementById("playPage").hidden = true;
  document.getElementById("setUpPage").hidden = true;
  document.getElementById(target).hidden = false;
}
function buttonPageEnable(buttonName: string, enable: boolean) : void {
  let elem = document.getElementById("playButton") as HTMLButtonElement;
  if (enable) {
    elem.disabled = false;
    elem.style.color = "white";
    elem.style.cursor = "pointer";
  } else {
    elem.disabled = true;
    elem.style.color = "gray";
    elem.style.cursor = "not-allowed";
  }
}
function createGlobals() {
  mouse = new Mouse;
  dragPileI = 0;
  bot = new Bot;
  racingDemon = new RacingDemon;
  table = new Table();

  pack = new Pack();
  sound = new Sound();
  uGroups = new UGroups;
}
function Initialise() {
  // Set up buttons should be en/disabled by uGroups.selGameChange in uGroups.showGroups()
  // alternatives for active / inactive <a> element
  buttonPageEnable("playButton", false);
  (document.getElementById("userName") as HTMLInputElement).focus();
  createGlobals();
  console.log("main, Initialise: created mouse,bot ... uGroups");
  connection = startAny(initialise2);
  declareMessages();
  addGlSaver();
}

function initialise2() {
  // assume here we only have one connection!
  connectionStarting = null;
  console.log("chat, start.then(func)");
  (document.getElementById("buttonCreate") as HTMLButtonElement).disabled = false;
  // sometimes we get here before TellMeGroups in userGroups is loaded.
  // Have seen it failing "1 times", but then its OK
  if (typeof (uGroups) != 'undefined') {
    uGroups.TellMeGroups();
    return;
  }
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


