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
  humanName = "";
  botName = "";
  constructor() {
    // nothing to do
  }

  TellMeGroups() {
    this.groups = [];
    console.log("TellMeGroups");
    send("TellMeGroups");
  }

  GroupList(gList: Group[]) {
    // incoming message with list of groups
    this.groups.length = 0;
    for (let i = 0; i < gList.length; i++) {
      this.groups[i] = new Group(gList[i].name, gList[i].players, gList[i].playing,
        gList[i].onMobile, gList[i].aspectRatio);
    }
    this.showGroups();
    this.parseURL();
  }

  createGame(): void {
    this.creatingGroup = true;
    this.checkName();
}

  createGame2(): void {
    let bCardLT = new Bcard(0, 0, table.commonArea.left, table.commonArea.top, false, 0);
    bCardLT.coordsForServer();
    console.log("Create game " + this.playerName);
    // person creating game must be player [0]
    // for unknown reasons this does not appear properly unless we do it here too.
    racingDemon.players[0] = this.playerName;

    send("CreateGroup", this.playerName, table.siteWindow.onMobile, table.aspectRatio, bCardLT);
    this.play(this.playerName);
  }

  play(gameName: string) {
    this.getInGroup(gameName);
    (document.getElementById("buttonPlayBot") as HTMLButtonElement).disabled = true;
    (document.getElementById("botType") as HTMLSelectElement).disabled = true;
    toPage("playPage");
  }

  PlayersInGame(playerNames: string[]) {
    racingDemon.players = playerNames.slice();
    if (table.piles.length > 0) {
      table.showCards();    // gets player 1 name on player 0 board
    }
    if (racingDemon.players.length > 1) {
      table.startGameAllowed(true);
    }
  }

  PlayerNr(playerNr: number) {
    racingDemon.newPlayerDeal(playerNr);
    if (racingDemon.players.length > 1) {
      // Not sure why this doesn't happen in PlayersInGame. But it doesn't. So do here
      table.startGameAllowed(true);
    }
  }

  joinGame(): void {
    this.creatingGroup = false;
    this.checkName();
  }

  joinGame2(): void {
    const element = document.getElementById("gameList") as HTMLSelectElement;
    const group = this.groups[Number(element.value)]
    const  groupName = group.name;
    console.log("Join group " + groupName);
    if (this.playerName == "") {
      alert("Choose and Check Player name before joining game");
      return;
    }
    if (group.players == RDmaxPlayers || group.playing == true || (group.players == 2 && group.onMobile)) {
      this.infoMessage("Oops, cannot join this game");
      console.log("client rejected group/game join")
    } else {
      send("JoinGroup", groupName);
    }
  }

  JoinGroupRejected(): void {
    this.infoMessage("Oops, cannot join this game");
    console.log("server rejected group/game join")
  }

  JoinGroupAccepted(): void {
    const element = document.getElementById("gameList") as HTMLSelectElement;
    const group = this.groups[Number(element.value)]
    if (group.onMobile) {
      table.changeAspectRatio(group.aspectRatio);
    }
    this.play(group.name);
  }

  getInGroup(groupName: string) {
    (document.getElementById("buttonCreate") as HTMLButtonElement).disabled = true;
    (document.getElementById("playButton") as HTMLAnchorElement).outerHTML =
      '<a id="playButton" href="javascript:toPage(\'playPage\')">Game</a>';
    (document.getElementById("buttonJoin") as HTMLButtonElement).disabled = true;
    this.myGroup = groupName;
    this.showGroups();
  }

  selGameChange() {
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
    console.log("checkName " + this.playerName);
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
    console.log("NameOK ");
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
    const elemName = document.getElementById("userName") as HTMLInputElement;
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
    } else {
      let part1 = this.botName.slice(0, 5);
      let part2 = this.botName.slice(5, 22);
      this.botName = part1 + (Number(part2) + 1)
    }
    send("CheckName2", this.botName);
  }

  NameOK2() {
    // create game with bot name and launch human in new window
    (document.getElementById("userName") as HTMLInputElement).value = this.botName;
    (document.getElementById("buttonPlayBot") as HTMLButtonElement ).disabled = true;
    this.playerName = this.botName;
    this.createGame2();
    window.open(window.location.href + "?&joinBot&" + this.botName + "&" + this.humanName,
      '_blank');
    // will end up in new window at parseURL () then finishPlayBot()
  }

  parseURL() {
    // process URL command tail
    var myLoc = window.location;
    const paramArray = myLoc.search.split("&");
    switch (paramArray[1]) {
      case "joinBot":
        uGroups.finishPlayBot(decodeURIComponent(paramArray[2]), decodeURIComponent(paramArray[3]));
        break;
      case "invite":
        break;
      default:
      // nothing!
    }
  }

  finishPlayBot(botName: string, playerName: string) {
    // we want playerName joining group called botName
    // botName should be in groups list found by TellMeGroups(). TellMeGroups() NOT CALLED YET
    // find botName in groups list, set game selector accordingly, call uGroups.joinGame()
    (document.getElementById("userName") as HTMLInputElement).value = playerName;
    let botGroupI = 0;
    while (this.groups[botGroupI].name != botName) {
      botGroupI++;
      if (botGroupI >= this.groups.length) {
        return;   // some error!
      }
    }
    (document.getElementById("gameList") as HTMLSelectElement).value = botGroupI.toString();
    this.joinGame();
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
    setTimeout(clearError, 5000);

    function clearError() {
      document.getElementById("incomingMessage").innerHTML = "";
      document.getElementById("incomingMessage").className = saveClass;
    }
  }
}
