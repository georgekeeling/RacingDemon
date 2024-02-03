"use strict";
// (c) George Arthur Keeling, Berlin 2023

class DealTarget {
  // info for next card in deal
  pileI: number;
  x: number;
  y: number;
  faceUp: boolean;
  angle: number;

  constructor() {
    this.pileI = -1;
    this.x = 0;
    this.y = 0;
    this.angle = 0;
    this.faceUp = true;
  }
}

class Coords {      // increasing x goes more to the right, increasing y goes more down =upside down Cartesian
                    // an unfortunate error by early computer programmers which we still suffer from :-(
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  rotate(angle: number) {
    // rotate clockwise by angle in degrees
    // see https://en.wikipedia.org/wiki/Rotation_matrix
    angle = -angle * Math.PI / 180;  // anticlockwise in radians
    let x = this.x;
    let y = this.y;
    this.x = x * Math.cos(angle) - y * Math.sin(angle);
    this.y = x * Math.sin(angle) + y * Math.cos(angle);
  }

}

/*
 * Rectangular area, often used to show total area affected by card or pile
 * I often get confused by area because you might expect top > bottom
 * But because Y coordinates are upside down we always have bottom > top
 */
class Area {
  left: number;     // could have been x1,y1,x2,y2
  top: number; 
  right: number;
  bottom: number;

  constructor(l?: number, t?: number, r?: number, b?: number) {
    this.left = Nor0(l);
    this.top = Nor0(t);  
    this.right = Nor0(r);
    this.bottom = Nor0(b);

    function Nor0(n ?: number): number {
      if (typeof (n) == 'undefined') { return 0 } else { return n }
    }
  }

  clone(fromArea: Area) {
    this.left = fromArea.left;
    this.top = fromArea.top;
    this.right = fromArea.right;
    this.bottom = fromArea.bottom;
  }

  addAreas(area1: Area, area2: Area) {
    this.left = (area1.left < area2.left) ? area1.left : area2.left;
    this.top = (area1.top < area2.top) ? area1.top : area2.top;
    this.right = (area1.right > area2.right) ? area1.right : area2.right;
    this.bottom = (area1.bottom > area2.bottom) ? area1.bottom : area2.bottom;
  }

  overlaps(area2: Area): boolean {
    // return true if two areas overlap
    // thanks: https://stackoverflow.com/questions/20925818/algorithm-to-check-if-two-boxes-overlap
    if (!this.overlapsRange(this.left, this.right, area2.left, area2.right)) {
      return false;
    }
    if (!this.overlapsRange(this.top, this.bottom, area2.top, area2.bottom)) {
      return false;
    }
    return true;
  }

  private overlapsRange(xMin1: number, xMax1: number, xMin2: number, xMax2: number) : boolean {
    return (xMax1 >= xMin2 && xMax2 >= xMin1);
  }
}

class Card {
  // a card at a position usually in a pile.
  playerI: number;     // player nr of player card belongs to and therefore cardback
  cards52I: number;     // index into cards.cards52 so you know what card it is, 0 = Ace Spades
  x: number;          // x,y pos of top left of card when it is not rotated
  y: number;
  faceUp: boolean;
  angle: number;      // rotation angle, clockwise in degrees. Range 0-179
  area: Area;         // top, left of area = x,y when not rotated. Otherwise different
  pile: Pile;         // the pile it is on

  constructor(pile: Pile, playerI: number, cards52I: number, xPos: number, yPos: number, faceUp: boolean, angle: number) {
    this.pile = pile;
    this.cards52I = cards52I;
    this.playerI = playerI;
    if (pile.cards.length == 0) {
      pile.x = xPos;
      pile.y = yPos;
    }
    this.x = xPos;
    this.y = yPos;
    this.faceUp = faceUp;
    this.angle = angle;
    this.area = new Area(this.x, this.y, xPos + table.cardWidth, yPos + table.cardHeight);
    this.angle = this.angle % 180;  // range +/- 179°
    if (this.angle < 0) { this.angle += 180 }   // range 0-179
    if (this.angle != 0) {
      // card is rotated about centre by angle
      this.calcRotate();
    }
  }

  private calcRotate() {
    // calculate area used by card that is rotated
    // method: rotate card centred on origin, then map back new area to the card
    let halfWidth = table.cardWidth / 2;
    let halfHeight = table.cardHeight / 2;

    let tl = new Coords(-halfWidth, -halfHeight);
    let tr = new Coords(halfWidth, -halfHeight);
    let bl = new Coords(-halfWidth, halfHeight);
    let br = new Coords(halfWidth, halfHeight);

    tl.rotate(this.angle);
    tr.rotate(this.angle);
    bl.rotate(this.angle);
    br.rotate(this.angle);

    this.area.left = this.x + halfWidth + Math.min(tr.x, tl.x, bl.x, br.x);
    this.area.right = this.x + halfWidth + Math.max(tr.x, tl.x, bl.x, br.x);
    this.area.top = this.y + halfHeight + Math.min(tr.y, tl.y, bl.y, br.y);
    this.area.bottom = this.y + halfHeight + Math.max(tr.y, tl.y, bl.y, br.y);
  }

  setAngle(angle: number) {
    this.angle = angle;
    this.calcRotate();
    this.pile.recalcArea();
  }

  suit(): number {
    return Math.floor(this.cards52I / 13);
  }
  rank(): number {
    return this.cards52I % 13 + 1;    // not zero base. Ace = 1, 2=2, king = 13
  }
  isBlack(): boolean {
    if (this.cards52I < 13 || this.cards52I >= 39) return true;
    return false;
  }
}

class Pile {
  // a pile of cards often cascaded. Once placed on table x,y should never change. 
  // Unless its the dragPile or the window / table is being resized
  area: Area;   // the total extent of the pile
  x: number; y: number;     // x,y = official left top of pile. same as area.left, area.top 
                            // unless pile contains rotated or jinked  cards
  cards: Card[] = [];   // cards in the pile. Obviously!

  constructor(x: number, y: number) {
    this.area = new Area(x, y, x + table.cardWidth, y + table.cardHeight);
    this.x = x;
    this.y = y;
  }

  clone(fromPile: Pile) {
    this.x = fromPile.x;
    this.y = fromPile.y;
    this.area.clone(fromPile.area);
    for (let i = 0; i < fromPile.cards.length; i++) {
      let thisC = fromPile.cards[i];
      this.addCardP(thisC.playerI, thisC.cards52I, thisC.x, thisC.y, thisC.faceUp, thisC.angle);
      this.cards[i].area.clone(thisC.area);
    } 
  }

  addCardP(playerI: number, cardI: number, x: number, y: number, faceUp?: boolean, angle?: number) {
    let newI = this.cards.length;
    if (typeof (faceUp) == 'undefined') { faceUp = true };
    if (typeof (angle) == 'undefined') { angle = 0 };
    this.cards[newI] = new Card(this, playerI, cardI, x, y, faceUp, angle);
    this.recalcArea();
  }

  recalcArea() {
    let cardI = this.cards.length;
    if (cardI > 0) {
      this.area.clone(this.cards[0].area);
      cardI--;
      while (cardI >= 1) {
        this.area.addAreas(this.area, this.cards[cardI].area);
        cardI--;
      }
    } else {
      // 0 cards 
      this.area.left = this.x;
      this.area.top = this.y;
      this.area.right = this.x + table.cardWidth;
      this.area.bottom = this.y + table.cardHeight;
    }
  }

  collapse(fromCardI: number, toCardI: number) {
    // collapse part of pile and redraw
    let redrawArea = new Area(this.area.left, this.area.top, this.area.right, this.area.bottom)
    let prevCard: Card
    let thisCard: Card

    for (let cardI = fromCardI + 2; cardI <= toCardI; cardI++) {
      prevCard = this.cards[cardI - 1]
      thisCard = this.cards[cardI]
      thisCard.y = prevCard.y
      thisCard.area.top = prevCard.area.top
      thisCard.area.bottom = prevCard.area.bottom
    }

    thisCard.y += table.yStep / 4
    thisCard.area.top += table.yStep / 4
    thisCard.area.bottom += table.yStep / 4

    if (toCardI < this.cards.length - 1) {
      // there are more cards to go
      let dy = this.cards[toCardI + 1].y - thisCard.y - table.yStep   // amount cards moved up
      for (let cardI = toCardI + 1; cardI < this.cards.length; cardI++) {
        thisCard = this.cards[cardI]
        thisCard.y -= dy
        thisCard.area.top -= dy
        thisCard.area.bottom -= dy
      }
    }
    this.recalcArea()
    table.showCards(redrawArea)
  }

  uncollapse(fromCardI: number, toCardI: number) {
    // uncollapse part of pile and redraw
    let prevCard: Card
    let thisCard: Card

    for (let cardI = fromCardI + 1; cardI <= toCardI; cardI++) {
      prevCard = this.cards[cardI - 1]
      thisCard = this.cards[cardI]
      thisCard.y = prevCard.y + table.yStep
      thisCard.area.top = prevCard.area.top + table.yStep
      thisCard.area.bottom = prevCard.area.bottom + table.yStep
    }

    if (toCardI < this.cards.length - 1) {
      // there are more cards to go
      let dy = this.cards[toCardI + 1].y - thisCard.y - table.yStep   // amount cards moved down
      for (let cardI = toCardI + 1; cardI < this.cards.length; cardI++) {
        thisCard = this.cards[cardI]
        thisCard.y -= dy
        thisCard.area.top -= dy
        thisCard.area.bottom -= dy
      }
    }

    this.recalcArea()
    table.showCards(this.area)
  }

  endCard(): Card {
    // return card at end (or top) of pile. This is done a zillion times
    return this.cards[this.cards.length - 1]
  }

  moveTo(x: number, y: number) {
    // this.moveBy(x - this.x, y - this.y); Gets wrong answer by ~.0000000000001 15% of time, See tests / SSbug230312
    // This, more complex version, uses the input x,y wherever possible
    let origX = this.x;
    let dx = x - this.x;
    let origY = this.y;
    let dy = y - this.y;

    this.area.left = moveToX(this.area.left);
    this.area.right = moveToX(this.area.right);
    this.area.top = moveToY(this.area.top);
    this.area.bottom = moveToY(this.area.bottom);
    this.x = moveToX(this.x);
    this.y = moveToY(this.y);
    for (let cardI = 0; cardI < this.cards.length; cardI++) {
      let card = this.cards[cardI];
      card.x = moveToX(card.x);
      card.y = moveToY(card.y);
      card.area.left = moveToX(card.area.left);
      card.area.top = moveToY(card.area.top);
      card.area.right = moveToX(card.area.right);
      card.area.bottom = moveToY(card.area.bottom);
    }

    function moveToX(thisX: number): number{
      if (thisX == origX) { return x };
      return thisX + dx;
    }
    function moveToY(thisY: number): number {
      if (thisY == origY) { return y };
      return thisY + dy;
    }
  }

  moveBy(dx: number, dy: number) {
    this.area.left += dx;
    this.area.right += dx;
    this.area.top += dy;
    this.area.bottom += dy;
    this.x += dx;
    this.y += dy;
    for (let cardI = 0; cardI < this.cards.length; cardI++) {
      let card = this.cards[cardI];
      card.x += dx;
      card.y += dy;
      card.area.left += dx;
      card.area.top += dy;
      card.area.right += dx;
      card.area.bottom += dy;
    }
  }

  spliceToDrag(fromCardI: number) {
    // move cards in pile from fromCardI to end to dragPile
    dragPile.cards = this.cards.splice(fromCardI);
    dragPile.setCpiles();
    dragPile.x = dragPile.cards[0].x;
    dragPile.y = dragPile.cards[0].y;
    dragPile.recalcArea();
    this.recalcArea();
  }

  addDrag() {
    // append dragPile to pile. Delete dragPile
    this.cards = this.cards.concat(dragPile.cards);
    this.setCpiles();
    this.recalcArea();
    dragPile.emptyDrag();
  }

  private setCpiles() {
    for (let card of this.cards) {
      card.pile = this;
    }
  }

  emptyDrag() {
    // should only be used on dragpile.
    if (this !== dragPile) { alert("Pile error: Go debug") }
    this.area.left = -10;
    this.area.top = -10;
    this.area.right = -10;
    this.area.bottom = -10;
    this.cards = [];
  }

  broadcast(pileI: number) {
    // broadcast to other players
    // clone pile with normalised coordinates to Bcard array, broadcast
    let bPileXY = new Bcard(racingDemon.playerI, 0, this.x, this.y, false, 0);
    bPileXY.coordsForServer();
    let bCards = this.createBcardsForBroadcast();
    //console.log("PileBroadcast from player:" + racingDemon.playerI + " pile:" + pileI + " x,y:" +
    //  Math.round(bPileXY.x) + "," + Math.round (bPileXY.y) + " bCards:" + bCards.length);
    sendGroup("PileBroadcast", pileI, bPileXY.x, bPileXY.y, bCards);
  }

  createBcardsForBroadcast(): Bcard[] {
    let bCards: Bcard[] = [];
    for (let cardI = 0; cardI < this.cards.length; cardI++) {
      let card = this.cards[cardI];
      bCards[cardI] = new Bcard(card.playerI, card.cards52I, card.x, card.y, card.faceUp, card.angle);
      bCards[cardI].coordsForServer();
    }
    return bCards;
  }

  receive(pileI: number, pileX: number, pileY: number, bCardsIn: Bcard[]) {
    // receive pile data that was sent out by broadcast (probably from another player)
    // console.log("Player: " + racingDemon.playerI + " received " + bCardsIn.length + " cards.");
    let redrawArea = new Area(this.area.left, this.area.top, this.area.right, this.area.bottom);
    let bPileXY = new Bcard(racingDemon.playerI, 0, pileX, pileY, false, 0);
    bPileXY.coordsForReceive();
    this.x = bPileXY.x;     // recalcArea will look after this.area
    this.y = bPileXY.y;
    this.cards = [];
    this.recalcArea();
    for (let cardI = 0; cardI < bCardsIn.length; cardI++) {
      let bCard = new Bcard(bCardsIn[cardI].playerI, bCardsIn[cardI].cards52I,
        bCardsIn[cardI].x, bCardsIn[cardI].y, bCardsIn[cardI].faceUp, bCardsIn[cardI].angle);
      // I would have expected bCard = bCardsIn[cardI]. But it breaks something in SignalR
      bCard.coordsForReceive();
      this.addCardP(bCard.playerI, bCard.cards52I, bCard.x, bCard.y, bCard.faceUp, bCard.angle);
    }
    redrawArea.addAreas(redrawArea, this.area);
    table.showCards(redrawArea);
  }
}
class Bcard {
  // similar to cards, used for sending / receiving pile data. 
  // Same field names /types as Bcard in Gls.cs (but not in same order)
  playerI: number;
  cards52I: number;    
  x: number;          
  y: number;
  faceUp: boolean;
  angle: number;      
  constructor(playerI: number, cards52I: number, x: number, y: number, faceUp: boolean, angle: number) {
    this.playerI = playerI;
    this.cards52I = cards52I;
    this.x = x;
    this.y = y;
    this.faceUp = faceUp;
    this.angle = angle;
  }

  coordsForServer() {
    // convert coordinates from local to server 
    // Origin at centre of table
    this.x -= table.width / 2;
    this.y -= table.height / 2;
    // scale to 1
    this.x /= table.cardScale;
    this.y /= table.cardScale;
    // rotate
    this.rotateForServer();
  }

  rotateForServer() {
    // get coordinates of playerI piles in 'server' orientation
    // rotate about centre of table, swap top/bottom, left/right as necessary
    // horizontal cards on left and right have coordinates as if vertical
    // server coordinates centred on centre of table at scale 1 (but y still increases downwards)
    let x = this.x;
    switch (racingDemon.playerI) {
      case -1:        // before playerI assigned calles in ug.createGame2. playerI will be 0, soon
      case 0:
        // bottom to bottom. 
        break;
      case 1:
        // bottom to top
        this.x = - this.x - table.SVGwidth;
        this.y = - this.y - table.SVGheight;
        break;
      case 2:
        // bottom to right
        this.x = this.y - table.SVGwidth / 2 + table.SVGheight / 2;
        this.y = -x - table.SVGwidth / 2 - table.SVGheight / 2;
        this.angle += 90;
        break;
      case 3:
        // bottom to left
        this.x = -this.y - table.SVGwidth / 2 - table.SVGheight / 2;
        this.y = x + table.SVGwidth / 2 - table.SVGheight / 2;
        this.angle += 90;
        break;
      default:
        alert("Error in rotateForServer, go debug");
    }
  }

  coordsForReceive() {
    // convert coordinates from server to local
    this.rotateForReceive();
    this.x *= table.cardScale;
    this.y *= table.cardScale;
    this.x += table.width / 2;
    this.y += table.height / 2;
  }

  rotateForReceive() {
    let x = this.x;
    switch (racingDemon.playerI) {
      case 0:
        // no change
        break;
      case 1:
        // bottom <-> top, left<->right
        this.x = - this.x - table.SVGwidth;
        this.y = - this.y - table.SVGheight;
        break;
      case 2:
        // rotate clockwise 90°
        this.angle += 90;
        this.x = - this.y - table.SVGwidth / 2 - table.SVGheight / 2;
        this.y = x + table.SVGwidth / 2 - table.SVGheight / 2;
        break;
      case 3:
        // rotate anticlockwise 90°
        this.angle += 90;
        this.x = this.y - table.SVGwidth / 2 + table.SVGheight / 2;
        this.y = -x - table.SVGwidth / 2 - table.SVGheight / 2;
        break;
      default:
        alert("Error in rotateForClient, go debug");
    }
  }

}
class Table {
  cardScale = 1;
  readonly SVGwidth = 360;   // 360 = width from SVG file.
  readonly SVGheight = 540;
  cardWidth: number;
  cardHeight: number;
  yStep: number;    // vertical distance between cards in pile. Just big enough to see rank & suit

  commonArea = new Area();  // common area, different for tablet / smartphone

  width = 1000;
  height = 600;
  ctx: CanvasRenderingContext2D;
  siteWindow: SiteWindow;
  aspectRatio = 0;      // aspect ratio of canvas (= table). 1 on tablet, width/height on smart phone.
                        // game creator determines aspect ratio
                        // smartphones cannot join tablet game
                        // other players adopt aspect ratio (and CSS) of creator
  lockLevel = 0;
  lockTime = new Date();    // diagnostic, to see if lock gets permanent for bugs 10/7/23 & 25/6/23 & others YES
  readonly lockMaxTime = 60000; // diagnostic ditto. was 1 minute (60000 ms). 4 player game sort after endGame(15) took 38 seconds
  prevElapsedMs = -10000;   // diagnostic ditto

  piles: Pile[] = [];   // piles of cards on the table. Obviously!

  startAllowedFlasherID = 0;  // setInterval returns "a numeric, non-zero value"
  tip = "";                   // current tip drawn on table border above players home
  tipArea: Area;
  circles: Coords[] = [];     // centres of up to two circles in common area

  roundCounter = 0;
  gameCounter = 1;
  constructor() {
    // initialisation above happens before code is executed (see .js file)
    let c = document.getElementById("myCanvas") as HTMLCanvasElement;

    this.ctx = c.getContext("2d");

    this.siteWindow = new SiteWindow;
    this.circles[0] = new Coords(-1, -1);
    this.circles[1] = new Coords(-1, -1);
    this.tipArea = new Area();
    this.resize1();
  }

  lock(locker: string) {
    console.log("p" + racingDemon.playerI + " locked by " + locker)
    if (this.lockLevel == 0) {
      this.lockTime = new Date();
    }
    this.lockLevel++
  }

  unlock(locker: string) {
    console.log("p" + racingDemon.playerI + " unlocked by " + locker)
    if (this.lockLevel > 0) { this.lockLevel-- }
  }

  isLocked(): boolean {
    const now = new Date();
    const elapsedMs = now.getTime() - this.lockTime.getTime();
    if (this.lockLevel == 0) {
      this.prevElapsedMs = -10000;
      return false;
    }
    // limit number of log messages. Chrome limit is 1,000 messages.
    if ((elapsedMs - this.prevElapsedMs) > 1000) {
      console.log("p" + racingDemon.playerI + "Locked for " + elapsedMs + " ms");
      this.prevElapsedMs = elapsedMs;
    }
    if (elapsedMs > this.lockMaxTime) {
      alert("Table locked for " + elapsedMs + " ms.\nAuto unlocking.\nPlease send console log and screenshot for debugging.");
      this.lockLevel = 0;
      return false;
    }
    return (this.lockLevel > 0)
  }

  resize() {
    if (table.isLocked()) { return }
    let oldScale = this.cardScale;
    this.resize1();
    let reScale = this.cardScale / oldScale;
    for (let pileIx = 0; pileIx <= this.piles.length - 1; pileIx++) {
      let pile = this.piles[pileIx];
      pile.area.left *= reScale;
      pile.area.right *= reScale;
      pile.area.top *= reScale;
      pile.area.bottom *= reScale;
      pile.x *= reScale;
      pile.y *= reScale;
      for (let cardI = 0; cardI <= pile.cards.length - 1; cardI++) {
        let card = pile.cards[cardI];
        card.x *= reScale;
        card.y *= reScale;
        card.area.left *= reScale;
        card.area.right *= reScale;
        card.area.top *= reScale;
        card.area.bottom *= reScale;
      }
      pile.recalcArea();
    }
    //this.commonArea.left *= reScale;
    //this.commonArea.right *= reScale;
    //this.commonArea.top *= reScale;
    //this.commonArea.bottom *= reScale;
    this.showCards();
  }

  resize1(changedAspectRatio?: boolean) {
    if (typeof (changedAspectRatio) == 'undefined') {
      changedAspectRatio = false;
    }
    // find button height. Used to use  btnH = document.getElementsByTagName("button")[0].offsetHeight 
    // But Disabled and hidden buttons have height 0 : (
    let btnH = 25;

    let hidden = true;

    // Enable test button and w button if on desktop and js/tests.js module is present or if on fake mobile
    if (this.siteWindow.onMobile) {
      btnH = 64;
      if (window.innerHeight > window.innerWidth) {
        btnH *= 2;
        if (this.siteWindow.fakeMobile) {
          hidden = false;
        }
      }
    } else {
      if (typeof (doTest) == 'function') {
        hidden = false;
      }
    }
    document.getElementById("testButton").hidden = hidden;
    document.getElementById("wButton").hidden = hidden;
    document.getElementById("testButton2").hidden = hidden;
    document.getElementById("wButton2").hidden = hidden;


    let width = window.innerWidth - 18;
    let height = window.innerHeight - 30 - btnH;
    if (this.siteWindow.onMobile) {
      if (this.aspectRatio == 0 || changedAspectRatio) {
        // aspect ratio always portrait and fixed (unless its just been changed: changedAspectRatio)
        if (width < height) {
          this.width = width;
          this.height = height;
        } else {
          this.width = height;
          this.height = width;
        }
        if (changedAspectRatio) {
          this.width = this.aspectRatio * this.height;
        }
        this.aspectRatio = this.width / this.height;
      }
    }
    if (this.siteWindow.fakeMobile) {
      // keep aspect ratio and allow some resize
      this.width = this.aspectRatio * height;
      this.height = height;
    }

    if (!this.siteWindow.onMobile)
    {
      // not a mobile: width height may change, but always the same
      if (this.aspectRatio == 0) {
        this.aspectRatio = 1;
      }
      if (width < height) {
        this.height = width;
        this.width = width;
      } else {
        this.height = height;
        this.width = height;
      }
    }
    document.getElementById("myCanvas").setAttribute("width", this.width.toString());
    document.getElementById("myCanvas").setAttribute("height", this.height.toString());
    this.setScale();
    let leftRightMargin = this.cardHeight * 1.6;
    if (this.siteWindow.onMobile) {
      leftRightMargin = this.cardWidth * .3;
    }
    this.commonArea.left = leftRightMargin;
    this.commonArea.top = this.cardHeight * 1.6;
    this.commonArea.right = this.width - leftRightMargin;
    this.commonArea.bottom = this.height - this.cardHeight * 1.6;
  }

  setScale() {
    // set scale so we can get cards on table. 
    let cardsAcross = 13;        // number of vertical cards across table
    if (this.siteWindow.onMobile) {
      cardsAcross = 9;
    }
    this.cardScale = (this.width / cardsAcross) / this.SVGwidth;
    this.cardWidth = Math.round(100 * this.SVGwidth * this.cardScale) / 100;
    this.cardHeight = Math.round(100 * this.SVGheight * this.cardScale) / 100;
    this.yStep = this.cardHeight / 6;
  }

  changeAspectRatio(newAspectRatio) {
    // change aspect ratio to be same as game creator's which is mobile
    this.siteWindow.onMobile = true;
    this.siteWindow.fakeMobile = true;
    this.aspectRatio = newAspectRatio;
    this.resize1(true);
  }

  writeText(text: string, x: number, y: number, ifOverlaps?: Area): number {
    if (bot.active) { return };
    // write text at x,y in cleared rectangle, possibly if overlaps the area
    // textAlign, font face and font size already set
    const descender = this.ctx.measureText("gypHt").actualBoundingBoxDescent;
    const height = this.ctx.measureText("gypHt").actualBoundingBoxAscent + descender + 1;
    const width = this.ctx.measureText(text).width;
    if (typeof (ifOverlaps) != 'undefined') {
      let textArea = new Area(x, y, x + width, y + height);
      if (!textArea.overlaps(ifOverlaps)) {return height}
    }
    this.ctx.clearRect(x - 1, y, width + 4, height);
    this.ctx.fillText(text, x, y + height - descender);
    return height;
  }

  writeTip(message: string) {
    if (bot.active) { return };
    if (this.tip != "") {
      return;     // only one tip at a time
    }
    this.tip = message;
    this.writeTip2();
    const myConID = connection.connectionId;
    setTimeout(clearTip, 5000);

    function clearTip() {
      // **************** shoulld expamd redraw area to include circles.
      // this not working here.
      restoreGlobals(myConID);
      if (bot.active) { return };
      table.tip = "";
      table.circles[0].x = -1;
      table.circles[1].x = -1;
      table.showCards(this.tipArea);
    }
  }

  writeTip2() {
    if (bot.active) { return };
    if (this.tip == "") {
      return;
    }
    this.ctx.font = this.siteWindow.mediumFont + "px Sans-Serif";
    const width = this.ctx.measureText(this.tip).width;
    this.tipArea.left = (this.width - width) / 2;
    this.tipArea.top = this.commonArea.bottom - table.yStep;
    const height = this.writeText(this.tip, this.tipArea.left, this.tipArea.top);
    this.tipArea.right = this.tipArea.left + width;
    this.tipArea.bottom = this.tipArea.top + height;
  }

  drawCircle(pileI: number) {
    if (bot.active) { return };
    const pile = table.piles[pileI];
    const centreX = pile.x + table.cardWidth / 2;
    const centreY = pile.y + table.cardHeight / 2;
    const radius = Math.sqrt(table.cardWidth * table.cardWidth + table.cardHeight * table.cardHeight) / 2;

  }

  createCircle(circleI: number, pileI: number) {
    if (bot.active) { return };
    const pile = table.piles[pileI];
    this.circles[circleI].x = pile.x + table.cardWidth / 2;
    this.circles[circleI].y = pile.y + table.cardHeight / 2;
  }

  drawCircles() {
    if (bot.active) { return };
    if (this.tip == "") {
      return;
    }
    const radius = Math.sqrt(table.cardWidth * table.cardWidth + table.cardHeight * table.cardHeight) / 2;
    for (let circleI = 0; circleI < this.circles.length; circleI++) {
      if (this.circles[circleI].x > -1) {
        this.ctx.beginPath();
        this.ctx.arc(this.circles[circleI].x, this.circles[circleI].y, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
      }
    }

  }

  clearCentralBiggish(written: string) {
    if (bot.active) { return };
    const fontSize = this.siteWindow.mediumFont;
    const heightCL = fontSize * 1.5;
    this.ctx.font = fontSize + "px Sans-Serif";
    let textWidth = this.ctx.measureText(written).width;
    this.ctx.clearRect((this.width - textWidth) / 2, (this.height - heightCL) / 2, textWidth, heightCL);
  }

  writeCentralBiggish(written: string, height?: number) {
    if (bot.active) { return };
    // height is where bottom of text will be.
    const fontSize = this.siteWindow.mediumFont;
    if (typeof (height) == 'undefined') {
      height = (this.height + fontSize) / 2;    // text will appear half way down
    }
    this.ctx.font = fontSize + "px Sans-Serif";
    this.ctx.fillStyle = "#ffffc8";   // sickly yellow from colour picker  https://g.co/kgs/JspJG1
    this.ctx.textAlign = "center";
    // draw centred text. X coord is centre of text. Y coord (parameter 3) is where BOTTOM of text is!!!
    this.ctx.fillText(written, this.width / 2, height);
  }

  writeCentralBigRandomFont(written: string): number {
    if (bot.active) { return };
    // ctx.measureText() measures width of text ....
    const fontSize = this.setBigRandomFont();
    const heightCL = fontSize * 1.5;
    const topCL = (this.height - heightCL) / 2;
    this.ctx.textAlign = "center";
    this.ctx.clearRect(this.commonArea.left + 2, topCL, 
      this.commonArea.right - this.commonArea.left - 4, heightCL * 1.2);
    // draw centred text. X coord is centre of text. Y coord (parameter 3) is where BOTTOM of text is!!!
    this.ctx.fillText(written, this.width / 2, topCL + heightCL - 1);
    return topCL;   // top of cleared area
  }

  setBigRandomFont(): number {
    if (bot.active) { return };
    const fontSize = this.siteWindow.bigFont;
    const fontFamilies = ["Serif", "Sans-Serif", "Monospace", "Cursive", "Fantasy"];
    // list of fonts from https://blog.hubspot.com/website/web-safe-html-css-fonts
    // answer to google question "What font styles are available in HTML?"
    const fontFI = Math.floor(Math.random() * fontFamilies.length);
    this.ctx.font = fontSize + "px " + fontFamilies[fontFI];
    this.ctx.fillStyle = "#ffffc8";   // sickly yellow from colour picker  https://g.co/kgs/JspJG1
    return fontSize;
  }

  setCtxFontSize(size: number) {
    if (bot.active) { return };
    // font in form nnnpx font-name. change nnn to size
    let font = this.ctx.font;
    let pxPos = font.search("px"); 
    font = size.toString() + font.slice(pxPos); 
    this.ctx.font = font;
  }

  getCtxFontSize(): number {
    if (bot.active) { return };
    let font = this.ctx.font;
    return Number(font.slice(0, font.search("px")));
  }

  showCards(area?: Area) {
    if (bot.active) { return };
    if (typeof (area) == 'undefined') {
      area = new Area(0, 0, this.width, this.height);
    } else {
      // avoid smearing, due to rounding errors?
      area.left -= 2;
      area.top -= 2;
      area.right += 2;
      area.bottom += 2;
    }
    if (this.siteWindow.realMobile() && (window.innerWidth > window.innerHeight)) {
      // real mobile in portrait. Not allowed
      // most browsers allow you to lock screen in portrait. But not Safari, thanks
      // https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock  
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.ctx.font = this.siteWindow.smallFont + "px Sans-Serif";
      this.writeText("Rotate back to portrait", 0 , 0);
      return;
    }
    this.ctx.clearRect(area.left, area.top,
      (area.right - area.left), (area.bottom - area.top));
    for (let pileIx = 0; pileIx <= this.piles.length - 1; pileIx++) {
      let thisPile = this.piles[pileIx];
      if (!area.overlaps(thisPile.area)) { continue };
      showPile(thisPile);
    }

    this.showPlayerNamesScores(area);

    this.ctx.strokeStyle = "#bdc2bc";   // grey-ish from colour picker  https://g.co/kgs/JspJG1
    this.ctx.strokeRect(this.commonArea.left, this.commonArea.top,
      this.commonArea.right - this.commonArea.left,
      this.commonArea.bottom - this.commonArea.top);
    if (this.tip != "") {
      this.writeTip2();
      this.drawCircles();
    }
    function showPile(aPile: Pile) {
      table.ctx.save();
      table.ctx.scale(table.cardScale, table.cardScale);
      let hadFirstVisible = false;
      for (let cardI = 0; cardI <= aPile.cards.length - 1; cardI++) {
        let thisCard = aPile.cards[cardI];
        if (cardI < aPile.cards.length - 1) {
          // check if next card directly on top of this. Can be 1000 x faster see test, showPileRace
          let nextCard = aPile.cards[cardI + 1];
          if (nextCard.x == thisCard.x && nextCard.y == thisCard.y &&
            nextCard.angle == thisCard.angle) {
            continue;
          }
        }
        if (area.overlaps(thisCard.area) || hadFirstVisible) {
          hadFirstVisible = true;
          let CardImg = pack.cards52[thisCard.cards52I];
          if (!thisCard.faceUp) { CardImg = pack.cardBacks[thisCard.playerI] };
          if (thisCard.angle != 0) {
            // need some work: Draw from centre of card
            let centX = (thisCard.x + table.cardWidth / 2) / table.cardScale;
            let centY = (thisCard.y + table.cardHeight / 2) / table.cardScale;
            table.ctx.save();
            table.ctx.translate(centX, centY);
            table.ctx.rotate(thisCard.angle * Math.PI / 180);
            table.ctx.drawImage(CardImg, -table.cardWidth / 2 / table.cardScale,
              -table.cardHeight / 2 / table.cardScale);
            table.ctx.restore();
          }
          else {
            table.ctx.drawImage(CardImg, thisCard.x / table.cardScale, thisCard.y / table.cardScale);
          }
        }
      }
      table.ctx.restore();
    }
  }

  showPlayerNamesScores(area: Area) {
    if (bot.active) { return };
    this.ctx.font = this.siteWindow.smallFont + "px Sans-Serif";
    this.ctx.textAlign = "left";
    this.ctx.fillStyle = "#000000";   // was "#ffffc8" sickly yellow from colour picker  https://g.co/kgs/JspJG1
                                      // black is clearer
    let textHeight = 0;

    if (this.piles.length == 0) {
      return;       // Just in case showCards called early
    }

    for (let playerI = 0; playerI < racingDemon.players.length; playerI++) {
      let stockPile = this.piles[playerI * RDhomePiles];
      let nameX = stockPile.x;
      let nameY = stockPile.y;
      let scoreX = stockPile.x;
      let scoreY = stockPile.y;
      let halfWidth = table.width / 2;
      // adjust according to quadrant we are in
      if (nameX < halfWidth && nameY > halfWidth) {
        // bottom left
        nameY += table.cardHeight + table.yStep;
        scoreX += table.cardWidth / 3;
        scoreY -= table.yStep * 2;
      }
      if (nameX > halfWidth && nameY < halfWidth) {
        // top right
        nameY -= table.yStep * 1.5;
        scoreX += table.cardWidth / 3;
        scoreY += table.cardHeight + table.yStep;
      }
      if (nameX > halfWidth && nameY > halfWidth) {
        // bottom right. pile.x,y are at non-rotated positions
        nameX += (table.cardWidth / 2 - table.cardHeight / 2);
        nameY += table.cardHeight;
        scoreX -= table.cardWidth * .8;
        scoreY += table.cardHeight / 2;
      }
      if (nameX < halfWidth && nameY < halfWidth) {
        // top left. pile.x,y are at non-rotated positions
        nameX += (table.cardWidth / 2 - table.cardHeight / 2);
        scoreX += table.cardWidth + 2 * table.yStep;
        scoreY += table.cardHeight / 2;
      }
      textHeight = this.writeText(racingDemon.players[playerI], nameX, nameY, area);
      if (racingDemon.gameState == GameState.Scoring ||
        racingDemon.gameState == GameState.ShowingScores || racingDemon.gameState == GameState.GameOver) {
        this.writeText(racingDemon.roundScores[playerI].toString(10), scoreX, scoreY);
      }
    }
    if (racingDemon.gameState == GameState.ShowingScores || racingDemon.gameState == GameState.GameOver) {
      this.showScoreBoard(textHeight);
    }
  }

  showScoreBoard(textHeight: number) {
    if (bot.active) { return };
    // central area is empty, scoreboard goes there
    // always need heading line
    // round 1 needs 1 line, total 2 lines
    // round 2 needs 2 lines, underline, total , total 5 lines
    // round 3,4 ... needs three lines: round score, underline, sub-total to that round, total 5 + (r-2) * 3
    // r=3, lines = 8; r= 4 lines = 11 ....
    const roundsN = racingDemon.allScores.length;
    const lineHeight = textHeight + 1;
    const playersN = racingDemon.players.length;
    let linesNeeded = 2;
    let lineI = 1;
    let highestScore = 0;
    this.ctx.save();
    this.ctx.textAlign = "right";

    if (roundsN > 1) {
      linesNeeded = 2 + (roundsN - 2) * 3;
    }
    const totalHeight = table.height - table.cardHeight * 3.1
    const linesAvailable = Math.floor((totalHeight) / lineHeight);
    let skipLines =  linesNeeded - linesAvailable + 9;     // + 9 by trial and error :-(
    if (skipLines < 0) {
      skipLines = 0;
    }

    let totals = [0,0,0,0];
    let colsXL = [];    // left and right border of columns
    let colsXR = [];
    const textWidth = this.ctx.measureText("012345678901").width;

    colsXL[0] = table.width / 2 - (textWidth + table.yStep) * playersN / 2;
    colsXR[0] = colsXL[0] + textWidth;
    for (let colI = 1; colI < playersN; colI++) {
      colsXL[colI] = colsXL[colI - 1] + textWidth + table.yStep;
      colsXR[colI] = colsXR[colI - 1] + textWidth + table.yStep;
    }
    let totalWidth = colsXR[colsXR.length - 1] - colsXL[0];
    let rowY = table.cardHeight * 1.5 + table.yStep;
    this.ctx.clearRect(colsXL[0], rowY, totalWidth, totalHeight - table.yStep)
    for (let colI = 0; colI < playersN; colI++) {
      this.ctx.fillText(racingDemon.players[colI], colsXR[colI], rowY + textHeight);
    }
    rowY += lineHeight;
    for (let roundI = 0; roundI < roundsN; roundI++) {
      for (let colI = 0; colI < playersN; colI++) {
        totals[colI] += racingDemon.allScores[roundI][colI];
        if (totals[colI] > highestScore) {
          highestScore = totals[colI];
        }
      }
      if (skipLines <= 0) {
        for (let colI = 0; colI < playersN; colI++) {
          this.ctx.fillText(racingDemon.allScores[roundI][colI].toString(10), colsXR[colI], rowY + textHeight);
        }
        rowY += lineHeight;
        if (roundI > 0) {
          this.ctx.strokeRect(colsXL[0], rowY + lineHeight / 2, totalWidth, 0);
          rowY += lineHeight;
          for (let colI = 0; colI < playersN; colI++) {
            this.ctx.fillText(totals[colI].toString(10), colsXR[colI], rowY + textHeight);
          }
          rowY += lineHeight;
        }
      }
      else {
        skipLines -= 3;
      }
    }
    this.lastLine(totals, highestScore, colsXL[0], rowY + textHeight);
    this.ctx.restore();
  }

  lastLine(totals: number[], highestScore: number, X: number, Y: number) {
    if (bot.active) { return };
    let winners = "";
    let winnersN = 0;
    this.ctx.textAlign = "left";

    if (highestScore >= 100) {
      for (let playerI = 0; playerI < totals.length; playerI++) {
        if (totals[playerI] == highestScore) {
          winnersN++;
          if (winnersN == 1) {
            winners = racingDemon.players[playerI];
          } else {
            winners += ", " + racingDemon.players[playerI];
          }
        }
      }
      this.ctx.fillText(winners + " won. Touch start for new game.", X, Y);
    } else {
      this.ctx.fillText("Touch start for next round.", X, Y);
    }
  }

  addPile(x: number, y: number) {
    this.piles[this.piles.length] = new Pile(x, y);
  }

  addCardT(pile: number, playerI: number, cardIx: number, x: number, y: number, faceUp?: boolean, angle?: number) {
    this.piles[pile].addCardP(playerI, cardIx, x, y, faceUp, angle);
  }

  startGameAllowed(allowed: boolean) {
    if (bot.active) { return };
    const myConID = connection.connectionId;
    const startButton = document.getElementById("startButton") as HTMLButtonElement;
    if (!allowed) {
      startButton.disabled = true;
      if (this.startAllowedFlasherID != 0) {
        clearInterval(this.startAllowedFlasherID);
        this.startAllowedFlasherID = 0;
      }
      return;
    }
    if (startButton.disabled) {
      // only start reminder once. startGameAllowed may be called twice at start of game
      startButton.disabled = false;
      if (this.startAllowedFlasherID == 0) {
        this.startAllowedFlasherID = setInterval(pressStartQ, 10000);   // writeTip message cleared after 5000 ms
      }
    }
    function pressStartQ(): void {
      restoreGlobals(myConID);
      if (racingDemon.gameState == GameState.Playing) {
        // sometimes clearInterval is called by startGameAllowed(false)
        clearInterval(table.startAllowedFlasherID);
        table.startAllowedFlasherID = 0;
        return;
      }
      table.writeTip("Press Start?");
      sound.soundDing();
    }
}

  startGame() {
    // invoke StartGame2 on all players
    sendGroup("StartGame");
  }

  startGame2() {
    // start game on count of ready 2 steady 1 go 0
    if (bot.active) {
      this.startGame2bot();
      return;
    };
    (document.getElementById("inviteButton") as HTMLButtonElement).disabled = true;
    let moves = 4;
    const players = racingDemon.players.length;
    table.writeTip("     ");
    let message = "";
    const interval = 1000;
    const myConID = connection.connectionId;
    const id = setInterval(countDown, interval);
    let topRSGarea: number;

    this.startGameAllowed(false);

    countDown();
    switch (players) 
    {
      case 2:
        message = "2 players: Any suit on any suit"
        break;
      case 3:
        message = "3 players: Colours must match"
        break;
      default:
      case 4:
        message = "4 players: Suits must match"
        break;
    }
    this.writeCentralBiggish(message, topRSGarea - 5);

    function countDown() {
      restoreGlobals(myConID);
      switch (--moves) {
        case 3:
          topRSGarea = table.writeCentralBigRandomFont("Ready");
          sound.sayReady();
          break;
        case 2:
          topRSGarea = table.writeCentralBigRandomFont("Steady");
          sound.saySteady();
          break;
        case 1:
          sound.sayGo();
          (document.getElementById("tidyButton") as HTMLButtonElement).disabled = true;
          table.startGame3();
          table.showCards();    // clears messy table
          topRSGarea = table.writeCentralBigRandomFont("Go!");
          break;
        case 0:
          table.showCards();    // remove go
          clearInterval(id);
      }

    }
  }

  startGame3() {
    // gameState was waiting, ShowingScores or GameOver
    if (racingDemon.gameState == GameState.GameOver) {
      table.gameCounter++;
      table.roundCounter = 0;
      racingDemon.allScores = [];
      racingDemon.totalScores = [0, 0, 0, 0];
    }
    racingDemon.gameStateSet(GameState.Playing);
    const d = new Date();
    ++table.roundCounter;
    console.log("p" + racingDemon.playerI + " game " + table.gameCounter +
      " round " + table.roundCounter + " start at " + d);
  }

  startGame2bot() {
    setTimeout(myStart, 3000);
    const myConID = connection.connectionId;
    function myStart() {
      restoreGlobals(myConID);
      table.startGame3();
    }
  }

  stockToWaste() {
    // move drag pile (which is face down on top of stock pile) to waste.
    // 5 spread cards out a bit
    // 4 turn them face up
    // 3 move half way to waste
    // 2 move all way to waste
    // 1 unspread cards and join to waste
    let moves = 6;
    const interval = 20;
    let areaBefore = new Area();
    let areaRedraw = new Area();
    const StockPileI = racingDemon.playerI * RDhomePiles;
    const stockPile = table.piles[StockPileI];
    const wastePileI = StockPileI + 1;
    const wastePile = table.piles[wastePileI];

    table.lock("stockToWaste");
    const myConID = connection.connectionId;
    const id = setInterval(flip, interval);
    function flip() {
      restoreGlobals(myConID);
      areaBefore.clone(dragPile.area);
      switch (--moves) {
        case 5:
          dragPile.x += table.yStep;
          for (let cardI = dragPile.cards.length - 1; cardI >= 0; cardI--) {
            if (typeof (makeException) != 'undefined') {
              // do not come here if tsTest.js has been removed
              if (makeException) {
                cardI = dragPile.cards.length;
                makeException = false;
              }
            }
            let card = dragPile.cards[cardI];   // 21.7.23 was line 1067 (bug "d2023-07-10 theories.docx") 
            let dx = (cardI + 1) * table.yStep;
            card.x += dx;
            card.area.left += dx;
            card.area.right += dx;
          }
          dragPile.recalcArea();
          areaRedraw.addAreas(areaBefore, dragPile.area);
          table.showCards(areaRedraw);
          stockPile.broadcast(StockPileI);
          dragPile.broadcast(dragPileI);
          break;
        case 4:
          for (let card of dragPile.cards) {
            card.faceUp = true;
          }
          table.showCards(areaRedraw);
          dragPile.broadcast(dragPileI);
          break;
        case 3:
          dragPile.x += table.yStep;
          for (let card of dragPile.cards) {
            card.x += table.yStep;
            card.area.left += table.yStep;
            card.area.right += table.yStep;
          }
          dragPile.recalcArea();
          areaRedraw.addAreas(areaBefore, dragPile.area);
          table.showCards(areaRedraw);
          dragPile.broadcast(dragPileI);
          break;
        case 2: {
          let x0 = table.piles[racingDemon.playerI * RDhomePiles + 1].x -
            (dragPile.cards.length - 1) * table.yStep;
          dragPile.x += x0;
          for (let cardI = 0; cardI < dragPile.cards.length; cardI++) {
            dragPile.cards[cardI].x = x0 + cardI * table.yStep;
          }
          dragPile.recalcArea();
          areaRedraw.addAreas(areaBefore, dragPile.area);
          table.showCards(areaRedraw);
          dragPile.broadcast(dragPileI);
          break;
        }
        case 1: {
          dragPile.x = wastePile.x;
          for (let cardI = 0; cardI < dragPile.cards.length; cardI++) {
            let card = dragPile.cards[cardI];
            card.x = wastePile.x;
            card.area.left = wastePile.x;
            card.area.right = wastePile.area.right;
          }
          dragPile.recalcArea();
          areaRedraw.addAreas(areaBefore, dragPile.area);
          table.showCards(areaRedraw);
          wastePile.addDrag();
          dragPile.broadcast(dragPileI);
          wastePile.broadcast(wastePileI);
          clearInterval(id);
          table.unlock("stockToWaste");
          break;
        }
      }

    }
}

  flyPile(targetPileI: number, x: number, y: number, speed?: number) {
    // fly dragPile to x,y and add it to target pile, Speed 2 = slow, 1 = medium, 0 = very fast
    let targetPile = table.piles[targetPileI];
    if (typeof (speed) == 'undefined') {
      speed = 2;
    }
    let moves = 10;
    let pos = 0;
    let interval = 20;
    let areaBefore = new Area();
    let areaRedraw = new Area();
    switch (speed) {
      case 2:
        moves = 10;
        interval = 50;    // was 50 (5000 for extreme test of readyToDanceN)
        break;
      case 1:
        moves = 10;
        interval = 20;
        break;
      case 0:
        moves = 1;
        interval = 1;
    }
    let incX = (x - dragPile.x) / moves;
    let incY = (y - dragPile.y) / moves;
    if (isNaN(incY)) {
      debugger;   // this happened 9.6.23, but then disappeared
      alert("incY is NaN in table.flyPile a");
    }
    table.lock("flyPile")
    const myConID = connection.connectionId;
    const id = setInterval(fly1, interval);

    function fly1() {
      restoreGlobals(myConID);
      if (pos >= moves) {
        clearInterval(id);
        dragPile.moveTo(x, y);
        targetPile.addDrag();
        table.showCards(targetPile.area);
        targetPile.broadcast(targetPileI);
        dragPile.broadcast(dragPileI);
        table.unlock("flyPile");
        return;
      }
      areaBefore.clone(dragPile.area);
      dragPile.moveBy(incX, incY);
      if (isNaN(incY)) {
        debugger;   // this happened 9.6.23, but then disappeared
        alert("incY is NaN in table.flyPile b");
      }
      areaRedraw.addAreas(areaBefore, dragPile.area);
      table.showCards(areaRedraw);
      dragPile.broadcast(dragPileI);
      pos++;
    }
  }

}

class Pack {
  readonly cards52 = [];     // 52 card images
  readonly suitLetters = ['s', 'h', 'd', 'c'];
  readonly shuffled = [];
  readonly cardBacks = [document.getElementById("cBack0"), document.getElementById("cBack1"),
    document.getElementById("cBack2"), document.getElementById("cBack3")];

  constructor() {
    let j = 0;
    for (let letter of this.suitLetters) {
      for (let rank = 1; rank <= 13; rank++) {
        this.cards52[j++] = document.getElementById(letter + rank);
      }
    }
  }

  doShuffle(numPacks: number) {
    // create unshuffled pack in this.shuffled, then shuffle it
    let endShuffled = 52 * numPacks - 1;
    for (let i = 0; i <= endShuffled; i++) {
      this.shuffled[i] = i % 52;
    }
    this.shuffleArray(this.shuffled);
  }

  shuffleArray(array: number[]) {
    // from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      let temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }

  makeShuffledArray(array: number[], length: number) {
    // create array with length length and randomised numbers 0 to (length-1) in it
    // used by hint and clink functions to randomise pile chosen
    for (let i = 0; i < length; i++) {
      array[i] = i;
    }
    this.shuffleArray(array);
  }

}
