"use strict";
// (c) George Arthur Keeling, Berlin 2024
// here globals get saved and restored 
// there is one set of globals for each connection or (virtual) player
// glSaver[0] always contains globals for real player. Created at start up
// Others are bots, created later

class GlobalSaver {
  pack: Pack;
  table: Table;
  sound: Sound;
  racingDemon: RacingDemon;
  dragPileI: number;
  dragPile: Pile;
  mouse: Mouse;
  uGroups: UGroups;
  bot: Bot;
  connection;
}
var glSavers: GlobalSaver[] = [];
function addGlSaver(): void {
  let glsI = glSavers.length;
  glSavers[glsI] = new GlobalSaver;
  saveGlobals(glsI);
}
function saveGlobals(param): void {
  let glsI = findGlobals(param);
  let theSaver = glSavers[glsI];
  theSaver.pack = pack;
  theSaver.table = table;
  theSaver.sound = sound;
  theSaver.racingDemon = racingDemon;
  theSaver.dragPileI = dragPileI;
  theSaver.dragPile = dragPile;
  theSaver.mouse = mouse;
  theSaver.uGroups = uGroups;
  theSaver.bot = bot;
  theSaver.connection = connection;
}
function restoreGlobals(param): void {
  // param is either eonnectionId or index into glSaver
  let connectionId = "";
  let glsI = -1;
  if (typeof (param) == "string") {
    connectionId = param;
    for (glsI = 0; glsI < glSavers.length; glsI++) {
      if (glSavers[glsI].connection.connectionId == connectionId) {
        break;
      }
    }
    if (glsI >= glSavers.length) {
      alert("Fatal error in globalsSaver, lost / unsaved connection");
      return;
    }
  } else {
    glsI = param;
  }
  glsI = findGlobals(param);
  let theSaver = glSavers[glsI];
  pack = theSaver.pack;
  table = theSaver.table;
  sound = theSaver.sound;
  racingDemon = theSaver.racingDemon;
  dragPileI = theSaver.dragPileI;
  dragPile = theSaver.dragPile;
  mouse = theSaver.mouse;
  uGroups = theSaver.uGroups;
  bot = theSaver.bot;
  connection = theSaver.connection;
}

function findGlobals(param): number {
  let connectionId = "";
  let glsI = -1;
  if (typeof (param) == "string") {
    connectionId = param;
    for (glsI = 0; glsI < glSavers.length; glsI++) {
      if (glSavers[glsI].connection.connectionId == connectionId) {
        break;
      }
    }
    if (glsI >= glSavers.length) {
      alert("Fatal error in findGlobals, lost / unsaved connection");
      return -1;
    }
  } else {
    glsI = param;
  }
  return glsI;
}

