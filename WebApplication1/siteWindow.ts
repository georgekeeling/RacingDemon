"use strict";
// (c) George Arthur Keeling, Berlin 2023

class SiteWindow {
  // manages css for all pages on site, in theory
  // used for playPage and setUpPage
  fakeMobile = false;   // set to true in debugger or if big screen joins mobile game
  onMobile = false;     // true if fakeMobile or if real mobile
  bigFont = 30;
  mediumFont = 14;
  smallFont = 10;

  constructor() {
    if (screen.width <= 480 || screen.height <= 480 || this.fakeMobile) {
      // mobile phone -
      this.onMobile = true;
      // always portrait
      this.addCss("g5MobilePortrait.css");
    }
    else {
      this.onMobile = false;
      this.addCss("g5Desk.css");
    }
    if (this.realMobile()) {
      this.bigFont = 80;
      this.mediumFont = 38;
      this.smallFont = 28;
    } else {
      this.bigFont = 30;
      this.mediumFont = 14;
      this.smallFont = 10;
    }
  }

  realMobile(): boolean {
    // return true if client is reall a mobile. 
    // fakeMobile set in debugger or when tablet joins mobile game
    return (this.onMobile && !this.fakeMobile);
  }
  addCss(cssFile) {
    const linkNode = document.createElement("link") as HTMLLinkElement;
    const element = document.getElementById("sCss") as HTMLLinkElement;
    element.remove();
    linkNode.setAttribute("id", "sCss");
    linkNode.setAttribute("rel", "stylesheet")
    linkNode.setAttribute("href", "CSS/" + cssFile)
    document.head.appendChild(linkNode);
  }

}

