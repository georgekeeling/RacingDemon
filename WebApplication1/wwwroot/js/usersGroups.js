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
        // nothing to do
    }
    TellMeGroups() {
        // called when website launched from chat.js
        this.groups = [];
        console.log("userGroups, TellMeGroups");
        send("TellMeGroups");
    }
    GroupList(gList) {
        // incoming message with list of groups. Requested by TellMeGroups() or
        // or sent here because a group was added / removed
        console.log("userGroups, GroupList");
        this.groups.length = 0;
        for (let i = 0; i < gList.length; i++) {
            this.groups[i] = new Group(gList[i].name, gList[i].players, gList[i].playing, gList[i].onMobile, gList[i].aspectRatio);
        }
        // must enable / disable botType and buttonJoin after groups change.
        // Latter done in showGroups / selGameChange
        this.showGroups();
        if (this.myGroup == "") {
            // special case on fresh screen
            document.getElementById("botType").disabled = false;
        }
        else {
            document.getElementById("botType").disabled =
                this.gameForbidden(this.myGroup);
        }
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
        // person creating game must be player [0]
        // for unknown reasons this does not appear properly unless we do it here too.
        racingDemon.players[0] = this.playerName;
        send("CreateGroup", this.playerName, table.siteWindow.onMobile, table.aspectRatio, bCardLT);
        this.play(this.playerName);
    }
    play(gameName) {
        this.getInGroup(gameName);
        document.getElementById("buttonPlayBot").disabled = true;
        document.getElementById("botType").disabled = this.gameForbidden(gameName);
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
        // This is where both Join and Create end up if all is successful.
        // so we call newPlayerDeal to get cards on table
        racingDemon.newPlayerDeal(playerNr);
        if (racingDemon.players.length > 1) {
            // Not sure why this doesn't happen in PlayersInGame. But it doesn't. So do here
            table.startGameAllowed(true);
        }
        switch (bot.createStage) {
            case 0:
                // normal create / join
                return;
            case 1:
                // creating user that wants bot. That worked so
                this.playBot2();
                break;
            case 2:
                // creating bot asked for by user
                break;
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
        if (this.gameForbidden(group)) {
            this.infoMessage("Oops, cannot join this game");
            document.getElementById("buttonJoin").disabled = true;
            console.log("client rejected group/game join");
        }
        else {
            send("JoinGroup", groupName);
        }
    }
    gameForbidden(param) {
        // parameter is group/game name or the group object
        let group = null;
        if (typeof (param) == "string") {
            for (let groupI = 0; groupI < this.groups.length; groupI++) {
                if (this.groups[groupI].name == param) {
                    group = this.groups[groupI];
                    break;
                }
            }
            if (group == null) {
                // console.log("gameForbidden " + param + " not in groups yet. Or param = ''");
                return true;
            }
        }
        else {
            group = param;
        }
        return (group.players == RDmaxPlayers ||
            group.playing == true ||
            (group.players == 2 && group.onMobile) ||
            (table.siteWindow.onMobile && !group.onMobile));
    }
    JoinGroupRejected() {
        this.infoMessage("Oops, cannot join this game");
        document.getElementById("buttonJoin").disabled = true;
        console.log("userGroups, JoinGroupRejected, server rejected group/game join");
    }
    JoinGroupAccepted() {
        const element = document.getElementById("gameList");
        const group = this.groups[Number(element.value)];
        if (group.onMobile) {
            table.changeAspectRatio(group.aspectRatio);
        }
        this.play(group.name);
        if (bot.createStage == 4) {
            bot.launchBot();
        }
    }
    getInGroup(groupName) {
        document.getElementById("buttonCreate").disabled = true;
        buttonPageEnable("playButton", true);
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
        if (this.gameForbidden(group)) {
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
        this.playerName = this.checkNameBasic(this.playerName);
        if (this.playerName == "") {
            return;
        }
        elem_userName.value = this.playerName;
        send("CheckName", this.playerName);
    }
    NameOK() {
        let elem_userName = document.getElementById("userName");
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
        this.errorMessage("Name is in use. (" + (endT.getTime() - this.startT.getTime()) + " ms). Try another.");
        this.playerName = "";
    }
    playBot() {
        // create bot in a game.
        // 1) create game for user, as createGame. If that succeeds:
        // 2) create bot with botName, e.g.fBot1, mBot23,
        // 3) create connection and globals for bot
        // 4) join bot to game created in step 1. As joinGame except no visible window
        if (this.myGroup == "") {
            bot.createStage = 1;
            this.createGame();
        }
        else {
            bot.createStage = 2;
            this.playBot2();
        }
    }
    playBot2() {
        if (connection.connectionId != glSavers[0].connection.connectionId) {
            // active connection must be for player, not for another bot
            // otherwise prevBot.speed = 0 below, is nonsense
            alert("Connection error in playbot2");
            return;
        }
        let prevBot = bot;
        let saveUGroups = uGroups;
        createGlobals();
        bot.speed = prevBot.speed;
        bot.name = prevBot.name;
        prevBot.speed = 0;
        prevBot.name = "";
        prevBot.createStage = 0;
        uGroups = saveUGroups;
        connection = startAny(this.playBot3ConnectionReady);
        declareMessages();
        addGlSaver();
    }
    playBot3ConnectionReady() {
        // for some reason, connection has gone back to original user's connection
        // it works as expected in testGlobals
        restoreGlobals(connectionStarting.connectionId);
        connectionStarting = null;
        bot.createStage = 3; // now creating bot
        switch (bot.speed) {
            case 0:
                return;
            case 1:
                bot.name = "slBot";
                break;
            case 2:
                bot.name = "mdBot";
                break;
            case 3:
                bot.name = "faBot";
                break;
        }
        send("CheckNameBot", bot.name);
    }
    NameErrorBot() {
        if (bot.name.length == 5) {
            bot.name += "1";
        }
        else {
            let part1 = bot.name.slice(0, 5);
            let part2 = bot.name.slice(5, 22);
            if (Number(part2) >= 99) {
                alert("Unable to create bot, userGroups.NameErrorBot");
                return;
            }
            bot.name = part1 + (Number(part2) + 1);
        }
        send("CheckNameBot", bot.name);
    }
    NameOKBot() {
        // could be called playBot4. 
        // bot has name and connection. Now join it to game
        this.creatingGroup = false;
        bot.active = true;
        bot.createStage = 4;
        this.joinGame2();
    }
    parseURL() {
        // process URL command tail
        let myLoc = window.location;
        const paramArray = myLoc.search.split("&");
        switch (paramArray[1]) {
            case "joinBot":
                alert("joinBot in URL deprecatd, userGroups, parseURL");
                return;
            case "invite":
                this.acceptInvite(decodeURIComponent(paramArray[2]));
                break;
            default:
            // nothing!
        }
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
        const myConID = connection.connectionId;
        if (typeof (navigator.clipboard) == 'undefined') {
            let element = document.getElementById("inviteURL");
            element.innerHTML = "Invite: <strong>" + inviteURL + "</strong>";
            element.hidden = false;
            setTimeout(hideInvite, 10000);
        }
        else {
            // navigator.clipboard available only in secure contexts (HTTPS)
            // https://developer.mozilla.org/en-US/docs/Web/API/Clipboard 
            navigator.clipboard.writeText(inviteURL);
            table.writeCentralBiggish("Invite copied to clipboard");
        }
        function hideInvite() {
            restoreGlobals(myConID);
            let element = document.getElementById("inviteURL");
            element.hidden = true;
        }
    }
    acceptInvite(toGame) {
        // user has to enter name and press Join button
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
        const myConID = connection.connectionId;
        setTimeout(clearError, 5000);
        function clearError() {
            restoreGlobals(myConID);
            document.getElementById("incomingMessage").innerHTML = "";
            document.getElementById("incomingMessage").className = saveClass;
        }
    }
}
//# sourceMappingURL=usersGroups.js.map