"use strict";
// (c) George Arthur Keeling, Berlin 2023
class Group {
    constructor(name, players, playing, onMobile, aspectRatio) {
        this.name = "";
        this.players = 0;
        this.playing = false;
        this.onMobile = false;
        this.aspectRatio = 0;
        this.name = name;
        this.players = players;
        this.playing = playing;
        this.onMobile = onMobile;
        this.aspectRatio = aspectRatio;
    }
}
class UGroups {
    constructor() {
        // User and Groups (games)
        this.myGroup = "";
        this.groups = [];
        this.playerName = "";
        this.startT = new Date(); // used for timing some messages
        this.creatingGroup = false;
        this.webPageStarting = true;
        this.humanName = "";
        this.botName = "";
        // nothing to do
    }
    TellMeGroups() {
        // called when website launched from cgat.js
        this.groups = [];
        console.log("TellMeGroups");
        send("TellMeGroups");
    }
    GroupList(gList) {
        // incoming message with list of groups. Requested by TellMeGroups() or 
        // or sent here because a group was added / removed 
        this.groups.length = 0;
        for (let i = 0; i < gList.length; i++) {
            this.groups[i] = new Group(gList[i].name, gList[i].players, gList[i].playing, gList[i].onMobile, gList[i].aspectRatio);
        }
        this.showGroups();
        if (this.webPageStarting) {
            document.getElementById("userName").focus;
            this.webPageStarting = false;
            this.parseURL();
        }
    }
    createGame() {
        this.creatingGroup = true;
        this.checkName();
    }
    createGame2() {
        let bCardLT = new Bcard(0, 0, table.commonArea.left, table.commonArea.top, false, 0);
        bCardLT.coordsForServer();
        console.log("Create game " + this.playerName);
        // person creating game must be player [0]
        // for unknown reasons this does not appear properly unless we do it here too.
        racingDemon.players[0] = this.playerName;
        send("CreateGroup", this.playerName, table.siteWindow.onMobile, table.aspectRatio, bCardLT);
        this.play(this.playerName);
    }
    play(gameName) {
        this.getInGroup(gameName);
        document.getElementById("buttonPlayBot").disabled = true;
        document.getElementById("botType").disabled = true;
        toPage("playPage");
    }
    PlayersInGame(playerNames) {
        racingDemon.players = playerNames.slice();
        if (table.piles.length > 0) {
            table.showCards(); // gets player 1 name on player 0 board
        }
        if (racingDemon.players.length > 1) {
            table.startGameAllowed(true);
        }
    }
    PlayerNr(playerNr) {
        racingDemon.newPlayerDeal(playerNr);
        if (racingDemon.players.length > 1) {
            // Not sure why this doesn't happen in PlayersInGame. But it doesn't. So do here
            table.startGameAllowed(true);
        }
    }
    joinGame() {
        this.creatingGroup = false;
        this.checkName();
    }
    joinGame2() {
        const element = document.getElementById("gameList");
        if (element.innerText == "None") {
            // last remaining group deleted behind my back!
            this.infoMessage("Sorry, game cancelled.");
            document.getElementById("buttonJoin").disabled = true;
            return;
        }
        const group = this.groups[Number(element.value)];
        const groupName = group.name;
        console.log("Join group " + groupName);
        if (group.players == RDmaxPlayers || group.playing == true || (group.players == 2 && group.onMobile)) {
            this.infoMessage("Oops, cannot join this game");
            document.getElementById("buttonJoin").disabled = true;
            console.log("client rejected group/game join");
        }
        else {
            send("JoinGroup", groupName);
        }
    }
    JoinGroupRejected() {
        this.infoMessage("Oops, cannot join this game");
        document.getElementById("buttonJoin").disabled = true;
        console.log("server rejected group/game join");
    }
    JoinGroupAccepted() {
        const element = document.getElementById("gameList");
        const group = this.groups[Number(element.value)];
        if (group.onMobile) {
            table.changeAspectRatio(group.aspectRatio);
        }
        this.play(group.name);
    }
    getInGroup(groupName) {
        document.getElementById("buttonCreate").disabled = true;
        document.getElementById("playButton").outerHTML =
            '<a id="playButton" href="javascript:toPage(\'playPage\')">Game</a>';
        document.getElementById("buttonJoin").disabled = true;
        this.myGroup = groupName;
        this.showGroups();
    }
    selGameChange() {
        const elemSel = document.getElementById("gameList");
        const group = this.groups[Number(elemSel.value)];
        const elemJoin = document.getElementById("buttonJoin");
        if (this.myGroup != "") {
            // change selection back! When in group you can only see others
            const groupI = this.groups.findIndex((group) => { return (group.name == this.myGroup); });
            if (groupI > -1) {
                elemSel.value = groupI.toString();
            }
            return;
        }
        if (group.players == RDmaxPlayers || group.playing == true ||
            (group.players == 2 && group.onMobile) || (table.siteWindow.onMobile && !group.onMobile)) {
            elemJoin.disabled = true;
        }
        else {
            elemJoin.disabled = false;
        }
    }
    checkNameBasic(name) {
        // Perform basic checks on name. Modify if necessary.
        const maxNameL = 10;
        name = name.trim();
        if (name.length > maxNameL) {
            // mobile browser allows long names!!
            name = name.slice(0, maxNameL);
        }
        if (name == "" || name.toLowerCase() == "none" || name.search("&") != -1) {
            this.errorMessage("Name may not be blank or 'none' or contain '&'");
            return ""; // name does not pass basic test
        }
        return name; // name passes basic test
    }
    checkName() {
        let elem_userName = document.getElementById("userName");
        this.startT = new Date();
        this.playerName = elem_userName.value;
        console.log("checkName " + this.playerName);
        this.playerName = this.checkNameBasic(this.playerName);
        if (this.playerName == "") {
            return;
        }
        elem_userName.value = this.playerName;
        send("CheckName", this.playerName);
    }
    NameOK() {
        let elem_userName = document.getElementById("userName");
        let endT = new Date();
        console.log("NameOK ");
        this.infoMessage("Computer says: Name OK. (" + (endT.getTime() - this.startT.getTime()) + " ms)");
        this.playerName = elem_userName.value;
        elem_userName.readOnly = true;
        if (this.creatingGroup) {
            this.createGame2();
        }
        else {
            this.joinGame2();
        }
    }
    NameError() {
        let endT = new Date();
        console.log("NameError ");
        this.errorMessage("Name is in use. (" + (endT.getTime() - this.startT.getTime()) + " ms). Try another.");
        this.playerName = "";
    }
    playBot() {
        // automatically create bot window in a game.
        // it would also work for sending out invites to game
        // 1) create bot & game in this window with generated this.botName, e.g. fBot1, mBot23
        // 2) open other window with original name from this window and bot name as parameters
        // 3) create user with original name and join bot game
        // code to open sibling window with parameters in URL
        const elemName = document.getElementById("userName");
        this.botName = "";
        this.humanName = elemName.value;
        this.humanName = uGroups.checkNameBasic(this.humanName);
        if (this.humanName == "") {
            return;
        }
        elemName.value = this.humanName;
        switch (bot.speed) {
            case 0:
                return;
            case 1:
                this.botName = "slBot";
                break;
            case 2:
                this.botName = "mdBot";
                break;
            case 3:
                this.botName = "faBot";
                break;
        }
        send("CheckName2", this.botName);
    }
    NameError2() {
        if (this.botName.length == 5) {
            this.botName += "1";
        }
        else {
            let part1 = this.botName.slice(0, 5);
            let part2 = this.botName.slice(5, 22);
            this.botName = part1 + (Number(part2) + 1);
        }
        send("CheckName2", this.botName);
    }
    NameOK2() {
        // create game with bot name and launch human in new window
        document.getElementById("userName").value = this.botName;
        document.getElementById("buttonPlayBot").disabled = true;
        this.playerName = this.botName;
        this.createGame2();
        let newWin = window.open(window.location.href + "?&joinBot&" + this.botName + "&"
            + this.humanName, '_blank');
        if (!newWin || newWin.closed || typeof newWin.closed == 'undefined') {
            //POPUP BLOCKED
            // https://stackoverflow.com/questions/2914/how-can-i-detect-if-a-browser-is-blocking-a-popup
            alert("Pop-ups blocked. Unable to open page for " + this.humanName + ".");
        }
        // will end up in new window at parseURL () then finishPlayBot()
    }
    parseURL() {
        // process URL command tail
        let myLoc = window.location;
        const paramArray = myLoc.search.split("&");
        switch (paramArray[1]) {
            case "joinBot":
                uGroups.finishPlayBot(decodeURIComponent(paramArray[2]), decodeURIComponent(paramArray[3]));
                break;
            case "invite":
                this.acceptInvite(decodeURIComponent(paramArray[2]));
                break;
            default:
            // nothing!
        }
    }
    finishPlayBot(botName, playerName) {
        // we want playerName joining group called botName
        // botName should be in groups list found by TellMeGroups(). TellMeGroups() NOT CALLED YET
        // find botName in groups list, set game selector accordingly, call uGroups.joinGame()
        document.getElementById("userName").value = playerName;
        let botGroupI = this.findGameAndSelect(botName);
        if (botGroupI == -1) {
            return; // some error!
        }
        this.joinGame();
    }
    findGameAndSelect(game) {
        let gameI = 0;
        while (this.groups[gameI].name != game) {
            gameI++;
            if (gameI >= this.groups.length) {
                return -1;
            }
        }
        document.getElementById("gameList").value = gameI.toString();
        return gameI;
    }
    invite() {
        // copy invite to clip board, if possible
        let inviteURL = window.location.origin + "/?&invite&" + uGroups.myGroup;
        if (typeof (navigator.clipboard) == 'undefined') {
            let element = document.getElementById("inviteURL");
            element.innerHTML = "Invite: <strong>" + inviteURL + "</strong>";
            element.hidden = false;
            setTimeout(this.hideInvite, 10000);
        }
        else {
            // navigator.clipboard available only in secure contexts (HTTPS)
            // https://developer.mozilla.org/en-US/docs/Web/API/Clipboard 
            navigator.clipboard.writeText(inviteURL);
            table.writeCentralBiggish("Invite copied to clipboard");
        }
    }
    hideInvite() {
        let element = document.getElementById("inviteURL");
        element.hidden = true;
    }
    acceptInvite(toGame) {
        let gameI = this.findGameAndSelect(toGame);
        if (gameI == -1) {
            this.errorMessage("Sorry, invitation has expired.");
            return; // some error
        }
        // user must enter name and then press Join
        this.selGameChange(); // enables Join, if possible
        if (document.getElementById("buttonJoin").disabled) {
            // was not possible
            this.errorMessage("Sorry, unacceptable invite.");
            return;
        }
        document.getElementById("normalHelp").hidden = true;
        document.getElementById("invitedHelp").hidden = false;
        document.getElementById("botType").disabled = true;
        document.getElementById("buttonPlayBot").disabled = true;
        document.getElementById("buttonCreate").disabled = true;
    }
    ///////////////////////////////////////////////////////
    //message / display functions *********************
    showGroups() {
        const element = document.getElementById("gameList");
        let elemValue = "0";
        element.innerHTML = "";
        // inner html will contain elements like
        // <option value="0" > Game 0(Np) < /option>
        // <option value="1" > a game(Npm) < /option > ...
        if (this.groups.length == 0) {
            element.innerHTML = '<option value="0">None</option>';
            return;
        }
        let groupI = 0;
        let innerHTML = "";
        for (let theGroup of this.groups) {
            innerHTML += '<option value="' + groupI.toString() + '">' + theGroup.name + '(';
            innerHTML += theGroup.players.toString();
            if (theGroup.playing) {
                innerHTML += 'p';
            }
            else {
                innerHTML += 'w';
            }
            if (theGroup.onMobile) {
                innerHTML += 'm';
            }
            innerHTML += ')</option>';
            if (theGroup.name == this.myGroup) {
                elemValue = groupI.toString();
            }
            groupI++;
        }
        element.innerHTML = innerHTML;
        element.value = elemValue;
        this.selGameChange();
    }
    getGroupName(group) {
        return group.slice(0, group.length - 5);
    }
    errorMessage(error) {
        this.anyMessage(error, "errorColor");
    }
    infoMessage(message) {
        this.anyMessage(message, "infoColor");
    }
    anyMessage(message, color) {
        let saveClass = document.getElementById("incomingMessage").className;
        document.getElementById("incomingMessage").className += " " + color;
        document.getElementById("incomingMessage").innerHTML = "Computer says: " + message;
        setTimeout(clearError, 5000);
        function clearError() {
            document.getElementById("incomingMessage").innerHTML = "";
            document.getElementById("incomingMessage").className = saveClass;
        }
    }
}
//# sourceMappingURL=usersGroups.js.map