"use strict";
// (c) George Arthur Keeling, Berlin 2023
function doTest() {
  uGroups.playBot();
  // endGame(15);
}
//var doTest = 1;
function toggleBot() {
  const elemSel = document.getElementById("botType") as HTMLSelectElement;
  if (bot.speed == 0) {
    elemSel.value = "2";
  } else {
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

function logCommonPiles(message: string) {
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
  let s0 = 11;      // multiple winners
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
  array2D[0][1] = 3;    // changes array2D[1][1]
  console.log("array2D[0][1] =" + array2D[0][1]);
  console.log("array2D[1][1] =" + array2D[1][1]);
  array4 = [1, 2, 3, 4];
  array2D[0] = array4.slice();
  array2D[1] = array4.slice();
  array2D[0][1] = 3;    // does not array2D[1][1]
  console.log("array2D[0][1] =" + array2D[0][1]);
  console.log("array2D[1][1] =" + array2D[1][1]);

}
function textTest() {
  table.ctx.fillStyle = "#FF0000";
  table.ctx.fillRect(0, 0, table.width, table.height);
  table.ctx.font = "30px Cursive";
  table.ctx.textAlign = "left";
  table.ctx.fillStyle = "#ffffc8";   // sickly yellow from colour picker  https://g.co/kgs/JspJG1

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
function endGame(cPilesN?: number) {
  // set up cPilesN common piles so that lots of cards on table by random players
  if (typeof (cPilesN) == 'undefined') {
    cPilesN = 15;
  }
  if (racingDemon.gameState != GameState.Playing) {
    alert("Game must be playing");
    return;
  }
  const fcpI = RDhomePiles * RDmaxPlayers;    // first common pileI
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
  const demonPileI = racingDemon.playerI * RDhomePiles + 2;
  const pile = table.piles[demonPileI];
  pile.cards.length = 3;
  cheatDemon();
}
function cheatDemon() {
  // to hurry everything along
  const demonPileI = racingDemon.playerI * RDhomePiles + 2;
  const pile = table.piles[demonPileI];
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
  table.ctx.fillText("player Z", 0,0);
  table.ctx.restore();
}
function pingPile(pileI: number) {
  let bCards: Bcard[] = [];
  let bCardI = 0;
  for (let card of table.piles[pileI].cards) {
    bCards[bCardI++] = new Bcard(card.playerI, card.cards52I, card.x, card.y, card.faceUp, card.angle);
  }
  send("PingPile", bCards);
}
connection.on("pingPileBack", function (bCardsBack: Bcard[]) {
  console.log("pingArrayBack size " + bCardsBack.length);
});

var soundCount = 0;
function soundTest() {
  switch (soundCount) {
    case 0:
      sound.playDingBot();
      break;
    case 1:
      sound.sayReady();
      break;
    case 2:
      sound.soundDing();
      break;
    default:
      soundCount = -1;
  }
  soundCount++;
}

const startTimeProg = new Date();
var startTimeMs = startTimeProg.getTime();
var milliSeconds: number;
var TXer = false;

function pseudoBot() {
  // d2023-08-24 slow bot
  const startTime = new Date();
  startTimeMs = startTime.getTime();
  TXer = true;
  sound.playDingBot();
  const funcId = setInterval(pingArray, 1000);
}
function pingArray() {
  const now = new Date();
  const elapsed = now.getTime() - startTimeMs;
  const arr1 = [elapsed.toString(), 'c', 'xxx', 'yyyy'];
  console.log("TX at " + elapsed);
  sendGroup("PingArray", arr1);
}
connection.on("pingArrayBack", function (arrayBack: string[]) {
  const now = new Date();
  const elapsed = now.getTime() - startTimeMs;
  let elapsed2 = arrayBack[0];
  console.log("RX at " + elapsed + " from " + elapsed2);
  elapsed2 = elapsed2.substring(0, elapsed2.length - 3);
  (document.getElementById("incomingMessage") as HTMLDivElement).innerText = elapsed2;
});

function pseudoBot2() {
  const startTime = new Date();
  startTimeMs = startTime.getTime();
  const funcId = setInterval(logIt, 1000);
}
function logIt(){
  const now = new Date();
  const elapsed = now.getTime() - startTimeMs;
  console.log("TX at " + Math.round(elapsed / 1000));
}
function broadcastPile(pileI: number) {
  pileI += racingDemon.playerI * 8;
  table.piles[pileI].broadcast(pileI);
}

function ping() {
  send("ping", "Hello");
}

connection.on("pingBack", function (myCID: string) {
  console.log("pingBack, I am " + myCID);
  uGroups.infoMessage("pingBack, I am " + myCID);
});

class TestData {
  i = 1;
  s = "hello";
  r = 1.2;
  b: boolean;
  constructor(i: number, s: string, r: number, b:boolean) {
    this.i = i;
    this.s = s;
    this.r = r;
    this.b = b;
  }
}
var testStartT = new Date();
// array of  1 took  8 ms
// array of 40 took 19 ms 
function pingData() {
  let test = new TestData(22, "hello world", 1.333, true);
  let testArray: TestData[] = [];
  let flipper = true;
  let numInArray = 1;
  for (let i = 0; i < numInArray; i++) {
    testArray[i] = new TestData(i * 10 + 1, "hello world" + i, i * 1.333 + 22, flipper);
    flipper = !flipper;
  }
  testStartT = new Date();
  send("PingData", 22, testArray);
}

connection.on("pingDataBack", function (numBack: number, dataBack: TestData[]) {
  let endT = new Date();
  console.log(numBack + " " + dataBack.length);
  console.log("That took " + (endT.getTime() - testStartT.getTime()) + " ms")
  for (let i = 0; i < dataBack.length; i++) {
    console.log("data back " + dataBack[i].i + " " + dataBack[i].s + " " + dataBack[i].r + " " + dataBack[i].b);
  }
});


