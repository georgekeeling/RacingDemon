"use strict";
// (c) George Arthur Keeling, Berlin 2023
/*
 * racing demon
 */
var GameState;
(function (GameState) {
    GameState[GameState["Waiting"] = 0] = "Waiting";
    GameState[GameState["Playing"] = 1] = "Playing";
    GameState[GameState["Scoring"] = 2] = "Scoring";
    GameState[GameState["ShowingScores"] = 3] = "ShowingScores";
    GameState[GameState["GameOver"] = 4] = "GameOver"; // As above, but we have an overall winner, ready to start new game
})(GameState || (GameState = {}));
const RDmaxPlayers = 4;
const RDhandicap = 13;
const RDhomePiles = 7; // number of home piles per player stpck, waste, demon, work piles * 4
const RDcommonPile0 = RDhomePiles * RDmaxPlayers; // first common pile  
const RDflyPile0 = RDhomePiles * RDmaxPlayers + 4 * RDmaxPlayers; // fly / drag pile of player 0
class RacingDemon {
    constructor() {
        this.gameState = GameState.Waiting;
        this.otherPlayerLeft = false; // when other player leaves game, dramatic events take place. See playerDeparted
        this.cheated = 0; // count of cheats
        this.players = [];
        this.playerI = -1;
        this.stockPileI = -1;
        this.dragCardRank = 0; // if it was a king ...
        this.dragToPileI = -1; // might become 
        this.readyToDanceN = 0; // this group control synchronization of actionsAfterOut across all players
        this.sortReadyPilesN = 0;
        this.readyToScoreN = 0;
        this.roundScores = [0, 0, 0, 0];
        this.allScores = []; // allScores[roundI][playerI] = score of playerI in roundI 
        // always 4 per round, regardless of nr of players
        this.totalScores = [0, 0, 0, 0];
        this.gameStateSet(GameState.Waiting);
    }
    gameStateSet(newState) {
        if (newState == GameState.Playing || newState == GameState.Scoring || newState == GameState.ShowingScores) {
            addEventListener("beforeunload", this.unloadFunc);
        }
        else {
            removeEventListener("beforeunload", this.unloadFunc);
        }
        this.gameState = newState;
    }
    unloadFunc(event) {
        event.returnValue = "WTF?";
    }
    requestDrag(pileI, cardI) {
        // Can card at pileI, cardI be dragged?
        // Return 0 if not. Infinity if yes
        // must be in piles waste, demon or work. Must be top card on waste or demon
        // can also be pile on which the player has just placed a king.
        const wastePileI = this.playerI * RDhomePiles + 1;
        const demonPileI = wastePileI + 1;
        const rWorkPileI = wastePileI + 5;
        if (pileI < wastePileI || pileI > rWorkPileI) {
            return 0;
        }
        ;
        let pile = table.piles[pileI];
        if (pileI == demonPileI || pileI == wastePileI) {
            if (cardI != pile.cards.length - 1) {
                return 0;
            }
        }
        if (pileI == demonPileI && cardI > 1) {
            // move second top card down a bit. No need for redraw etc. dragStart will take care
            let secondCard = pile.cards[cardI - 1];
            let thirdCard = pile.cards[cardI - 2];
            secondCard.y = thirdCard.y + table.yStep;
            secondCard.area.top = secondCard.y;
            secondCard.area.bottom = secondCard.y + table.cardHeight;
        }
        return Infinity;
    }
    requestDrop(pileI, cardI, x, y) {
        // Can dragPile be dropped on pileI, cardI?
        // x,y are used if drop was not on a pile when pileI == -1
        // if pile in work piles, client can do all necessary. Do it and return yes (this function deals with it)  or no
        // if pile in common area piles or pile == -1 and x,y in common area, then must get landing permission, return notSure
        // otherwise return DropAnswer.fail (drag abort)
        const workPile0I = this.stockPileI + 3;
        if (pileI >= workPile0I && pileI < workPile0I + 4) {
            let pile = table.piles[pileI];
            let emptyWorkPiles = 0; // if there is an empty work pile, card can be placed at bottom of a stack
            for (let pile2I = workPile0I; pile2I < workPile0I + 4; pile2I++) {
                if (table.piles[pile2I].cards.length == 0) {
                    emptyWorkPiles++;
                }
            }
            if (pile.cards.length == 0) {
                // dropping on empty pile
                let redrawArea = new Area();
                redrawArea.clone(dragPile.area);
                dragPile.moveTo(pile.x, pile.y);
                pile.addDrag();
                redrawArea.addAreas(redrawArea, pile.area);
                table.showCards(redrawArea);
                dragPile.broadcast(dragPileI);
                pile.broadcast(pileI);
                return DropAnswer.yes;
            }
            // trying to drop on pile with cards in it.
            // Either goes at the top, or if emptyWorkPiles > 0 1 card can go at the bottom
            let topCard = pile.endCard();
            let bottomCard = pile.cards[0];
            let dragCard = dragPile.cards[0];
            if (emptyWorkPiles > 0 && dragPile.cards.length == 1) {
                if (dragCard.isBlack() != bottomCard.isBlack() && (dragCard.rank() == bottomCard.rank() + 1)) {
                    let redrawArea = new Area();
                    redrawArea.clone(dragPile.area);
                    dragPile.moveTo(pile.x, pile.y);
                    let newCard = new Card(pile, dragCard.playerI, dragCard.cards52I, dragCard.x, dragCard.y, true, 0);
                    pile.cards.unshift(newCard);
                    for (let cardI = 1; cardI < pile.cards.length; cardI++) {
                        let card = pile.cards[cardI];
                        card.y += table.yStep;
                        card.area.top += table.yStep;
                        card.area.bottom += table.yStep;
                    }
                    pile.recalcArea();
                    dragPile.emptyDrag();
                    redrawArea.addAreas(redrawArea, pile.area);
                    table.showCards(redrawArea);
                    dragPile.broadcast(dragPileI);
                    pile.broadcast(pileI);
                    return DropAnswer.yes;
                }
            }
            // goes at top or fail
            if (dragCard.isBlack() != topCard.isBlack() && (dragCard.rank() + 1 == topCard.rank())) {
                let redrawArea = new Area();
                redrawArea.clone(dragPile.area);
                dragPile.moveTo(topCard.x, topCard.y + table.yStep);
                pile.addDrag();
                pile.recalcArea();
                dragPile.emptyDrag();
                redrawArea.addAreas(redrawArea, pile.area);
                table.showCards(redrawArea);
                dragPile.broadcast(dragPileI);
                pile.broadcast(pileI);
                return DropAnswer.yes;
            }
            return DropAnswer.no;
        }
        // dropping outside workpiles
        if (dragPile.cards.length != 1) {
            return DropAnswer.no;
        }
        let dragCard = dragPile.endCard();
        this.dragCardRank = dragCard.rank();
        this.dragToPileI = pileI;
        if (pileI >= RDcommonPile0 && pileI < RDflyPile0) {
            if (this.dragCardRank == 1) {
                // cannot land ace on a common pile
                table.writeTip("Ace must be in space");
                return DropAnswer.no;
            }
            return DropAnswer.notSure;
        }
        if (pileI == -1 && this.dragCardRank == 1) {
            // attempting to land ace. Are we sufficiently in common area?
            // leave test to PermitLanding, simplifies tip generation, circles.
            return DropAnswer.notSure;
        }
        console.log("pl " + racingDemon.playerI + " attempted landing on no pile");
        table.writeTip("Card must go on pile");
        return DropAnswer.no;
    }
    outReminder() {
        const id = setInterval(pressOutQ, 10000); // writeTip message cleared after 5000 ms
        function pressOutQ() {
            if (racingDemon.gameState != GameState.Playing) {
                clearInterval(id);
                return;
            }
            table.writeTip("Press Out?");
            sound.soundDing();
        }
    }
    dragSuccess() {
        // drag pile moved to target pile by server. So not much to do here. 
        const demonPileI = this.stockPileI + 2;
        const demonPile = table.piles[demonPileI];
        if (demonPile.cards.length == 0) {
            document.getElementById("outButton").disabled = false;
            this.outReminder();
        }
        if (this.dragCardRank == 13) {
            // player put king on common pile. fly it to a corner on tablet or side on mobile
            let commonPile = table.piles[this.dragToPileI];
            if (typeof (commonPile) == 'undefined') {
                debugger;
            }
            dragPile.clone(commonPile);
            let corner = Math.floor(Math.random() * 4);
            let x;
            let y;
            console.log("Flying king pile " + this.dragToPileI + ". Corner " + corner);
            switch (corner) {
                case 0:
                    // top left or upper left
                    if (table.siteWindow.onMobile) {
                        x = -table.cardWidth;
                        y = table.height * .3;
                    }
                    else {
                        x = 0;
                        y = 0;
                    }
                    break;
                case 1:
                    // top right or upper right
                    if (table.siteWindow.onMobile) {
                        x = table.width;
                        y = table.height * .3;
                    }
                    else {
                        x = table.width - table.cardHeight;
                        y = 0;
                    }
                    break;
                case 2:
                    // bottom left or lower left
                    if (table.siteWindow.onMobile) {
                        x = -table.cardWidth;
                        y = table.height * .6;
                    }
                    else {
                        x = 0;
                        y = table.height - table.cardHeight;
                    }
                    break;
                case 3:
                default:
                    // bottom right or lower right
                    if (table.siteWindow.onMobile) {
                        x = table.width;
                        y = table.height * .6;
                    }
                    else {
                        x = table.width - table.cardHeight;
                        y = table.height - table.cardHeight;
                    }
                    break;
            }
            commonPile.x = x;
            commonPile.y = y;
            commonPile.area.top = x;
            commonPile.area.left = y;
            commonPile.area.bottom = x + table.cardHeight;
            commonPile.area.right = y + table.cardWidth;
            commonPile.cards = [];
            commonPile.broadcast(this.dragToPileI);
            table.flyPile(this.dragToPileI, x, y, 1); // speed should be 1
        }
        this.dragCardRank = 0;
        this.dragToPileI = -1;
    }
    click(pileI, cardI) {
        // possibly do something when cardI in pileI has been clicked
        const stockPileI = this.playerI * RDhomePiles;
        const stockPile = table.piles[stockPileI];
        const wastePileI = stockPileI + 1;
        const wastePile = table.piles[wastePileI];
        if (pileI == wastePileI) {
            if (stockPile.cards.length > 0) {
                sound.soundFail();
                return;
            }
            // turn waste over and place on stock so that player can go through stock again
            for (let cardI = wastePile.cards.length - 1; cardI >= 0; cardI--) {
                stockPile.addCardP(racingDemon.playerI, wastePile.cards[cardI].cards52I, stockPile.x, stockPile.y, false, 0);
            }
            let redrawArea = stockPile.area;
            redrawArea.addAreas(redrawArea, wastePile.area);
            wastePile.cards = [];
            table.showCards(redrawArea);
            stockPile.broadcast(stockPileI);
            wastePile.broadcast(wastePileI);
            return;
        }
        if (pileI == stockPileI) {
            if (stockPile.cards.length > 0) {
                // take three (or all remaining) off stock, turn over and put on wastepile
                let cardI = stockPile.cards.length - 3;
                if (cardI < 0) {
                    cardI = 0;
                }
                ;
                stockPile.spliceToDrag(cardI);
                dragPile.cards.reverse();
                table.stockToWaste();
                return;
            }
        }
        sound.soundFail();
        return;
    }
    out() {
        document.getElementById("outButton").disabled = true;
        sendGroup("PlayerIsOut", uGroups.playerName);
    }
    actionsAfterOut(outPlayer) {
        // look after 4 common piles (my4piles): so that work is distributed evenly in following steps
        // 0) abort drag
        // 1) flash winner message
        // 2) when all landed, fly first common pile (fcp) to be above work piles, faced  down
        // 3) fly remaining common piles to fcp, face down
        // 4) position last cp (lcp) now empty above stock pile
        // 5) when all lcp's in position, start sorting fcp to lcps, continue ...
        // 6) when all sorted, score and show the score table
        // first common pile (fcp) is at my4piles[0] = myFcpPileI
        // other common pile numbers depend on nr players
        // common piles must have been filled from RDcommonPile0 without any empty ones
        const playersN = racingDemon.players.length;
        const myFcpPileI = RDcommonPile0 + racingDemon.playerI;
        const lcpPile0 = RDcommonPile0 + playersN * 3; // first lcp pile
        const fcpPile = table.piles[myFcpPileI];
        const my4piles = [1, 2, 3, 4];
        let step = 1; // set to 2 to skip flashing and test racingDemon.readyToDanceN
        let flashes = 10; // should be 10
        document.getElementById("outButton").disabled = true;
        document.getElementById("tidyButton").disabled = true;
        this.roundScores = [0, 0, 0, 0];
        for (let playerI = 0; playerI < playersN; playerI++) {
            racingDemon.roundScores[playerI] = -table.piles[2 + RDhomePiles * playerI].cards.length;
        }
        flashOutPerson();
        for (let i = 0; i < 4; i++) {
            my4piles[i] = myFcpPileI + playersN * i;
        }
        // tested readyToDanceN by decreasing interval here (500->50) and increasing interval in flyPile (50->5000)
        // and omitting step 1
        // got zillions of "waiting to dance" console messages on out player log
        this.readyToDanceN = 0; // also set in deal, in case another actionsAfterOut completes v. fast
        this.sortReadyPilesN = 0; // ditto
        this.readyToScoreN = 0; // ditto
        table.lock("actionsAfterOut");
        const timerID = setInterval(nextStep, 500); // was 500
        nextStep(); // Get one step out the way immediately
        function nextStep() {
            if (mouse.dragging) {
                mouse.dragAbort(1);
                return;
            }
            if (racingDemon.otherPlayerLeft) {
                // playerDeparted takes over
                clearInterval(timerID);
                table.unlock("actionsAfterOut 1");
                table.showCards(); // clear flashing messages
                return;
            }
            if (dragPile.cards.length > 0) {
                // must be flying => 
                // unfinished step still active or
                // fly in progress on entry to actionsAfterOut
                // could be flying back to demon (possibly from dragAbort) or flying king pile to corner
                return;
            }
            if (racingDemon.gameState != GameState.Scoring) {
                racingDemon.gameStateSet(GameState.Scoring);
                sendGroup("ReadyToDance");
                // v important that message only sent once!
                console.log("Player " + racingDemon.playerI + " sent ready to dance");
            }
            switch (step) {
                case 1:
                    {
                        // flash message
                        flashes--;
                        if (flashes % 2 == 1) {
                            table.writeCentralBigRandomFont("");
                        }
                        else {
                            flashOutPerson();
                        }
                        if (flashes == 0) {
                            table.showCards();
                            step++;
                            return;
                        }
                        return;
                    }
                case 2:
                    {
                        // move fcp to drag, empty fcp, place fcp central above my work piles fly drag to fcp
                        if (racingDemon.readyToDanceN < playersN) {
                            console.log("Player " + racingDemon.playerI + " waiting to dance");
                            return;
                        }
                        if (fcpPile.cards.length == 0) {
                            // no sorting needed, go directly to step 4
                            step = 4;
                            return;
                        }
                        dragPile.clone(fcpPile);
                        for (let card of dragPile.cards) {
                            card.faceUp = false;
                        }
                        fcpPile.cards = [];
                        fcpPile.broadcast(myFcpPileI);
                        fcpPile.x = (table.width - table.cardWidth) / 2;
                        fcpPile.y = table.height * .6;
                        fcpPile.area.left = fcpPile.x;
                        fcpPile.area.top = fcpPile.y;
                        fcpPile.area.right = fcpPile.x + table.cardWidth;
                        fcpPile.area.bottom = fcpPile.y + table.cardHeight;
                        table.flyPile(myFcpPileI, fcpPile.x, fcpPile.y, 1);
                        step++;
                        return;
                    }
                case 3:
                    {
                        // move next my4piles to dragpile and fly it to fcp pile
                        let nextI = 1;
                        while (table.piles[my4piles[nextI]].cards.length == 0) {
                            if (nextI == 3) {
                                step++;
                                return;
                            }
                            nextI++;
                        }
                        if (table.piles[my4piles[nextI]].cards.length == 0) {
                            step++;
                            return;
                        }
                        let pileI = my4piles[nextI];
                        let pile = table.piles[pileI];
                        dragPile.clone(pile);
                        pile.cards = [];
                        pile.broadcast(pileI);
                        for (let card of dragPile.cards) {
                            card.faceUp = false;
                        }
                        table.flyPile(myFcpPileI, fcpPile.x, fcpPile.y, 1);
                        return;
                    }
                case 4:
                    {
                        // position lcp (which is empty) above stock and broadcast. We are ready to sort
                        let lcpPileI = my4piles[3];
                        let stockPile = table.piles[racingDemon.stockPileI];
                        let bCard = new Bcard(0, 0, stockPile.x, stockPile.y - table.cardHeight * 1.5, false, 0);
                        bCard.coordsForServer();
                        sendGroup("ReadyToSort", lcpPileI, bCard.x, bCard.y);
                        step++;
                        return;
                    }
                case 5:
                    {
                        // when all lcp's ready start sorting. ******************
                        if (racingDemon.sortReadyPilesN < playersN) {
                            return;
                        }
                        if (fcpPile.cards.length == 0) {
                            // fly of final card must be finished too, we are ready to score
                            sendGroup("ReadyToScore");
                            step++;
                            return;
                        }
                        // sort 1 card off fcpPile to an lcpPile. dragPile is already empty (duh: condition of entry)
                        fcpPile.spliceToDrag(fcpPile.cards.length - 1);
                        fcpPile.broadcast(myFcpPileI);
                        let flyCard = dragPile.endCard();
                        let targetPileI = lcpPile0 + flyCard.playerI;
                        sendGroup("AddPoint", flyCard.playerI);
                        if (racingDemon.playerI < 2) {
                            if (flyCard.playerI < 2) {
                                flyCard.setAngle(0);
                            }
                            else {
                                flyCard.setAngle(90);
                            }
                        }
                        else {
                            if (flyCard.playerI < 2) {
                                flyCard.setAngle(90);
                            }
                            else {
                                flyCard.setAngle(0);
                            }
                        } // there  might be a cleverer way to do that. WTF
                        let targetPile = table.piles[targetPileI];
                        table.flyPile(targetPileI, targetPile.x, targetPile.y, 2);
                        return;
                    }
                case 6:
                    {
                        // when all are ready to score (and no more piles to broadcast!), do score
                        if (racingDemon.readyToScoreN < playersN) {
                            return;
                        }
                        racingDemon.allScores[racingDemon.allScores.length] = racingDemon.roundScores.slice();
                        racingDemon.totalScores = [0, 0, 0, 0];
                        let haveWinner = false;
                        for (let rowI = 0; rowI < racingDemon.allScores.length; rowI++) {
                            for (let colI = 0; colI < RDmaxPlayers; colI++) {
                                racingDemon.totalScores[colI] += racingDemon.allScores[rowI][colI];
                                if (racingDemon.totalScores[colI] >= 100) {
                                    haveWinner = true;
                                }
                            }
                        }
                        if (haveWinner) {
                            racingDemon.gameStateSet(GameState.GameOver);
                        }
                        else {
                            racingDemon.gameStateSet(GameState.ShowingScores);
                        }
                        racingDemon.dealNextRound();
                        table.startGameAllowed(true);
                        document.getElementById("outButton").disabled = true;
                        document.getElementById("tidyButton").disabled = true;
                        clearInterval(timerID);
                        table.unlock("actionsAfterOut 2");
                        return;
                    }
            }
        }
        function flashOutPerson() {
            if (outPlayer == uGroups.playerName) {
                table.writeCentralBigRandomFont("You were out.");
            }
            else {
                table.writeCentralBigRandomFont(outPlayer + " was out.");
            }
        }
    }
    ReadyToSort(lcpPileI, lcpX, lcpY) {
        // self or other player has finished step 4 above with lcpPileI. 
        // Unravel coordinates and get empty pile in position ready to receive sorted cards
        let lcpPile = table.piles[lcpPileI];
        let bCardIn = new Bcard(0, 0, lcpX, lcpY, false, 0);
        bCardIn.coordsForReceive();
        lcpPile.x = bCardIn.x;
        lcpPile.y = bCardIn.y;
        lcpPile.area.left = lcpPile.x;
        lcpPile.area.top = lcpPile.y;
        lcpPile.area.right = lcpPile.x + table.cardWidth;
        lcpPile.area.bottom = lcpPile.y + table.cardHeight;
        lcpPile.cards = [];
        racingDemon.sortReadyPilesN++;
    }
    playerDeparted(deserterName) {
        // player n has departed
        // 1) Put up message and abort this round
        // 2) replace this.players[n] by this.players[last]
        // 3) similar with allScores
        // 4) show scores and await start button like at end of orinary round
        let flashes = 10;
        const desPlayerI = this.players.findIndex((name) => { return (name == deserterName); });
        this.players[desPlayerI] = this.players[this.players.length - 1];
        this.players.pop();
        if (this.playerI == this.players.length) {
            this.playerI = desPlayerI;
        }
        for (let roundI = 0; roundI < this.allScores.length; roundI++) {
            this.allScores[roundI][desPlayerI] = this.allScores[roundI][this.players.length];
            this.allScores[roundI][this.players.length] = 0;
        }
        const playersN = this.players.length;
        let message = "";
        if (playersN > 1) {
            if (racingDemon.gameState == GameState.Waiting || racingDemon.gameState == GameState.ShowingScores ||
                racingDemon.gameState == GameState.GameOver) {
                message = deserterName + " left.";
            }
            else {
                message = deserterName + " left. Round abandoned.";
            }
        }
        else {
            message = deserterName + " left. Game abandoned.";
        }
        racingDemon.otherPlayerLeft = true;
        const timerID = setInterval(flashDeserter, 500);
        table.lock("playerDeparted");
        flashDeserter();
        function flashDeserter() {
            flashes--;
            if (flashes % 2 == 1) {
                table.clearCentralBiggish(message);
            }
            else {
                table.writeCentralBiggish(message);
            }
            if (flashes == 0) {
                if (playersN > 1) {
                    table.startGameAllowed(true);
                    if (racingDemon.gameState != GameState.Waiting) {
                        racingDemon.gameStateSet(GameState.ShowingScores);
                    }
                    racingDemon.dealNextRound();
                }
                else {
                    table.startGameAllowed(false);
                    racingDemon.newPlayerDeal(0);
                }
                document.getElementById("outButton").disabled = true;
                document.getElementById("tidyButton").disabled = true;
                clearInterval(timerID);
                table.unlock("playerDeparted");
                return;
            }
        }
    }
    newPlayerDeal(playerNr) {
        this.playerI = playerNr;
        this.gameStateSet(GameState.Waiting);
        this.allScores = [];
        this.totalScores = [0, 0, 0, 0];
        this.cheated = 0;
        this.deal2();
        sendGroup("UpdatePiles");
    }
    dealNextRound() {
        this.deal2();
        sendGroup("UpdatePiles");
    }
    deal2() {
        // clear server common and drag piles
        // create all the empty piles available, positioned off the table
        // and deal cards for this player across bottom of table
        // broadcast this player's cards
        sendGroup("ClearCommonPiles");
        this.sortReadyPilesN = 0; // be prepared for end!
        this.readyToScoreN = 0; // ditto
        this.readyToDanceN = 0; // ditto
        this.otherPlayerLeft = false;
        table.piles = [];
        pack.doShuffle(1);
        for (let pileI = 0; pileI < RDflyPile0 + RDmaxPlayers; pileI++) {
            table.addPile(-10, -10);
        }
        dragPileI = RDflyPile0 + this.playerI;
        dragPile = table.piles[dragPileI];
        // set coordinates of stock, waste, demon, work piles for this player, others will broadcast into us
        let pileI = this.playerI * RDhomePiles;
        if (table.commonArea.bottom != table.height - table.cardHeight * 1.6) {
            // table.commonArea.bottom is set as above in table.resize1.
            // bug 12/7/23 Mess on second deal seems to say different!!
            // Have arrived here once with difference ~ 3 parts in 700
            // second time 789.3 vs 790.1, only 1 player in and just after creating game
            console.log("table.commonArea.bottom               " + table.commonArea.bottom);
            console.log("table.height - table.cardHeight * 1.6 " + (table.height - table.cardHeight * 1.6));
            debugger;
        }
        let y = table.commonArea.bottom + table.yStep / 2;
        let x = table.commonArea.left;
        while (pileI < this.playerI * RDhomePiles + RDhomePiles) {
            let pile = table.piles[pileI];
            pile.x = x;
            pile.y = y;
            x += table.cardWidth * 1.1;
            if (pileI == this.playerI * RDhomePiles + 1) {
                x += table.yStep * 2.5; // extra gap between waste and demon
            }
            pile.recalcArea();
            pileI++;
        }
        this.stockPileI = this.playerI * RDhomePiles;
        pileI = this.stockPileI + 6; // last work pile of this player
        let shuffledI = 0;
        // 4 workpiles
        for (let i = 0; i < 4; i++) {
            let pile = table.piles[pileI--];
            pile.addCardP(racingDemon.playerI, pack.shuffled[shuffledI++], pile.x, pile.y, true, 0);
        }
        // demon
        let pile = table.piles[pileI];
        for (let i = 0; i < RDhandicap; i++) {
            table.addCardT(pileI, racingDemon.playerI, pack.shuffled[shuffledI++], pile.x, pile.y + i, true, 0);
        }
        let topCard = pile.endCard();
        topCard.y += table.yStep;
        topCard.area.top += table.yStep;
        topCard.area.bottom += table.yStep;
        pile.recalcArea();
        // wastepile - nothing to do
        pileI--;
        // Stock
        pileI--;
        pile = table.piles[pileI];
        while (shuffledI < pack.shuffled.length) {
            table.addCardT(pileI, racingDemon.playerI, pack.shuffled[shuffledI++], pile.x, pile.y, false, 0);
        }
        table.showCards();
    }
}
//# sourceMappingURL=rDemon.js.map