"use strict";
// (c) George Arthur Keeling, Berlin 2023
function doTest() {
    testBotStarter();
}
//var doTest = 1;
var chooserA = 1;
function testBotStarter() {
    switch (chooserA++) {
        case 1:
            bot.startTimeOut = setTimeout(doSomething, 5000);
            console.log("start " + bot.startTimeOut);
            break;
        case 2:
            if (bot.startTimeOut != 0) {
                clearTimeout(bot.startTimeOut);
                console.log("cleared " + bot.startTimeOut);
                bot.startTimeOut = 0;
            }
            chooserA = 1;
            break;
    }
    function doSomething() {
        alert("something");
    }
}
function twoOuts() {
    // simulate two going out very close together
    // see d2024-02-03 scoring stuck before starting.docx
    // when separated by 100 ms proroduced lock up before sorting
    // fixed with introduction of racingDemon.processOut
    restoreGlobals(0);
    sendGroup("PlayerIsOut", uGroups.playerName);
    setTimeout(sendNext, 100);
    function sendNext() {
        restoreGlobals(1);
        sendGroup("PlayerIsOut", bot.name);
    }
}
var chooser = 1;
var con0id;
var con1id;
var con2id;
function testGlobals() {
    // test if startAny, addGlSaver, restoreGlobals works
    // Need breakpoints to inspect data at various points
    switch (chooser++) {
        case 1:
            console.log("testGlobals, case 1");
            con0id = connection.connectionId;
            createGlobals();
            connection = startAny(myNewConn1);
            table.lockLevel = 1;
            declareMessages();
            addGlSaver();
            break;
        case 2:
            console.log("testGlobals, case 2");
            createGlobals();
            connection = startAny(myNewConn2);
            table.lockLevel = 2;
            declareMessages();
            addGlSaver();
            restoreGlobals(0); // simulate message to other connection
            break;
        case 3:
            // test 3, structure of setTimeout connection handling
            restoreGlobals(0);
            uGroups.errorMessage("This is a test");
            restoreGlobals(1);
            return;
            // test 2, ping test gets correct connection on reply
            restoreGlobals(con1id);
            console.log("ping from " + connection.connectionId);
            send("Ping", "ping from con1, id = " + con1id);
            restoreGlobals(0); // simulates user action on mouse for example
            console.log("connection now " + connection.connectionId);
            return;
            // test 1, restore works by index or connection id
            console.log("testGlobals, case 3");
            restoreGlobals(0);
            restoreGlobals(con2id);
            restoreGlobals(con1id);
            restoreGlobals(2);
            restoreGlobals(con0id);
            break;
        default:
            console.log("testGlobals, default");
    }
}
function myNewConn1() {
    restoreGlobals(connectionStarting.connectionId);
    connectionStarting = null;
    console.log("new connection started " + connection.connectionId);
    con1id = connection.connectionId;
}
function myNewConn2() {
    restoreGlobals(connectionStarting.connectionId);
    connectionStarting = null;
    console.log("new connection started " + connection.connectionId);
    con2id = connection.connectionId;
}
function toggleBot() {
    const elemSel = document.getElementById("botType");
    if (bot.speed == 0) {
        elemSel.value = "2";
    }
    else {
        elemSel.value = "0";
    }
    bot.setType();
}
function aces6() {
    // put out six aces. A bit odd, but still
    let cardI = 0;
    for (let pileI = racingDemon.stockPileI + 1; pileI <= racingDemon.stockPileI + 6; pileI++) {
        const pile = table.piles[pileI];
        if (pile.cards.length > 0) {
            pile.endCard().cards52I = cardI;
            cardI += 13;
            if (cardI > 51) {
                cardI = 0;
            }
        }
    }
    table.showCards();
}
var makeException = false;
function induceException() {
    // induce exception somewhere in code
    makeException = true;
}
function errorTest() {
    // both come out on console, second one in red if chrome console.
    // No interaction with MyLogger in chat.js
    console.log("Testing console.error");
    console.error("This is an error");
}
function fatal() {
    alert("fatal error\nbla bla\nwindow will close");
    window.close();
}
function logCommonPiles(message) {
    console.log(message + " player: " + racingDemon.playerI);
    for (let pileI = RDcommonPile0; pileI < table.piles.length; pileI++) {
        const pile = table.piles[pileI];
        const cards = pile.cards;
        if (cards.length > 0) {
            let cardMess = "pile:" + pileI.toString(10) + " cards:" + cards.length.toString(10) + ": ";
            for (let cardI = 0; cardI < cards.length; cardI++) {
                cardMess += cards[cardI].cards52I.toString(10) + ", ";
            }
            console.log(cardMess);
        }
    }
}
function testScore() {
    const playersN = racingDemon.players.length;
    racingDemon.gameStateSet(GameState.GameOver);
    racingDemon.allScores = [];
    let rounds = 20;
    const totals = [0, 0, 0, 0];
    let s0 = 11; // multiple winners
    let s1 = 11;
    let s2 = 10;
    let s3 = 11;
    for (let roundI = 0; roundI < rounds; roundI++) {
        //const s0 = Math.floor(Math.random() * 20 - 5);  // random scores
        //const s1 = Math.floor(Math.random() * 20 - 5);
        //const s2 = Math.floor(Math.random() * 20 - 5);
        //const s3 = Math.floor(Math.random() * 20 - 5);
        racingDemon.allScores[roundI] = [s0, s1, s2, s3];
        for (let colI = 0; colI < 4; colI++) {
            totals[colI] += racingDemon.allScores[roundI][colI];
            if (totals[colI] >= 100) {
                table.showCards();
                return;
            }
        }
    }
    table.showCards();
}
function test2D() {
    racingDemon.roundScores = [12, 5, 17];
    racingDemon.allScores[racingDemon.allScores.length] = racingDemon.roundScores.slice();
    racingDemon.allScores[racingDemon.allScores.length] = racingDemon.roundScores.slice();
    let array4 = [1, 2, 3, 4];
    let array2D = [];
    array2D[0] = array4;
    array2D[1] = array4;
    console.log("array2D.l=" + array2D.length);
    console.log("array2D[0].l=" + array2D[0].length);
    array2D[0][1] = 3; // changes array2D[1][1]
    console.log("array2D[0][1] =" + array2D[0][1]);
    console.log("array2D[1][1] =" + array2D[1][1]);
    array4 = [1, 2, 3, 4];
    array2D[0] = array4.slice();
    array2D[1] = array4.slice();
    array2D[0][1] = 3; // does not array2D[1][1]
    console.log("array2D[0][1] =" + array2D[0][1]);
    console.log("array2D[1][1] =" + array2D[1][1]);
}
function textTest() {
    table.ctx.fillStyle = "#FF0000";
    table.ctx.fillRect(0, 0, table.width, table.height);
    table.ctx.font = "30px Cursive";
    table.ctx.textAlign = "left";
    table.ctx.fillStyle = "#ffffc8"; // sickly yellow from colour picker  https://g.co/kgs/JspJG1
    table.ctx.font = "30px Cursive";
    table.writeText("gydt 30px Cursive", 0, table.height * .0);
    table.ctx.font = "20px Cursive";
    table.writeText("gydt 20px Cursive", 0, table.height * .1);
    table.ctx.font = "8px Cursive";
    table.writeText("gydt 8px Cursive", 0, table.height * .2);
    table.ctx.font = "30px Fantasy";
    table.writeText("gydt 30px Fantasy", 0, table.height * .3);
    table.ctx.font = "20px Fantasy";
    table.writeText("gydt 20px Fantasy", 0, table.height * .4);
    table.ctx.font = "8px Fantasy";
    table.writeText("gydt 8px Fantasy", 0, table.height * .5);
    table.ctx.font = "30px Monospace";
    table.writeText("gydt 30px Monospace", 0, table.height * .6);
    table.ctx.font = "20px Monospace";
    table.writeText("gydt 20px Monospace", 0, table.height * .7);
    table.ctx.font = "8px Monospace";
    table.writeText("gydt 8px Monospace", 0, table.height * .8);
    table.ctx.font = "30px Sans-Serif";
    table.writeText("gydt 30px Sans-Serif", table.width / 2, table.height * .0);
    table.ctx.font = "20px Sans-Serif";
    table.writeText("gydt 20px Sans-Serif", table.width / 2, table.height * .1);
    table.ctx.font = "8px Sans-Serif";
    table.writeText("gydt 8px Sans-Serif", table.width / 2, table.height * .2);
    table.ctx.font = "30px Serif";
    table.writeText("gydt 30px Serif", table.width / 2, table.height * .3);
    table.ctx.font = "20px Serif";
    table.writeText("gydt 20px Serif", table.width / 2, table.height * .4);
    table.ctx.font = "8px Serif";
    table.writeText("gydt 8px Serif", table.width / 2, table.height * .5);
}
function readySteadyGo() {
    clearCommon();
    table.startGame2();
}
function clearCommon() {
    const margin = table.cardHeight * 1.2 + table.yStep;
    const wh = table.width - margin * 2;
    table.ctx.fillStyle = "#FF0000"; // red
    table.ctx.fillRect(margin, margin, wh, wh);
}
function endGame(cPilesN) {
    // set up cPilesN common piles so that lots of cards on table by random players
    // must lock all bots while this is happening
    // !!!! only works no cards have been played
    if (typeof (cPilesN) == 'undefined') {
        cPilesN = 15;
    }
    if (racingDemon.gameState != GameState.Playing) {
        alert("Game must be playing");
        return;
    }
    for (let playerI = 0; playerI < glSavers.length; playerI++) {
        glSavers[playerI].table.lock("endGame"); // lock all
    }
    const fcpI = RDhomePiles * RDmaxPlayers; // first common pileI
    const playersN = racingDemon.players.length;
    const xBase = table.commonArea.left + table.yStep;
    const yBase = table.cardHeight * 1.8;
    const xyOffset = table.cardWidth * 2.2;
    let cardImax = 13;
    // always one unused common pile
    if (cPilesN > playersN * 4 - 1) {
        cPilesN = playersN * 4 - 1;
    }
    for (let i = 0; i < cPilesN; i++) {
        let pile = table.piles[i + fcpI];
        let cardAngle = 0;
        pile.x = xBase + (i % 4) * xyOffset;
        pile.y = yBase + Math.floor(i / 4) * xyOffset;
        pile.area.left = pile.x;
        pile.area.top = pile.y;
        pile.area.right = pile.x + table.cardWidth;
        pile.area.bottom = pile.y + table.cardHeight;
        for (let cardI = 0; cardI < cardImax; cardI++) {
            let playerI = Math.floor(Math.random() * playersN);
            pile.addCardP(playerI, cardI, pile.x, pile.y, true, cardAngle);
            cardAngle += 10;
        }
        cardImax--;
        pile.broadcast(i + fcpI);
    }
    cheatDemon();
    for (let playerI = 0; playerI < glSavers.length; playerI++) {
        glSavers[playerI].table.unlock("endGame"); // unlock all
    }
}
function cheatDemon() {
    // to hurry everything along, reduce demon pile
    restoreGlobals(0); // 0 for player's demon, 1 for bot's
    const demonPileI = racingDemon.playerI * RDhomePiles + 2;
    const pile = table.piles[demonPileI];
    pile.cards.length = 3;
    let card52I = 12; // king
    for (let cardI = 0; cardI < pile.cards.length; cardI++) {
        pile.cards[cardI].cards52I = card52I--;
    }
    table.showCards();
    pile.broadcast(demonPileI);
}
function tableWidth() {
    // discover table width, was used ub gls,cs 
    console.log("table width = " + table.width + ". Scaled = " + (table.width / table.cardScale));
}
function drawName() {
    // draw rotated name. Obviously very awkward and it looks crap
    let nameXY = table.width * .8;
    table.ctx.save();
    table.ctx.font = "10px Sans-Serif";
    table.ctx.textAlign = "left";
    table.ctx.fillStyle = "#ffffc8";
    let nameAngle = -1.5708;
    table.ctx.translate(nameXY, nameXY);
    table.ctx.rotate(nameAngle);
    table.ctx.fillText("player Z", 0, 0);
    table.ctx.restore();
}
function pingPile(pileI) {
    let bCards = [];
    let bCardI = 0;
    for (let card of table.piles[pileI].cards) {
        bCards[bCardI++] = new Bcard(card.playerI, card.cards52I, card.x, card.y, card.faceUp, card.angle);
    }
    send("PingPile", bCards);
}
function broadcastPile(pileI) {
    pileI += racingDemon.playerI * 8;
    table.piles[pileI].broadcast(pileI);
}
//# sourceMappingURL=tsTest.js.map