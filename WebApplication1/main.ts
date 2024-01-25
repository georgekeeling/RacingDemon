"use strict";
// (c) George Arthur Keeling, Berlin 2023
// here are the main objects
// some can be created immediately, others must wait until page
// After load. Initialise is called
// then connection.start in chat.js gets called
// parsing the URL and other things take place from there
var pack: Pack;
var table: Table;
var sound: Sound;
var racingDemon: RacingDemon;
var dragPileI = 0;        // will be set to RDflyPile0 + playerI in rd.deal2()
var dragPile: Pile;       // will be set to pile[dragPileI]
var mouse = new Mouse;
var uGroups: UGroups;
var bot = new Bot;
console.log("main, root: created mouse,bot");

function toPage(target) {
  document.getElementById("playPage").hidden = true;
  // in my test branch
  document.getElementById("setUpPage").hidden = true;
  document.getElementById(target).hidden = false;
}

function Initialise() {
  let elemPlay = document.getElementById("playButton") as HTMLAnchorElement;

  // Set up buttons should be en/disabled by uGroups.selGameChange in uGroups.showGroups()
  // alternatives for active / inactive <a> element
  elemPlay.outerHTML = '<span id="playButton" >Game</span>';
  // elemPlay.outerHTML = '<a id="playButton" href="javascript:toPage(\'playPage\')">Play</a>';
  (document.getElementById("userName") as HTMLInputElement).focus();
  racingDemon = new RacingDemon;
  table = new Table();

  pack = new Pack();
  sound = new Sound();
  uGroups = new UGroups;
  console.log("main, Initialise: created racingDemon,bot, table .. uGroups");
  
}  


