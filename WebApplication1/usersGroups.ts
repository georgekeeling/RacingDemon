"use strict";
// (c) George Arthur Keeling, Berlin 2023
class Group {
  name = "";
  players = 0;
  playing = false;
  onMobile = false;
  aspectRatio = 0;
  constructor(name: string, players: number, playing: boolean, onMobile: boolean, aspectRatio: number) {
    this.name = name;
    this.players = players;
    this.playing = playing;
    this.onMobile = onMobile;
    this.aspectRatio = aspectRatio;
  }
}
class UGroups {
  // User and Groups (games)
  myGroup = "";
  groups: Group[] = []; 
  playerName = "";
  startT = new Date();          // used for timing some messages
  creatingGroup = false;
  webPageStarting = true;
  humanName = "";
  constructor() {
    // nothing to do
  }

  TellMeGroups() {
    // called when website launched from chat.js
    this.groups = [];
    console.log("userGroups, TellMeGroups");
    send("TellMeGroups");
  }

  GroupList(gList: Group[]) {
    // incoming message with list of groups. Requested by TellMeGroups() or 
    // or sent here because a group was added / removed 
    console.log("userGroups, GroupList");
    this.groups.length = 0;
    for (let i = 0; i < gList.length; i++) {
      this.groups[i] = new Group(gList[i].name, gList[i].players, gList[i].playing,
        gList[i].onMobile, gList[i].aspectRatio);
    }
    this.showGroups();
    if (this.webPageStarting) {
      (document.getElementById("userName") as HTMLTextAreaElement).focus;
      this.webPageStarting = false;
      this.parseURL();
    }
  }

  createGame(): void {
    console.log("userGroups, createGame");
    this.creatingGroup = true;
    this.checkName();
}

  createGame2(): void {
    let bCardLT = new Bcard(0, 0, table.commonArea.left, table.commonArea.top, false, 0);
    bCardLT.coordsForServer();
    console.log("userGroups,createGame2 player: " + this.playerName);
    // person creating game must be player [0]
    // for unknown reasons this does not appear properly unless we do it here too.
    racingDemon.players[0] = this.playerName;

    send("CreateGroup", this.playerName, table.siteWindow.onMobile, table.aspectRatio, bCardLT);
    this.play(this.playerName);
  }

  play(gameName: string) {
    console.log("userGroups, play");
    this.getInGroup(gameName);
    (document.getElementById("buttonPlayBot") as HTMLButtonElement).disabled = true;
    (document.getElementById("botType") as HTMLSelectElement).disabled = true;
    toPage("playPage");
  }

  PlayersInGame(playerNames: string[]) {
    console.log("userGroups, PlayersInGame");
    racingDemon.players = playerNames.slice();
    if (table.piles.length > 0) {
      table.showCards();    // gets player 1 name on player 0 board
    }
    if (racingDemon.players.length > 1) {
      table.startGameAllowed(true);
    }
  }

  PlayerNr(playerNr: number) {
    // This is where both Join and Create end up if all is successful.
    // so we call newPlayerDeal to get cards on table
    console.log("userGroups, PlayerNr");
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

  joinGame(): void {
    console.log("userGroups, joinGame");
    this.creatingGroup = false;
    this.checkName();
  }

  joinGame2(): void {
    console.log("userGroups, joinGame2");
    const element = document.getElementById("gameList") as HTMLSelectElement;
    if (element.innerText == "None") {
      // last remaining group deleted behind my back!
      this.infoMessage("Sorry, game cancelled.");
      (document.getElementById("buttonJoin") as HTMLButtonElement).disabled = true;
      return;
    }
    const group = this.groups[Number(element.value)]
    const  groupName = group.name;
    console.log("userGroups, joinGame2, group " + groupName);
    if (group.players == RDmaxPlayers || group.playing == true || (group.players == 2 && group.onMobile)) {
      this.infoMessage("Oops, cannot join this game");
      (document.getElementById("buttonJoin") as HTMLButtonElement).disabled = true;
      console.log("client rejected group/game join")
    } else {
      send("JoinGroup", groupName);
    }
  }

  JoinGroupRejected(): void {
    console.log("userGroups, JoinGroupRejected");
    this.infoMessage("Oops, cannot join this game");
    (document.getElementById("buttonJoin") as HTMLButtonElement).disabled = true;
    console.log("server rejected group/game join")
  }

  JoinGroupAccepted(): void {
    console.log("userGroups, JoinGroupAccepted");
    const element = document.getElementById("gameList") as HTMLSelectElement;
    const group = this.groups[Number(element.value)]
    if (group.onMobile) {
      table.changeAspectRatio(group.aspectRatio);
    }
    this.play(group.name);
    if (bot.createStage == 4) {
      bot.launchBot();
    }
  }

  getInGroup(groupName: string) {
    console.log("userGroups, getInGroup");
    (document.getElementById("buttonCreate") as HTMLButtonElement).disabled = true;
    buttonPageEnable("playButton", true);
    (document.getElementById("buttonJoin") as HTMLButtonElement).disabled = true;
    this.myGroup = groupName;
    this.showGroups();
  }

  selGameChange() {
    console.log("userGroups, selGameChange");
    const elemSel = document.getElementById("gameList") as HTMLSelectElement;
    const group = this.groups[Number(elemSel.value)]
    const elemJoin = document.getElementById("buttonJoin") as HTMLButtonElement;
    if (this.myGroup != "") {
      // change selection back! When in group you can only see others
      const groupI = this.groups.findIndex((group: Group): boolean => { return (group.name == this.myGroup) } );
      if (groupI > -1) {
        elemSel.value = groupI.toString();
      }
      return;
    }
    if (group.players == RDmaxPlayers || group.playing == true ||
      (group.players == 2 && group.onMobile) || (table.siteWindow.onMobile && !group.onMobile)) {
      elemJoin.disabled = true;
    } else {
      elemJoin.disabled = false;
    }
  }

  checkNameBasic(name: string): string {
    // Perform basic checks on name. Modify if necessary.
    console.log("userGroups, checkNameBasic");
    const maxNameL = 10;
    name = name.trim();
    if (name.length > maxNameL) {
      // mobile browser allows long names!!
      name = name.slice(0, maxNameL);
    }
    if (name == "" || name.toLowerCase() == "none" || name.search("&") != -1) {
      this.errorMessage("Name may not be blank or 'none' or contain '&'");
      return "";  // name does not pass basic test
    }
    return name;   // name passes basic test
  }

  checkName() {
    let elem_userName = document.getElementById("userName") as HTMLInputElement;
    this.startT = new Date();
    this.playerName = elem_userName.value;
    console.log("userGroups, checkName " + this.playerName);
    this.playerName = this.checkNameBasic(this.playerName);
    if (this.playerName == "") {
      return;
    }
    elem_userName.value = this.playerName;
    send("CheckName", this.playerName);
  }

  NameOK() {
    let elem_userName = document.getElementById("userName") as HTMLInputElement;
    let endT = new Date();
    console.log("userGroups,NameOK ");
    this.infoMessage("Computer says: Name OK. (" + (endT.getTime() - this.startT.getTime()) + " ms)");
    this.playerName = elem_userName.value;
    elem_userName.readOnly = true;
    if (this.creatingGroup) {
      this.createGame2();
    } else {
      this.joinGame2();
    }
  }

  NameError() {
    let endT = new Date();
    console.log("userGroups, NameError");
    this.errorMessage("Name is in use. (" + (endT.getTime() - this.startT.getTime()) + " ms). Try another.");
    this.playerName = "";
  }

  playBot() {
    // create bot in a game.

    // 1) create game for user, as createGame. If that succeeds:
    // 2) create bot with botName, e.g.fBot1, mBot23,
    // 3) create connection and globals for bot
    // 4) join bot to game created in step 1. As joinGame except no visible window
    bot.createStage = 1;
    this.createGame();
  }
  playBot2(): void {
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

  playBot3ConnectionReady(): void {
    // for some reason, connection has gone back to original user's connection
    // it works as expected in testGlobals
    restoreGlobals(connectionStarting.connectionId);
    connectionStarting = null;
    bot.createStage = 3;    // now creating bot
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
    } else {
      let part1 = bot.name.slice(0, 5);
      let part2 = bot.name.slice(5, 22);
      bot.name = part1 + (Number(part2) + 1);
    }
    send("CheckNameBot", bot.name);
  }

  NameOKBot() {
    // could be called playBot4. 
    // bot has name and connection. Now join it to game
    (document.getElementById("buttonPlayBot") as HTMLButtonElement ).disabled = true;
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
  
  findGameAndSelect(game: string): number {
    let gameI = 0;
    while (this.groups[gameI].name != game) {
      gameI++;
      if (gameI >= this.groups.length) {
        return -1;
      }
    }
    (document.getElementById("gameList") as HTMLSelectElement).value = gameI.toString();
    return gameI;
  }

  invite() {
    // copy invite to clip board, if possible
    let inviteURL = window.location.origin + "/?&invite&" + uGroups.myGroup;
    const myConID = connection.connectionId;
    if (typeof (navigator.clipboard) == 'undefined') {
      let element = document.getElementById("inviteURL") as HTMLDivElement;
      element.innerHTML = "Invite: <strong>" + inviteURL + "</strong>";
      element.hidden = false;
      setTimeout(hideInvite, 10000);
    } else {
      // navigator.clipboard available only in secure contexts (HTTPS)
      // https://developer.mozilla.org/en-US/docs/Web/API/Clipboard 
      navigator.clipboard.writeText(inviteURL);
      table.writeCentralBiggish("Invite copied to clipboard");
    }
    function hideInvite() {
      restoreGlobals(myConID);
      let element = document.getElementById("inviteURL") as HTMLDivElement;
      element.hidden = true;
    }
  }


  acceptInvite(toGame: string) {
    let gameI = this.findGameAndSelect(toGame);
    if (gameI == -1) {
      this.errorMessage("Sorry, invitation has expired.");
      return;   // some error
    }
    // user must enter name and then press Join
    this.selGameChange();       // enables Join, if possible
    if ((document.getElementById("buttonJoin") as HTMLButtonElement).disabled) {
      // was not possible
      this.errorMessage("Sorry, unacceptable invite.");
      return;
    }
    (document.getElementById("normalHelp") as HTMLDivElement).hidden = true;
    (document.getElementById("invitedHelp") as HTMLDivElement).hidden = false;
    (document.getElementById("botType") as HTMLSelectElement).disabled = true;
    (document.getElementById("buttonPlayBot") as HTMLButtonElement).disabled = true;
    (document.getElementById("buttonCreate") as HTMLButtonElement).disabled = true;
  }

  ///////////////////////////////////////////////////////
  //message / display functions *********************
  showGroups() {
    const element = document.getElementById("gameList") as HTMLSelectElement;
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
      } else {
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

  getGroupName(group: string): string {
    return group.slice(0, group.length - 5);
  }

  errorMessage(error: string) {
    this.anyMessage(error, "errorColor");
  }

  infoMessage(message: string) {
    this.anyMessage(message, "infoColor");
  }

  anyMessage(message: string, color: string) {
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
