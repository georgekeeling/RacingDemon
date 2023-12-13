// (c) George Arthur Keeling, Berlin 2023

using Microsoft.AspNetCore.SignalR;
using RacingDemon;
using System.Timers;

// signalr
// https://learn.microsoft.com/en-us/aspnet/core/signalr/introduction?view=aspnetcore-7.0
// lists in c#
// https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.list-1?view=net-7.0

namespace SignalRChat.Hubs
{
  class GameListSend  // list of games / groups for SendGroups
  {
    public string Name { get; set; }
    public int Players { get; set; }
    public bool Playing { get; set; }
    public bool OnMobile { get; set; }
    public double AspectRatio { get; set; }
    public GameListSend(string name, int players, bool playing, bool onMobile, double aspectRatio)
    {
      Name = name;
      Players = players;
      Playing = playing;
      OnMobile = onMobile;
      AspectRatio = aspectRatio;
    }
  }
  public class ChatHub : Hub
  {
    // All messages to server come in here.
    // Come from client using connection.invoke("xyz", param1, param2, ...)
    // That calls Task xyz below with parameters param1, param2, ...
    public async Task TellMeGroups()
    {
      var cID = Context.ConnectionId;
      SRconsole("TellMeGroups");
      await SendGroups(false);
    }
    public async Task SendGroups(bool toAll)
    {
      var groupList = new GameListSend[Gls.games.Count];
      for (int i = 0; i < groupList.Length; i++)
      {
        groupList[i] = new GameListSend(Gls.games[i].Name, Gls.games[i].Players(), Gls.games[i].Playing,
          Gls.games[i].OnMobile, Gls.games[i].AspectRatio);
      }
      if (toAll)
      {
        await Clients.All.SendAsync("GroupList", groupList);
      }
      else
      {
        await Clients.Caller.SendAsync("GroupList", groupList);
      }
    }
    public async Task CreateGroup(string groupName, bool onMobile, double aspectRatio, Bcard bCardLT)
    {
      var cID = Context.ConnectionId;
      SRconsole("CreateGroup name " + groupName);
      await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
      Gls.games.Add(new Game(groupName, onMobile, aspectRatio, -bCardLT.x, -bCardLT.y));
      var user = Gls.users.Find(x => x.ConnectionId == cID);
      if (user != null)
      {
        user.InGame = groupName;
        SRconsole("Found user");
        await Clients.Group(groupName).SendAsync("SendToGroup", $"{user.Name} created the game {groupName}.");
        await SendGroups(true);
        await Clients.Caller.SendAsync("PlayerNr", 0);
      }
    }
    public async Task JoinGroup(string groupName)
    {
      // if there are less than four players, game not OnMobile and game has not started, caller can join game as player
      // or less tan 2 players, OnMobile and game has not started
      // client checks same conditions begore trying to join. But we must cope with sim
      SRconsole("JoinGroup name " + groupName);
      bool canJoin = false;
      var game = Gls.games.Find(x => x.Name == groupName);
      if (game != null)
      {
        if (game.OnMobile)
        {
          if (game.Players() == 1 && !game.Playing)
          {
            canJoin = true;
          }
        }
        else
        {
          if (game.Players() < 4 && !game.Playing)
          {
            canJoin = true;
          }
        }
      }
      if (!canJoin)
      {
        await Clients.Caller.SendAsync("JoinGroupRejected");
        return;
      }
      await Clients.Caller.SendAsync("JoinGroupAccepted");
      await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
      var user = Gls.users.Find(x => x.ConnectionId == Context.ConnectionId);
      if (user != null)
      {
        user.InGame = groupName;
        await Clients.Group(groupName).SendAsync("SendToGroup", $"{user.Name} joined the group {groupName}.");
        List<User> usersInGame = Gls.users.FindAll(x => x.InGame == groupName);
        string[] userNames = new string[usersInGame.Count];
        int i = 0;
        foreach (var thisUser in usersInGame)
        {
          userNames[i++] = thisUser.Name;
        }
        await Clients.Group(groupName).SendAsync("PlayersInGame", userNames);
        await Clients.Caller.SendAsync("PlayerNr", usersInGame.Count - 1);
        await SendGroups(true);
      }
    }
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
      // remove disconnected user from users list 
      // and remove group if it has no more members
      var usersI = Gls.users.FindIndex(x => x.ConnectionId == Context.ConnectionId);
      if (usersI != -1)
      {
        var user = Gls.users[usersI];
        var gameGroup = user.InGame;
        var userName = user.Name;
        Gls.users.RemoveAt(usersI);
        if (gameGroup != "")
        {
          // await Clients.Group(gameGroup).SendAsync("SendToGroup", $"{user.Name} left the group {gameGroup}.");
          var usersOtherI = Gls.users.FindIndex(x => x.InGame == gameGroup);
          var groupsI = Gls.games.FindIndex(x => x.Name == gameGroup);
          if (usersOtherI == -1)
          {
            // remove the group
            Gls.games.RemoveAt(groupsI);
          }
          else
          {
            if (Gls.games[groupsI].Players() == 1)
            {
              Gls.games[groupsI].Playing = false;
            }
            await Clients.Group(gameGroup).SendAsync("PlayerDeparted", userName);
          }
        }
        await SendGroups(true);
      }
      await base.OnDisconnectedAsync(exception);
    }
    public async Task CheckName(string playerName)
    {
      var cID = Context.ConnectionId;
      var Users = Gls.users;
      SRconsole("CheckName " + playerName);
      foreach (User theUser in Users)
      {
        if (theUser.Name.ToLower() == playerName.ToLower())
        {
          await Clients.Caller.SendAsync("NameError");
          return;
        }
      }
      Users.Add(new User(playerName, cID, ""));
      Gls.logs.Add(new Log("Added " + playerName));
      await Clients.Caller.SendAsync("NameOK");
      SRconsole("Num users = " + Users.Count);
    }
    public async Task CheckName2(string playerName)
    {
      var cID = Context.ConnectionId;
      var Users = Gls.users;
      SRconsole("CheckName2 " + playerName);
      foreach (User theUser in Users)
      {
        if (theUser.Name.ToLower() == playerName.ToLower())
        {
          await Clients.Caller.SendAsync("NameError2");
          return;
        }
      }
      Users.Add(new User(playerName, cID, ""));
      Gls.logs.Add(new Log("Added " + playerName));
      await Clients.Caller.SendAsync("NameOK2");
      SRconsole("Num users = " + Users.Count);
    }

    // 29.11.23 unable to find where this was used. Searching for '"NameError"'
    // It is only used on messages TO client

    //public async Task NameError(string atContextID)
    //{
    //  SRconsole("NameError " + atContextID);
    //  await Clients.Client(atContextID).SendAsync("NameError");
    //}
    public async Task UpdatePiles(string groupName)
    {
      SRconsole("UpdatePiles " + groupName);
      await Clients.Group(groupName).SendAsync("RequestPiles");
    }
    public async Task PileBroadcast(string groupName, int pileI, double pileX, double pileY, Bcard[] bCards)
    {
      // broadcast on bCards
      // save bCards in game / pile;
      // await SRconsole($"PileBroadcast {pileI} cards {bCards.Length}" );
      var game = Gls.games.Find(x => x.Name == groupName);
      if (game != null)
      {
        var pile = game.Piles[pileI];
        pile.x = pileX;
        pile.y = pileY;
        pile.bCards = bCards;
        await Clients.OthersInGroup(groupName).SendAsync("PileBroadcastIn", pileI, pileX, pileY, bCards);
      }
      else {
        SRconsole($"*** GROUP {groupName} NOT FOUND in PileBroadcast go debug");
      }
    }
    // reasons for LandingDenied
    // 99: system error
    // 1: ace not on table
    // 2: ace too close to other pile
    // 3: card not in sequence - wrong rank
    // 4: colour wrong (3 players)
    // 5: suit wrong (4 players)1
    public async Task PermitLanding(string groupName, int targetPileI, Bcard[] bCards, int sourcePileI)
    {
      // can we land the card on pile targetPileI (which is common area pile)
      // if targetPileI == -1 then we have an ace in bCards, otherwise one other card
      // card is in sourcePileI, which has same cards as bCards and is player's drag pile
      SRconsole($"PermitLanding {targetPileI} cards {bCards.Length}");
      var game = Gls.games.Find(x => x.Name == groupName);
      if (game == null || bCards.Length != 1) {
        if (game == null)
        {
          SRconsole("*** group/game ERROR in PermitLanding go debug");
        } else
        {
          SRconsole("*** cards ERROR in PermitLanding go debug");
        }
        await Clients.Caller.SendAsync("LandingDenied", -2, 99);
        return;
      }
      var bCard = bCards[0];
      var sourcePile = game.Piles[sourcePileI];
      if (targetPileI == -1)
      {
        // check ace is 1) sufficiently in common area and 2) distant enough from other common piles
        var centreX = bCard.x + Gls.SVGwidthHalf;
        var centreY = bCard.y + Gls.SVGheightHalf;
        if (centreX < -game.LandingX || centreX > game.LandingX ||
            centreY < -game.LandingY || centreY > game.LandingY)
        {
          // not sufficiently on table
          await Clients.Caller.SendAsync("LandingDenied", -1, 1);
          return;
        }
        int comPileI;
        for (comPileI = Gls.commonPile0; comPileI < Gls.dragPile0; comPileI++)
        {
          var pile = game.Piles[comPileI];
          // await Clients.Caller.SendAsync("Console", $"Pile {comPileI}, len {pile.bCards.Length}");
          if (pile.bCards.Length == 0)
          {
            comPileI++;
            break;
          }
          var separationSqd = (bCard.x - pile.x) * (bCard.x - pile.x) + (bCard.y - pile.y) * (bCard.y - pile.y);
          if (separationSqd < Gls.commonPileRadius2Sqd)
          {
            // not sufficiently distant enough
            await Clients.Caller.SendAsync("LandingDenied", comPileI, 2);
            return;
          }
        }
        // good landing place for ace in comPileI - 1, which must be first empty common pile
        if (comPileI >= Gls.dragPile0)
          {
            // oops run out of common piles - disaster!
            SRconsole($"*** common pile = {comPileI} ERROR in PermitLanding go debug");
            await Clients.Caller.SendAsync("LandingDenied", -3, 99);
            return;
          }
        comPileI--;
        var comPile = game.Piles[comPileI];
        Random random = new();
        bCard.angle = random.Next(0, 179); ;
        comPile.bCards = bCards;
        comPile.x = bCard.x;
        comPile.y = bCard.y;
        SRconsole($"PermitLanding pile {comPileI} now has {comPile.bCards.Length} cards");
        sourcePile.bCards = Array.Empty<Bcard>();
        await Clients.Group(groupName).SendAsync("PileBroadcastIn", comPileI, comPile.x, comPile.y, comPile.bCards);
        await Clients.Group(groupName).SendAsync("PileBroadcastIn", sourcePileI, sourcePile.x, sourcePile.y, sourcePile.bCards);
        await Clients.Caller.SendAsync("LandingAccepted", comPileI);
        return;
      }
      // targetPileI >= 0 and incoming card not ace. Will card go on pile?
      var targetPile = game.Piles[targetPileI];
      var topCard = targetPile.bCards[^1];      // indexing from end :-)
      int players = game.Players();
      // SendAsync("Console" messages are effort to diagnose 19/6/23 error where 2 would not go on ace
      if (topCard.Rank() + 1 != bCard.Rank())
      {
        await Clients.Caller.SendAsync("LandingDenied", targetPileI, 3);
        await Clients.Caller.SendAsync("Console", $"rank wrong, cards on pile {targetPile.bCards.Length} top card {topCard.Rank()}");
        return;
      }
      switch (players)
      {
        case 1:
        case 2:
          // any card on any card. OK
          break;
        case 3:
          // colour on colour
          if (topCard.IsBlack() != bCard.IsBlack())
          {
            await Clients.Caller.SendAsync("LandingDenied", targetPileI, 4);
            await Clients.Caller.SendAsync("Console", $"colour wrong, cards on pile {targetPile.bCards.Length} top card {topCard.Rank()} is black {topCard.IsBlack()}");
            return;
          }
          break;
        case 4:
          if (topCard.Suit() != bCard.Suit())
          {
            await Clients.Caller.SendAsync("LandingDenied", targetPileI, 5);
            await Clients.Caller.SendAsync("Console", $"suit wrong, cards on pile {targetPile.bCards.Length} top card {topCard.Rank()} suit {topCard.Suit()}");
            return;
          }
          break;
        default:
          await Clients.Caller.SendAsync("Console", $"*** players = {players} ERROR in PermitLanding go debug");
          await Clients.Caller.SendAsync("LandingDenied", targetPileI, 99);
          return;
      }
      // In business, move card to top of targetPile
      Random random2 = new();
      bCard.angle = random2.Next(0, 179);
      bCard.x = topCard.x;
      bCard.y = topCard.y;
      targetPile.AddCard(bCard);
      SRconsole($"PermitLanding pile {targetPileI} now has {targetPile.bCards.Length} cards");
      sourcePile.bCards = Array.Empty<Bcard>();
      await Clients.Group(groupName).SendAsync("PileBroadcastIn", targetPileI, targetPile.x, targetPile.y, targetPile.bCards);
      await Clients.Group(groupName).SendAsync("PileBroadcastIn", sourcePileI, sourcePile.x, sourcePile.y, sourcePile.bCards);
      await Clients.Caller.SendAsync("LandingAccepted", targetPileI);
    }
    public void ClearCommonPiles(string groupName)
    {
      // and drag piles.
      var game = Gls.games.Find(x => x.Name == groupName);
      if (game == null)
      {
        SRconsole($"*** ERROR in ClearCommonPiles go debug");
        return;
      }
      for (var pileI = Gls.commonPile0; pileI < Gls.totalPiles; pileI++)
      {
        var pile = game.Piles[pileI];
        if (pile == null) continue;   // that will never happen!
        pile.x = null;
        pile.y = null;
        pile.bCards = Array.Empty<Bcard>();
      }
    }

    public async Task StartGame(string groupName)
    {
      var game = Gls.games.Find(x => x.Name == groupName);
      if (game == null)
      {
        SRconsole($"*** ERROR in ClearCommonPiles go debug");
        return;
      }
      game.Playing = true;
      await SendGroups(true);
      await Clients.Group(groupName).SendAsync("StartGame2");
    }
    public async Task PlayerIsOut(string groupName, string playerName)
    {
      await Clients.Group(groupName).SendAsync("ActionsAfterOut", playerName);
    }
    public async Task ReadyToDance(string groupName)
    {
      await Clients.Group(groupName).SendAsync("ReadyToDance");
    }
    public async Task ReadyToSort(string groupName, int lcpPileI, double lcpX, double lcpY)
    {
      await Clients.Group(groupName).SendAsync("ReadyToSort", lcpPileI, lcpX, lcpY);
    }
    public async Task AddPoint(string groupName, int playerI)
    {
      await Clients.Group(groupName).SendAsync("AddPoint", playerI);
    }
    public async Task ReadyToScore(string groupName)
    {
      await Clients.Group(groupName).SendAsync("ReadyToScore");
    }
    public async Task GetLogs()
    {
      string theLogs = "";
      for (int i = 0; i < Gls.logs.Count; i++)
      {
        theLogs += Gls.logs[i].dateTime + " " + Gls.logs[i].message + "<br/>";
      }
      await Clients.Caller.SendAsync("TheLogs", theLogs);
    }
    // ******************************
    // diagnostic functions
    // ******************************
    public async Task Checkpile35(string id)
    {
      // 15.6.23 On server, pile 35 suddenly gets 31, 33 or 34 cards in it. Where?
      var testPile = 35;
      var game = Gls.games[0];      // we know there's only 1 gaame
      var pile = game.Piles[testPile];
      if (pile.bCards.Length > 13)
      {
        await Clients.Caller.SendAsync("Console", $"Pile 35 has length {pile.bCards.Length} at {id}");
        var message = "cards ";
        foreach (var card in pile.bCards)
        {
          message += $"{card.cards52I},";
        }
        await Clients.Caller.SendAsync("Console", message);
        // code to list other piles which had problem. They were all empty
        //while (testPile < pile.bCards.Length)
        //{
        //  pile = game.piles[testPile];
        //  if (pile.bCards.Length > 0)
        //  {
        //    message += $"p:{testPile} l:{pile.bCards.Length}, ";
        //  }
        //  testPile++;
        //}
        //if (message.Length > 0)
        //{
        //  await Clients.Caller.SendAsync("Console", message);
        //}
        //else
        //{
        //  await Clients.Caller.SendAsync("Console", "other piles empty");
        //}

      }
    }

    public void SRconsole(string message)
    {
      System.Diagnostics.Debug.WriteLine(">>>" + message);    // does nothing on server
      // append to LogFile.txt in same directory as wwwroot.
      // Fails badly on server. Program does not work! Probably because of files access violation
      //using StreamWriter outputFile = new StreamWriter("LogFile.txt", true);
      //await outputFile.WriteAsync(System.Environment.NewLine + message);
    }


    // *************************************
    // Ping functions used in testing
    // ********************************
    public async Task Ping(string message)
    {
      var cID = Context.ConnectionId;
      SRconsole("ping " + message);
      await Clients.Caller.SendAsync("pingBack", cID);           // that works
      // await Clients.Client(cID).SendAsync("pingBack", cID);   // that also works
    }
    public async Task PingData(int anInteger,  object xx)
    {
      var cID = Context.ConnectionId;
      // await SRconsole("ping " + message);
      await Clients.Caller.SendAsync("pingDataBack", anInteger, xx);     // that works
    }
    public async Task PingArray(string gName, string[] myArray)
    {
      string[] sendArray = new string[myArray.Length];
      int i = 0;
      foreach (string s in myArray)
      {
        sendArray[i++] = s; 
      }
      await Clients.Group(gName).SendAsync("pingArrayBack", sendArray);
    }
    public async Task PingPile(Bcard[] bCards)
    {
      // SignalR does all the work of serializing / deserializing (using json).
      // classes on server / clients need not have same members and
      // it copes very well with converting int<->muber, double <-> number
      foreach (var card in bCards)
      {
        if (card != null)
        {
          System.Diagnostics.Debug.Write($"cards52I: {card.cards52I}; ");
          System.Diagnostics.Debug.Write($"playerI: {card.playerI}; ");
          System.Diagnostics.Debug.Write($"x: {card.x}; ");
          System.Diagnostics.Debug.Write($"y: {card.y}; ");
          System.Diagnostics.Debug.Write($"faceUp: {card.faceUp}; ");
          System.Diagnostics.Debug.WriteLine($"angle: {card.angle}");
        }
      }
      await Clients.Caller.SendAsync("pingPileBack", bCards);
    }

  }
}