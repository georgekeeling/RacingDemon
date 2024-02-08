"use strict";
// (c) George Arthur Keeling, Berlin 2023
// MouseEvent Properties and Methods https://www.w3schools.com/jsref/obj_mouseevent.asp
/* This class (which only has one instance) contains all the stuff for
 * mouse, keyboard and touch input
 * */
var DropAnswer;
(function (DropAnswer) {
    DropAnswer[DropAnswer["no"] = 0] = "no";
    DropAnswer[DropAnswer["yes"] = 1] = "yes";
    DropAnswer[DropAnswer["notSure"] = 2] = "notSure";
})(DropAnswer || (DropAnswer = {}));
class Mouse {
    constructor() {
        this.mouseUp = true;
        this.dragging = false;
        this.dragCancelled = false;
        this.x = 0;
        this.y = 0;
        this.downX = -1;
        this.downY = -1;
        this.sourcePileI = -1;
        this.sourceX = 0;
        this.sourceY = 0;
        this.previousClickTime = 0;
        this.prevTouchX = -1;
        this.prevTouchY = -1;
        // link up mouse events.
        // Having onmousedown="mouse.down(event)" in html is frowned upon. Quite a bore
        // https://stackoverflow.com/questions/58341832/event-is-deprecated-what-should-be-used-instead 
        // 'this' will not refer to mouse object in top level methods
        // so have to use 'mouse' instead. Shambles!
        const myCanvas = document.getElementById("myCanvas");
        myCanvas.addEventListener("mousemove", this.move);
        myCanvas.addEventListener("mousedown", this.down);
        myCanvas.addEventListener("mouseup", this.up);
        myCanvas.addEventListener("touchmove", this.tMove);
        myCanvas.addEventListener("touchstart", this.tStart);
        myCanvas.addEventListener("touchend", this.tEnd);
        document.getElementById("setUpPage").addEventListener("touchmove", this.disableTchDefault);
        document.getElementById("playPage").addEventListener("touchmove", this.disableTchDefault);
        // document.body.addEventListener("keydown", this.keyPress);   // keypress must be on body element
    }
    down(message) {
        restoreGlobals(0); // mouse actions must be from real player
        if (table.isLocked() || racingDemon.gameState != GameState.Playing) {
            return;
        }
        // just note that mouse is down. Drag may start if mouse moves while it is down
        mouse.down1(message.offsetX, message.offsetY);
    }
    up(message) {
        restoreGlobals(0);
        if (table.isLocked() || racingDemon.gameState != GameState.Playing) {
            return;
        }
        mouse.up1(message.offsetX, message.offsetY);
    }
    move(message) {
        restoreGlobals(0);
        if (table.isLocked() || racingDemon.gameState != GameState.Playing) {
            return;
        }
        mouse.move1(message.offsetX, message.offsetY);
    }
    tStart(message) {
        restoreGlobals(0);
        if (table.isLocked() || racingDemon.gameState != GameState.Playing) {
            return;
        }
        let mouseX = message.touches[0].clientX - message.touches[0].target.offsetLeft;
        let mouseY = message.touches[0].clientY - message.touches[0].target.offsetTop;
        mouse.down1(mouseX, mouseY);
    }
    tMove(message) {
        restoreGlobals(0);
        if (table.isLocked() || racingDemon.gameState != GameState.Playing) {
            return;
        }
        let mouseX = message.touches[0].clientX - message.touches[0].target.offsetLeft;
        let mouseY = message.touches[0].clientY - message.touches[0].target.offsetTop;
        mouse.move1(mouseX, mouseY);
    }
    tEnd(message) {
        restoreGlobals(0);
        if (table.isLocked() || racingDemon.gameState != GameState.Playing) {
            return;
        }
        mouse.up1(mouse.x, mouse.y);
    }
    disableTchDefault(message) {
        // disables back / forward behaviour to go back / forward a page in Chrome
        // and disables scroll down which can cause refresh in chrome / android and safari
        // if two (or more) fingers used then allow default behaviour, which is zoom in / out
        // this might be necessary because UI can zoom when names being entered
        // and we need to get back to 100% zoom
        if (message.touches.length == 1) {
            message.preventDefault();
        }
    }
    // ****************************************
    // private functions (except ones that are public. Quite a few more made public for bot)
    // ****************************************
    down1(x, y) {
        this.mouseUp = false;
        this.x = x;
        this.y = y;
        this.downX = x;
        this.downY = y;
    }
    move1(x, y) {
        let dX = x - this.x;
        let dY = y - this.y;
        if (!this.mouseUp) {
            if (this.dragging) {
                this.dragContinue(dX, dY);
            }
            else {
                // we might be starting a drag, if we have just moved from a down
                if (this.downX == this.x && this.downY == this.y) {
                    this.dragStart(this.downX, this.downY);
                }
            }
        }
        this.x = x;
        this.y = y;
    }
    up1(x, y) {
        // finalise drag or invoke click (but not too often)
        this.downX = -1;
        this.downY = -1;
        if (this.dragging) {
            this.dragEnd(x, y);
            this.dragging = false;
        }
        else {
            let cpFound = this.findCardUnderMouse(x, y);
            if (this.dragCancelled) {
                cpFound.cardI = -1;
                this.dragCancelled = false;
            }
            if (cpFound.cardI >= 0) {
                let date = new Date();
                let mSeconds = date.getTime();
                if ((mSeconds - this.previousClickTime) > 100) {
                    racingDemon.click(cpFound.pileI, cpFound.cardI);
                }
                this.previousClickTime = mSeconds;
            }
        }
        this.mouseUp = true;
    }
    dragStart(mouseX, mouseY) {
        let cpFound = this.findCardUnderMouse(mouseX, mouseY);
        if (cpFound.cardI >= 0) {
            let cardsToDrag = racingDemon.requestDrag(cpFound.pileI, cpFound.cardI);
            if (cardsToDrag == 0) {
                sound.soundFail();
                return;
            }
            let oldPileI = cpFound.pileI;
            let oldCardI = cpFound.cardI;
            let redrawArea = new Area();
            let oldPile = table.piles[oldPileI];
            this.dragging = true;
            this.dragCancelled = false;
            this.sourcePileI = oldPileI;
            this.sourceX = oldPile.cards[oldCardI].x;
            this.sourceY = oldPile.cards[oldCardI].y;
            if (cardsToDrag == Infinity) {
                // move rest of pileI to drag pile and redraw
                oldPile.spliceToDrag(oldCardI);
            }
            else {
                // move cardI to drag pile 
                let oldCard = oldPile.cards[oldCardI];
                dragPile.emptyDrag();
                dragPile.x = oldCard.x;
                dragPile.y = oldCard.y;
                dragPile.addCardP(oldCard.playerI, oldCard.cards52I, oldCard.x, oldCard.y, true, 0);
                oldPile.cards.splice(oldCardI, 1);
            }
            redrawArea.clone(oldPile.area);
            redrawArea.addAreas(oldPile.area, dragPile.area);
            table.showCards(redrawArea);
            dragPile.broadcast(dragPileI);
            oldPile.broadcast(oldPileI);
        }
    }
    dragContinue(mouseDx, mouseDy) {
        // console.log("Drag continue " + mouseDx + "," + mouseDy);
        let area1 = new Area(dragPile.area.left, dragPile.area.top, dragPile.area.right, dragPile.area.bottom);
        dragPile.moveBy(mouseDx, mouseDy);
        let area3 = new Area();
        area3.addAreas(area1, dragPile.area);
        table.showCards(area3);
        dragPile.broadcast(dragPileI);
    }
    dragEnd(mouseX, mouseY) {
        let cpFound = this.findCardUnderMouse(mouseX, mouseY);
        if (cpFound.pileI == this.sourcePileI) {
            // Putting drag card back in pile where it came from has no effect,
            this.dragAbort(1);
            return;
        }
        switch (racingDemon.requestDrop(cpFound.pileI, cpFound.cardI, mouseX, mouseY)) {
            case DropAnswer.yes:
                // request drop has done everything, almost
                this.dragSuccess();
                break;
            case DropAnswer.notSure:
                {
                    // need permission
                    let bCards = dragPile.createBcardsForBroadcast();
                    // used to use: sendGroup("PermitLanding", cpFound.pileI, bCards, RDflyPile0 + racingDemon.playerI);
                    // but sometimes got
                    // Error: An unexpected error occurred invoking 'PermitLanding' on the server.
                    // see "...\demon debug\d2023-07-16 floating king\d2023-07-16 floating king overview.docx"
                    // Now treat error like LandingDenied, while emitting error console and not very useful data
                    connection.invoke("PermitLanding", uGroups.myGroup, cpFound.pileI, bCards, RDflyPile0 + racingDemon.playerI).catch(function (err) {
                        console.error(err.toString());
                        let log = "Self-denied landing of p " + (RDflyPile0 + racingDemon.playerI) + " on p " + cpFound.pileI +
                            " cards " + bCards.length;
                        for (let bCard of bCards) {
                            log += (" c " + bCard.playerI + "," + bCard.cards52I + "," + Math.round(bCard.x) + "," +
                                Math.round(bCard.y) + "," + bCard.faceUp + "," + Math.round(bCard.angle));
                        }
                        console.log(log);
                        mouse.dragAbort(1);
                    });
                    // Normal behaviour: invokes dragSuccess if LandingAccepted, dragAbortFromServer if LandingDenied
                    break;
                }
            case DropAnswer.no:
            default:
                sound.soundFail();
                this.dragAbort(2);
                break;
        }
    }
    dragAbortFromServer(pileI, reason) {
        switch (reason) {
            case 1:
                table.createCircle(0, dragPileI);
                table.writeTip("Too close/over edge");
                break;
            case 2:
                table.createCircle(0, dragPileI);
                table.createCircle(1, pileI);
                table.writeTip("Too close to other");
                break;
            case 3:
                table.writeTip("Wrong rank");
                break;
            case 4:
                table.writeTip("Wrong color");
                break;
            case 5:
                table.writeTip("Wrong suit");
                break;
            default:
            case 99:
                table.writeTip("System error " + reason);
                break;
        }
        sound.soundFail();
        mouse.dragAbort(2);
    }
    dragAbort(speed) {
        table.flyPile(this.sourcePileI, this.sourceX, this.sourceY, speed);
        this.dragging = false;
        this.dragCancelled = true;
        this.mouseUp = true;
        this.sourcePileI = -1;
        racingDemon.dragCardRank = 0;
        racingDemon.dragToPileI = -1;
    }
    dragSuccess() {
        this.dragging = false;
        this.dragCancelled = true;
        this.mouseUp = true;
        this.sourcePileI = -1;
        racingDemon.dragSuccess();
    }
    findCardUnderMouse(mouseX, mouseY) {
        // return pile and card under mouse. Do not look in drag piles
        let pileI;
        let cardI;
        for (pileI = 0; pileI < RDflyPile0; pileI++) {
            let pile = table.piles[pileI];
            let pArea = pile.area;
            if (pArea.left < mouseX && mouseX < pArea.right &&
                pArea.top < mouseY && mouseY < pArea.bottom) {
                for (cardI = pile.cards.length - 1; cardI >= 0; cardI--) {
                    let card = pile.cards[cardI];
                    if (card.angle == 0) {
                        if (card.x < mouseX && mouseX < (card.x + table.cardWidth) &&
                            card.y < mouseY && mouseY < (card.y + table.cardHeight)) {
                            return { pileI, cardI };
                        }
                    }
                    else {
                        // rotate mouse coords about card centre. Then check if mouse is in
                        // area where card would be at angle 0
                        // origin = center of card
                        let halfWidth = table.cardWidth / 2;
                        let halfHeight = table.cardHeight / 2;
                        let mXY = new Coords(mouseX - card.x - halfWidth, mouseY - card.y - halfHeight);
                        mXY.rotate(card.angle); // should be -card.angle?? But this works!
                        //drawPoint(mouseX, mouseY, "#FF0000");
                        //drawPoint(card.x + halfWidth + mXY.x, card.y + halfHeight + mXY.y, "#00FFFF");
                        if (-halfWidth < mXY.x && mXY.x < halfWidth &&
                            -halfHeight < mXY.y && mXY.y < halfHeight) {
                            return { pileI, cardI };
                        }
                    }
                }
                cardI = -1;
                return { pileI, cardI }; // clicking / dropping on empty pile
            }
        }
        pileI = -1;
        cardI = -1;
        return { pileI, cardI };
    }
}
//# sourceMappingURL=mouse.js.map