"use strict";
// (c) George Arthur Keeling, Berlin 2023

class Bot {
  // class for all things bot
  speed = 0;      // 0 = human, 1 = slow bot, 3 = fast bot
  name = "";
  createStage = 0;    // 0, not creating bot, 1 creating user who wants a bot,
                      // 2 creating bot. 4 created
  active = false;     // when true, no canvas updates will occur
                      // except via messaging on other players canvas
  sentPlayerIsOut = false;
  stackedWasteSuccess = 0;
  stackedWasteFailed = 0;
  repeatCount = 0;
  constructor() {
    const elemSel = document.getElementById("botType") as HTMLSelectElement;
    elemSel.value = "0";
  }
  setType() {
    const elemSel = document.getElementById("botType") as HTMLSelectElement;
    const elemPlayBot = document.getElementById("buttonPlayBot") as HTMLButtonElement;
    if (racingDemon.gameState != GameState.Waiting) {
      elemSel.value = this.speed.toString();
      return;
    }
    let speed = Number(elemSel.value);
    if (speed != this.speed) {
      this.speed = speed;
      if (speed != 0) {
        elemPlayBot.disabled = false;
      } else {
        elemPlayBot.disabled = true;
      }
    }
  }

  launchBot() {
    const myConID = connection.connectionId;
    switch (this.speed) {
      case 1:
        setInterval(doSomething, 5000);
        break;
      case 2:
        setInterval(doSomething, 2000);
        break;
      case 3:
        setInterval(doSomething, 1000);
        break;
    }

    function doSomething() {
      restoreGlobals(myConID);
      if (typeof (dragPile) == 'undefined') {
        console.log("bot: dragPile 'undefined'");
        return;
      }
      if (dragPile.cards.length > 0) {
        // must be busy like in sorting 
        console.log("bot: dragPile.cards.length = " + dragPile.cards.length);
        return;
      }

      if (racingDemon.emptyDemon() && !bot.sentPlayerIsOut) {
        bot.sentPlayerIsOut = true;     // Must only send once !
        console.log("bot sending PlayerIsOut");
        sendGroup("PlayerIsOut", bot.name);
        // racingDemon.out(); cannot use that because it would use plaer's name not bot's
        return;
      }
      if ((document.getElementById("startButton") as HTMLButtonElement).disabled == false) {
        // restart if round / game ended or if 4 players present (and totally new game can commence)
        if (racingDemon.gameState == GameState.ShowingScores || racingDemon.gameState == GameState.GameOver) {
          bot.startGameInAminute();
          return;
        }
        if (racingDemon.players.length == 4) {
          bot.startGameInAminute();
          return;
        }
        return; // do nothing 
      }

      if (racingDemon.gameState != GameState.Playing) {
        return;
      }

      console.log("bot" + racingDemon.playerI + ": sw s/f " + bot.stackedWasteSuccess + " / " + bot.stackedWasteFailed);
      if (bot.playToCommon()) {
        bot.repeatCount = 0;
        return;
      }
      if (bot.moveDemonToWork()) {
        bot.repeatCount = 0;
        return;
      }
      if (bot.stackWork()) {
        bot.repeatCount = 0;
        return;
      }
      if (bot.repeatCount >= 2) {
        // seem to be stuck: Try moving card from waste to work pile
        console.log("bot: special measures");
        if (bot.stackFromWaste()) {
          return;
        }
      }

      bot.turnOverStock();
    }
  }


  startGameInAminute(): void {
    // ready to start game, wait half a minute to view scores,
    // In the meantime other player may press start
    const myConID = connection.connectionId;
    setTimeout(reallyStart, 30000);

    function reallyStart(): void {
      restoreGlobals(myConID);
      if (racingDemon.gameState != GameState.Playing)
      {
        table.startGame();
      }
    }
  }

  stackFromWaste(): boolean {
    // stack top card from waste into workpiles. Very like stackWork
    const fromPileI = racingDemon.stockPileI + 1;
    const fromPile = table.piles[fromPileI];
    if (fromPile.cards.length == 0) {
      return false;
    }
    if (bot.stackCard(fromPile.endCard(), fromPileI)) {
      bot.stackedWasteSuccess++;
      return true;
    }
    bot.stackedWasteFailed++;
    return false;
  }

  stackWork(): boolean {
    // stack work cards on top of each other. Very like stackFromWaste
    for (let fromPileI = racingDemon.stockPileI + 3; fromPileI <= racingDemon.stockPileI + 6; fromPileI++) {
      const fromPile = table.piles[fromPileI];
      if (fromPile.cards.length == 0) {
        continue;
      }
      if (bot.stackCard(fromPile.cards[0], fromPileI)) {
        return true;
      }
    }
    return false;
  }

  stackCard(card: Card, fromPileI:number): boolean {
    for (let toPileI = racingDemon.stockPileI + 3; toPileI <= racingDemon.stockPileI + 6; toPileI++) {
      if (toPileI == fromPileI) {
        continue;
      }
      const toPile = table.piles[toPileI];
      if (toPile.cards.length == 0) {
        continue;
      }
      const targetCard = toPile.endCard();
      if ((targetCard.rank() == card.rank() + 1) && (targetCard.isBlack() != card.isBlack())) {
        bot.dragCard2(card.x + 1, card.y + 1, targetCard.x + 1, targetCard.y + 1);
        return true;
      }
    }
    return false;
  }

  moveDemonToWork(): boolean {
    // move card from demon to 1) work pile with cards or 2) empty workpile
    let pileI = racingDemon.stockPileI + 2;
    const demonPile = table.piles[pileI];
    if (demonPile.cards.length == 0) {
      return false;
    }
    const demonCard = demonPile.endCard();
    for (pileI = racingDemon.stockPileI + 3; pileI <= racingDemon.stockPileI + 6; pileI++) {
      const targetPile = table.piles[pileI];
      if (targetPile.cards.length > 0) {
        const targetCard = targetPile.endCard();
        if ((targetCard.rank() == demonCard.rank() + 1) && (targetCard.isBlack() != demonCard.isBlack())) {
          bot.dragCard(demonCard, targetCard.x + table.cardWidth / 2, targetCard.y + table.cardHeight / 2);
          return true;
        }
      }
    }
    for (pileI = racingDemon.stockPileI + 3; pileI <= racingDemon.stockPileI + 6; pileI++) {
      const targetPile = table.piles[pileI];
      if (targetPile.cards.length == 0) {
        bot.dragCard(demonCard, targetPile.x + table.cardWidth / 2, targetPile.y + table.cardHeight / 2);
        return true;
      }
    }
    return false;
  }

  playToCommon(): boolean {
    // play card to common area from demon or work pile or waste, in that order
    for (let pileI = racingDemon.stockPileI + 2; pileI <= racingDemon.stockPileI + 6; pileI++) {
      if (bot.playToCommon2(pileI)) {
        return true;
      }
    }
    if (bot.playToCommon2(racingDemon.stockPileI + 1)) {
      return true;
    }
    return false;
  }

  playToCommon2(pileI: number): boolean {
    let pile = table.piles[pileI];
    const players = racingDemon.players.length;
    if (pile.cards.length > 0) {
      let card = pile.endCard();
      let rank = card.rank();
      if (rank == 1) {
        bot.moveAce(card);
        return true;
      }
      let suit = card.suit();
      for (let cPileI = RDcommonPile0; cPileI < RDflyPile0; cPileI++) {
        const cPile = table.piles[cPileI];
        if (cPile.cards.length == 0) {
          return false;
        }
        const cCard = cPile.endCard();
        const ccRank = cCard.rank();
        const ccSuit = cCard.suit();
        let makeMove = false;
        if (rank != ccRank + 1) {
          continue;   // to next common pile
        }
        switch (players) {
          case 2:
            makeMove = true;
            break;
          case 3:
            if (cCard.isBlack() == card.isBlack()) {
              makeMove = true;
            }
            break;
          case 4:
            if (ccSuit == suit) {
              makeMove = true;
            }
        }
        if (makeMove) {
          bot.dragCard(card, cCard.x + table.cardWidth / 2, cCard.y + table.cardHeight / 2);
          return true;
        }
      }
    }
    return false;
  }

  moveAce(card: Card): void {
    // find space in common area and move ace there
    const radius = Math.sqrt(table.cardWidth * table.cardWidth + table.cardHeight * table.cardHeight) / 2 + 1;
    // radius a bit bigger than in table.drawCircle
    let occupiedAreas: Area[] = [];
    for (let cPileI = RDcommonPile0; cPileI < RDflyPile0; cPileI++) {
      let pile = table.piles[cPileI];
      if (pile.cards.length == 0) {
        break;
      }
      let cX = pile.x + table.cardWidth / 2;
      let cY = pile.y + table.cardHeight / 2;
      occupiedAreas[occupiedAreas.length] = new Area(cX - radius, cY - radius, cX + radius, cY + radius)
    }
    // search for gap in commonArea, 10 pixels at a time, starting near my piles
    let testArea = new Area(0, 0, 0, 0);
    for (let y = table.commonArea.bottom - radius; y > table.commonArea.top + radius; y -= 10) {
      for (let x = table.commonArea.left + radius; x < table.commonArea.right - radius; x += 10) {
        let testAreaFound = true;
        testArea.left = x - radius;
        testArea.right = x + radius;
        testArea.top = y - radius;
        testArea.bottom = y + radius;
        for (let oaI = 0; oaI < occupiedAreas.length; oaI++) {
          if (testArea.overlaps(occupiedAreas[oaI])) {
            testAreaFound = false;
            break;    // do next testArea
          }
        }
        if (testAreaFound) {
          bot.dragCard(card, x, y);
          return;
        }
      }
    }
  }

  dragCard(card: Card, toX: number, toY: number) {
    // drag card to toX,toY. Obviously
    // down1, move1, move1 ... move1, up1
    let fromX = card.x + table.cardWidth / 2;
    let fromY = card.y + table.cardHeight / 2;
    this.dragCard2(fromX, fromY, toX, toY);
  }

  dragCard2(fromX: number, fromY: number, toX: number, toY: number) {
    const sideX = toX - fromX;
    const sideY = toY - fromY;
    const distance = Math.sqrt(sideX * sideX + sideY * sideY);

    //table.ctx.beginPath();
    //table.ctx.moveTo(cardX, cardY);
    //table.ctx.lineTo(toX, toY);
    //table.ctx.strokeStyle = "black";
    //table.ctx.stroke();

    let moves = Math.round(distance / 50 / bot.speed);
    if (moves < 3) {
      moves = 3;
    }
    const dX = sideX / moves;
    const dY = sideY / moves;
    mouse.down1(fromX, fromY);
    mouse.move1(fromX, fromY);
    const myConID = connection.connectionId;
    const funcId = setInterval(moveIt, 200);

    function moveIt() {
      restoreGlobals(myConID);
      if (moves == -2) {
        mouse.up1(toX, toY);
        clearInterval(funcId);
        return;
      }
      --moves;
      if (moves <= 0) {
        mouse.move1(toX, toY);
        moves = -2;
        return;
      }
      fromX += dX;
      fromY += dY;
      mouse.move1(fromX, fromY);
    }
  }

  turnOverStock(): void {
    // tap stockpile or, if empty, waste pile
    let pileI = racingDemon.stockPileI;
    if (table.piles[pileI].cards.length == 0) {
      bot.repeatCount++;
      pileI++;
    }
    let pile = table.piles[pileI];
    let x = pile.x + table.cardWidth / 2;
    let y = pile.y + table.cardHeight / 2;
    mouse.down1(x, y);
    mouse.up1(x, y);
  }

}
