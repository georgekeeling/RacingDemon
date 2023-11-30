"use strict";
// (c) George Arthur Keeling, Berlin 2023
class SiteWindow {
    constructor() {
        // manages css for all pages on site, in theory
        // used for playPage and setUpPage
        this.fakeMobile = false; // set to true in debugger or if big screen joins mobile game
        this.onMobile = false; // true if fakeMobile or if real mobile
        this.bigFont = 30;
        this.mediumFont = 14;
        this.smallFont = 10;
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
        }
        else {
            this.bigFont = 30;
            this.mediumFont = 14;
            this.smallFont = 10;
        }
    }
    realMobile() {
        // return true if client is reall a mobile. 
        // fakeMobile set in debugger or when tablet joins mobile game
        return (this.onMobile && !this.fakeMobile);
    }
    addCss(cssFile) {
        const linkNode = document.createElement("link");
        const element = document.getElementById("sCss");
        element.remove();
        linkNode.setAttribute("id", "sCss");
        linkNode.setAttribute("rel", "stylesheet");
        linkNode.setAttribute("href", "CSS/" + cssFile);
        document.head.appendChild(linkNode);
    }
}
//# sourceMappingURL=siteWindow.js.map