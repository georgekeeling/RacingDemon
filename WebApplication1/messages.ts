"use strict";
// (c) George Arthur Keeling, Berlin 2023

// handles messages out (a simplification) and
// sets up messages in to 
// 1) restore globals for the connection 
// 2) call the proper function (or do whatever, if trivial)


/** invokes a hub method (sends a message to the server)
 * @param methodName the name of the method!
 * @param args any number of arguments of any type (even arrays of objects)
 */
function send(methodName: string, ...args: any[]) {     // see spread and rest syntax Mozilla
  connection.invoke(methodName, ...args).catch(function (err) {
    return console.error(err.toString());
  });
}
/** sends a message to the server, with group (game) name as first argument
 * 
 * @param methodName method name (argument 0 to commection.invoke)
 * @param args arguments 2,3,... any number of any type (even arrays of objects)
 */
function sendGroup(methodName: string, ...args: any[]){
  connection.invoke(methodName, uGroups.myGroup, ...args).catch(function (err) {
    return console.error(err.toString());
  });
}
// ********************
function declareMessages(){
  console.log("messages, declareMessages: connection.on() × 22-ish");
  // User and group messages (set up)
  connection.on("GroupList", function (gList: Group[]) {
    restoreGlobals(this.connectionId);
    uGroups.GroupList(gList);
  });

  connection.on("SendToGroup", function (message: string) {
    restoreGlobals(this.connectionId);
    uGroups.infoMessage("Group message: " + message);
  });
  connection.on("JoinGroupRejected", function () {
    restoreGlobals(this.connectionId);
    uGroups.JoinGroupRejected();
  });
  connection.on("JoinGroupAccepted", function () {
    restoreGlobals(this.connectionId);
    uGroups.JoinGroupAccepted();
  });
  connection.on("PlayersInGame", function (playerNames: string[]) {
    restoreGlobals(this.connectionId);
    uGroups.PlayersInGame(playerNames);
  });

  connection.on("PlayerNr", function (playerNr: number) {
    restoreGlobals(this.connectionId);
    uGroups.PlayerNr(playerNr);
  });

  connection.on("NameOK", function () {
    restoreGlobals(this.connectionId);
    uGroups.NameOK();
  });
  connection.on("NameError", function () {
    restoreGlobals(this.connectionId);
    uGroups.NameError();
  });
  connection.on("NameOKBot", function () {
    restoreGlobals(this.connectionId);
    uGroups.NameOKBot();
  });
  connection.on("NameErrorBot", function () {
    restoreGlobals(this.connectionId);
    uGroups.NameErrorBot();
  });

  // ******************
  // other messages - playing the game
  connection.on("RequestPiles", function () {
    restoreGlobals(this.connectionId);
    for (let pileI = racingDemon.playerI * RDhomePiles;
      pileI < racingDemon.playerI * RDhomePiles + RDhomePiles; pileI++) {
      table.piles[pileI].broadcast(pileI);
    }
  });

  connection.on("PileBroadcastIn", function (pileI: number, pileX, pileY, bCards: Bcard[]) {
    //console.log("PileBroadcastIn to player:" + racingDemon.playerI + " pile:" + pileI + " x,y:" +
    //  Math.round(pileX) + "," + Math.round(pileY) + " bCards:" + bCards.length);
    //if (pileI == dragPileI || (pileI >= racingDemon.stockPileI && pileI < racingDemon.stockPileI + RDhomePiles)) {
    //  console.log("ERROR? PileBroadcastIn to player: " + racingDemon.playerI +
    //    " own pile:" + pileI + " len:" + table.piles[pileI].cards.length + 
    //    " x,y:" + Math.round(pileX) + "," + Math.round(pileY) +
    //    " bCards len:" + bCards.length);
    //}
    restoreGlobals(this.connectionId);
    table.piles[pileI].receive(pileI, pileX, pileY, bCards);
  });

  connection.on("LandingDenied", function (pileI: number, reason: number) {
    // pileI = -1 if landing was off table, otherwise pileI is pile that landing was too close to
    restoreGlobals(this.connectionId);
    console.log("p" + racingDemon.playerI + " LandingDenied " + pileI + " reason " + reason);
    mouse.dragAbortFromServer(pileI, reason);
  });

  connection.on("LandingAccepted", function (pileI: number) {
    restoreGlobals(this.connectionId);
    console.log("p" + racingDemon.playerI + " LandingAccepted " + pileI);
    mouse.dragSuccess();
  });
  connection.on("StartGame2", function () {
    restoreGlobals(this.connectionId);
    table.startGame2();
  });
  connection.on("ActionsAfterOut", function (playerName: string) {
    restoreGlobals(this.connectionId);
    racingDemon.actionsAfterOut(playerName);
  });
  connection.on("ReadyToDance", function () {
    restoreGlobals(this.connectionId);
    racingDemon.readyToDanceN++;
    console.log("player " + racingDemon.playerI + ". rd.readyToDance " + racingDemon.readyToDanceN);
  });
  connection.on("ReadyToSort", function (lcpPileI: number, lcpX: number, lcpY: number) {
    restoreGlobals(this.connectionId);
    racingDemon.ReadyToSort(lcpPileI, lcpX, lcpY);
  });
  connection.on("AddPoint", function (playerI: number) {
    restoreGlobals(this.connectionId);
    racingDemon.roundScores[playerI]++;
  });
  connection.on("ReadyToScore", function () {
    restoreGlobals(this.connectionId);
    racingDemon.readyToScoreN++;
    console.log("player " + racingDemon.playerI + ". rd.readyToScore " + racingDemon.readyToScoreN);
  });
  connection.on("PlayerDeparted", function (deserter: string) {
    restoreGlobals(this.connectionId);
    racingDemon.playerDeparted(deserter);
  });

  // test and diagnostic
  connection.on("Console", function (message: string) {
    restoreGlobals(this.connectionId);
    console.log("p" + racingDemon.playerI + " from server " + message);
  });
  connection.on("pingBack", function (message: string) {
    restoreGlobals(this.connectionId);
    console.log("pingBack on con id  = " + connection.connectionId
      + " from " + this.connectionId);
    console.log("pingBack " + message);
  });

}
