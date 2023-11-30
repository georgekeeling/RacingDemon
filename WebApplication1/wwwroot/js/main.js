"use strict";
// (c) George Arthur Keeling, Berlin 2023
// here are the main objects
// some can be created immediately, others must wait until page
// After load createConnection is called
// once connection on (connection.start), Initialise is called 
var pack;
var table;
var sound;
var racingDemon;
var dragPileI = 0; // will be set to RDflyPile0 + playerI in rd.deal2()
var dragPile; // will be set to pile[dragPileI]
var mouse = new Mouse;
var uGroups;
var bot = new Bot;
function toPage(target) {
    document.getElementById("playPage").hidden = true;
    document.getElementById("setUpPage").hidden = true;
    document.getElementById(target).hidden = false;
}
function Initialise() {
    let elemPlay = document.getElementById("playButton");
    // Set up buttons should be en/disabled by uGroups.selGameChange in uGroups.showGroups()
    // alternatives for active / inactive <a> element
    elemPlay.outerHTML = '<span id="playButton" >Game</span>';
    // elemPlay.outerHTML = '<a id="playButton" href="javascript:toPage(\'playPage\')">Play</a>';
    racingDemon = new RacingDemon;
    table = new Table();
    pack = new Pack();
    sound = new Sound();
    uGroups = new UGroups;
}
//# sourceMappingURL=main.js.map