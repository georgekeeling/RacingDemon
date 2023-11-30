"use strict";
// (c) George Arthur Keeling, Berlin 2023

// MouseEvent Properties and Methods https://www.w3schools.com/jsref/obj_mouseevent.asp

/* This class (which only has one instance) contains all the stuff for 
 * mouse, keyboard and touch input
 * */

enum DropAnswer {
  no,
  yes,
  notSure
}

class Mouse {
  mouseUp = true;
  dragging = false;
  dragCancelled = false;
  x = 0; y = 0;
  downX = -1; downY = -1;
  sourcePileI = -1;
  sourceX = 0; sourceY = 0; 
  previousClickTime = 0;
  prevTouchX = -1;
  prevTouchY = -1;
  keyPressed = -1;
  // buttons to flip card, set rank or set suit
  // First: f. Next 13: 0,1 ...9, J, Q, K. Next four; s,h,d,c. Last one: ESC
  keyCodes=    [70, 48,49,50,51,52,53,54,55,56,57, 74, 81, 75, 83, 72, 68, 67];
  translateKey=[70, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13,100,113,126,139];

  constructor() {
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
    document.body.addEventListener("keydown", this.keyPress);   // keypress must be on body element
  }

  keyPress(event) {
    if (event.keyCode == 27) {
      debugger;     // escape key launches debugger
    }
    if (table.isLocked()) { return }
    if (typeof (doTest) != 'function') { return }   // do not save key presses, see d2023-07-27-turnover disabled
    let i = mouse.keyCodes.indexOf(event.which);
    // console.log("evw: " + event.which + ", i: " + i);
    if (i >= 0) {
      mouse.keyPressed = mouse.translateKey[i];
      return;   // keep value of key pressed if A,2...K, s,h,d,c
    }
    mouse.keyPressed = -1;
  }

  down(message) {
    if (table.isLocked() || racingDemon.gameState != GameState.Playing) { return }
    // just note that mouse is down. Drag may start if mouse moves while it is down
    mouse.down1(message.offsetX, message.offsetY);
  }

  up(message) {
    if (table.isLocked() || racingDemon.gameState != GameState.Playing) { return }
    mouse.up1(message.offsetX, message.offsetY);
  }

  move(message) {
    if (table.isLocked() || racingDemon.gameState != GameState.Playing) { return }
    mouse.move1(message.offsetX, message.offsetY);
  }

  tStart(message) {
    if (table.isLocked() || racingDemon.gameState != GameState.Playing) { return }
    let mouseX = message.touches[0].clientX - message.touches[0].target.offsetLeft;
    let mouseY = message.touches[0].clientY - message.touches[0].target.offsetTop;
    mouse.down1(mouseX, mouseY);
  }

  tMove(message) {
    if (table.isLocked() || racingDemon.gameState != GameState.Playing) { return }
    let mouseX = message.touches[0].clientX - message.touches[0].target.offsetLeft;
    let mouseY = message.touches[0].clientY - message.touches[0].target.offsetTop;
    mouse.move1(mouseX, mouseY);
  }

  tEnd(message) {
    if (table.isLocked() || racingDemon.gameState != GameState.Playing) { return }
    mouse.up1(mouse.x, mouse.y);
  }

  disableTchDefault(message: TouchEvent) {
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
  public down1(x: number, y: number) {
    this.mouseUp = false;
    this.x = x;
    this.y = y;
    this.downX = x;
    this.downY = y;
  }

  public move1(x: number, y: number) {
    let dX = x - this.x;
    let dY = y - this.y;
    if (!this.mouseUp) {
      if (this.dragging) {
        this.dragContinue(dX, dY);
      } else {
        // we might be starting a drag, if we have just moved from a down
        if (this.downX == this.x && this.downY == this.y) {
          this.dragStart(this.downX, this.downY);
        }
      }
    }
    this.x = x;
    this.y = y;
  }

  public up1(x: number, y: number) {
    // finalise drag or invoke click (but not too often)
    this.downX = -1;
    this.downY = -1;
    if (this.dragging) {
      this.dragEnd(x, y);
      this.dragging = false;
    } else {
      let cpFound = this.findCardUnderMouse(x, y);
      if (this.dragCancelled) {
        cpFound.cardI = -1;
        this.dragCancelled = false;
      }
      if (cpFound.cardI >= 0) {
        let date = new Date();
        let mSeconds = date.getTime();
        if ((mSeconds - this.previousClickTime) > 100) {
          if (this.keyPressed == -1) {
            racingDemon.click(cpFound.pileI, cpFound.cardI);
          }
          else {
            if (typeof (doTest) == 'function') {
              // change the card, cheat
              let card = table.piles[cpFound.pileI].cards[cpFound.cardI];
              if (this.keyPressed == 70) {
                // f: flip card
                card.faceUp = !card.faceUp;
              } else if (this.keyPressed >= 100) {
                // change suit
                card.cards52I = card.rank() - 1 + (this.keyPressed - 100);
              } else {
                // change card number
                card.cards52I = (this.keyPressed - 1) + card.suit() * 13;
              }
              this.keyPressed = -1;
              table.showCards(card.area);
              racingDemon.cheated++;
            }
          }
        }
        this.previousClickTime = mSeconds;
      }
    }
    this.mouseUp = true;
  }

  private dragStart(mouseX: number, mouseY: number) {
    let cpFound = this.findCardUnderMouse(mouseX, mouseY);
    if (cpFound.cardI >= 0) {
      let cardsToDrag = racingDemon.requestDrag(cpFound.pileI, cpFound.cardI);
      if (cardsToDrag == 0) {
        sound.soundFail()
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
      } else {
        // move cardI to drag pile 
        let oldCard = oldPile.cards[oldCardI];
        dragPile.emptyDrag();
        dragPile.x = oldCard.x;
        dragPile.y = oldCard.y;
        dragPile.addCardP(oldCard.playerI, oldCard.cards52I, oldCard.x, oldCard.y, true, 0);
        oldPile.cards.splice(oldCardI, 1);
      }
      redrawArea.clone(oldPile.area)
      redrawArea.addAreas(oldPile.area, dragPile.area)
      table.showCards(redrawArea);
      dragPile.broadcast(dragPileI)
      oldPile.broadcast(oldPileI);
    } 
  }

  private dragContinue(mouseDx: number, mouseDy: number) {
    // console.log("Drag continue " + mouseDx + "," + mouseDy);
    let area1 = new Area(dragPile.area.left, dragPile.area.top, dragPile.area.right, dragPile.area.bottom);
    dragPile.moveBy(mouseDx, mouseDy);
    let area3 = new Area();
    area3.addAreas(area1, dragPile.area);
    table.showCards(area3);
    dragPile.broadcast(dragPileI)
  }

  private dragEnd(mouseX: number, mouseY: number) {
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

  public dragAbortFromServer(pileI: number, reason:number) {
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

  public dragAbort(speed: number) {
    table.flyPile(this.sourcePileI, this.sourceX, this.sourceY, speed);
    this.dragging = false;
    this.dragCancelled = true;
    this.mouseUp = true;
    this.sourcePileI = -1;
    racingDemon.dragCardRank = 0;
    racingDemon.dragToPileI = -1;
}

  public dragSuccess() {
    this.dragging = false;
    this.dragCancelled = true;
    this.mouseUp = true;
    this.sourcePileI = -1;
    racingDemon.dragSuccess();
  }

  private findCardUnderMouse(mouseX: number, mouseY: number) {
    // return pile and card under mouse. Do not look in drag piles
    let pileI: number;
    let cardI: number;
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
            let mXY = new Coords(mouseX - card.x - halfWidth,
              mouseY - card.y - halfHeight);
            mXY.rotate(card.angle);   // should be -card.angle?? But this works!
            //drawPoint(mouseX, mouseY, "#FF0000");
            //drawPoint(card.x + halfWidth + mXY.x, card.y + halfHeight + mXY.y, "#00FFFF");
            if (-halfWidth < mXY.x && mXY.x < halfWidth &&
              -halfHeight < mXY.y && mXY.y < halfHeight) {
              return { pileI, cardI };
            }
          }
        }
        cardI = -1;
        return { pileI, cardI };  // clicking / dropping on empty pile
      }
    }
    pileI = -1;
    cardI = -1;
    return { pileI, cardI };
  }
}

//function drawPoint(x: number, y: number, fill: string) {
//  let pointL = 2;
//  x = (x - pointL);
//  y = (y - pointL);
//  table.ctx.fillStyle = fill;
//  table.ctx.fillRect(x, y, pointL * 2 , pointL * 2);
//}
