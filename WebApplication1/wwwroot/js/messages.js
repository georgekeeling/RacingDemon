"use strict";
// (c) George Arthur Keeling, Berlin 2023
// handles messages out (a simplification) and
// messages in and calls the proper function ASAP (unless it's trivial)
/** invokes a hub method (sends a message to the server)
 * @param methodName the name of the method!
 * @param args any number of arguments of any type (even arrays of objects)
 */
function send(methodName, ...args) {
    connection.invoke(methodName, ...args).catch(function (err) {
        return console.error(err.toString());
    });
}
/** sends a message to the server, with group (game) name as first argument
 *
 * @param methodName method name (argument 0 to commection.invoke)
 * @param args arguments 2,3,... any number of any type (even arrays of objects)
 */
function sendGroup(methodName, ...args) {
    connection.invoke(methodName, uGroups.myGroup, ...args).catch(function (err) {
        return console.error(err.toString());
    });
}
// ********************
// User and groups(set up)
connection.on("GroupList", function (gList) {
    uGroups.GroupList(gList);
});
connection.on("SendToGroup", function (message) {
    uGroups.infoMessage("Group message: " + message);
});
connection.on("JoinGroupRejected", function () {
    uGroups.JoinGroupRejected();
});
connection.on("JoinGroupAccepted", function () {
    uGroups.JoinGroupAccepted();
});
connection.on("PlayersInGame", function (playerNames) {
    uGroups.PlayersInGame(playerNames);
});
connection.on("PlayerNr", function (playerNr) {
    uGroups.PlayerNr(playerNr);
});
connection.on("NameOK", function () {
    uGroups.NameOK();
});
connection.on("NameError", function () {
    uGroups.NameError();
});
connection.on("NameOK2", function () {
    uGroups.NameOK2();
});
connection.on("NameError2", function () {
    uGroups.NameError2();
});
// ******************
// others - playing the game
connection.on("RequestPiles", function () {
    for (let pileI = racingDemon.playerI * RDhomePiles; pileI < racingDemon.playerI * RDhomePiles + RDhomePiles; pileI++) {
        table.piles[pileI].broadcast(pileI);
    }
});
connection.on("PileBroadcastIn", function (pileI, pileX, pileY, bCards) {
    //console.log("PileBroadcastIn to player:" + racingDemon.playerI + " pile:" + pileI + " x,y:" +
    //  Math.round(pileX) + "," + Math.round(pileY) + " bCards:" + bCards.length);
    //if (pileI == dragPileI || (pileI >= racingDemon.stockPileI && pileI < racingDemon.stockPileI + RDhomePiles)) {
    //  console.log("ERROR? PileBroadcastIn to player: " + racingDemon.playerI +
    //    " own pile:" + pileI + " len:" + table.piles[pileI].cards.length + 
    //    " x,y:" + Math.round(pileX) + "," + Math.round(pileY) +
    //    " bCards len:" + bCards.length);
    //}
    table.piles[pileI].receive(pileI, pileX, pileY, bCards);
});
connection.on("LandingDenied", function (pileI, reason) {
    // pileI = -1 if landing was off table, otherwise pileI is pile that landing was too close to
    console.log("pl " + racingDemon.playerI + ". LandingDenied " + pileI + " reason " + reason);
    mouse.dragAbortFromServer(pileI, reason);
});
connection.on("LandingAccepted", function (pileI) {
    console.log("pl " + racingDemon.playerI + ".LandingAccepted " + pileI);
    mouse.dragSuccess();
});
connection.on("StartGame2", function () {
    table.startGame2();
});
connection.on("ActionsAfterOut", function (playerName) {
    racingDemon.actionsAfterOut(playerName);
});
connection.on("ReadyToDance", function () {
    racingDemon.readyToDanceN++;
    console.log("player " + racingDemon.playerI + ". rd.readyToDance " + racingDemon.readyToDanceN);
});
connection.on("ReadyToSort", function (lcpPileI, lcpX, lcpY) {
    racingDemon.ReadyToSort(lcpPileI, lcpX, lcpY);
});
connection.on("AddPoint", function (playerI) {
    racingDemon.roundScores[playerI]++;
});
connection.on("ReadyToScore", function () {
    racingDemon.readyToScoreN++;
    console.log("player " + racingDemon.playerI + ". rd.readyToScore " + racingDemon.readyToScoreN);
});
connection.on("PlayerDeparted", function (deserter) {
    racingDemon.playerDeparted(deserter);
});
connection.on("Console", function (message) {
    console.log("pl " + racingDemon.playerI + ": " + message);
});
//# sourceMappingURL=messages.js.map