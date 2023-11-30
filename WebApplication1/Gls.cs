// (c) George Arthur Keeling, Berlin 2023

namespace RacingDemon
{
// How to use Global Variables in C#?
// https://stackoverflow.com/questions/14368129/how-to-use-global-variables-in-c 

  public static class Gls     // Globals, but a shorter name
  {
    public const int homePiles = 7;
    public const int maxPlayers = 4;
    // (home piles + common piles + fly piles) * max players
    public const int totalPiles = (homePiles + 4 + 1) * maxPlayers;
    public const int commonPile0 = homePiles * maxPlayers;
    public const int dragPile0 = commonPile0 + 4 * maxPlayers;


    public const int SVGwidth = 360;   // 360 = width from SVG file.
    public const int SVGheight = 540;
    public const int SVGwidthHalf = SVGwidth / 2;
    public const int SVGheightHalf = SVGheight / 2;
    public const int commonPileRadius2 = 649;   // double radius of common pile = (sqrt(360² + 540²))
    public const int commonPileRadius2Sqd = commonPileRadius2 * commonPileRadius2;   // double radius squared
    public const double commonPileRadius =  324.5;    // radius of common pile = (sqrt(360² + 540²))/2

    public static List<User> users = new();
    public static List<Game> games= new();
  }

  public class User
  {
    public string Name { get; set; }
    public string ConnectionId { get; set; }
    public string InGame { get; set; }    // group name or blank
    public User(string  name, string connectionId, string inGame)
    {
      Name = name;
      ConnectionId = connectionId;
      InGame = inGame;
    }
  }
  public class Game
  {
    public string Name { get; set; }
    public bool Playing { get; set; }
    public bool OnMobile { get; set; }
    public double AspectRatio { get; set; }
    public double LandingX { get; set; }    // x,y of landing areas
    public double LandingY { get; set; }

    public Pile[] Piles {  get; set; } = new Pile[Gls.totalPiles];
    public Game (string name, bool onMobile, double aspectRatio, double X, double Y)
    {
      // X, Y being the half the width, height of the common area
      Name = name;
      Playing = false;
      Piles = new Pile[Gls.totalPiles];
      for (int i = 0; i < Piles.Length; i++)
      {
        Piles[i] = new Pile();
      }
      OnMobile = onMobile;
      AspectRatio = aspectRatio;      // always 1 on big screens, < 1 on mobiles
      LandingX = X - Gls.commonPileRadius;
      LandingY = Y - Gls.commonPileRadius;
    }
    public int Players()
    {
      int nPlayers = 0;
      foreach (var user in Gls.users)
      {
        if (user.InGame == Name)
        {
          nPlayers++;
        }
      }
      return nPlayers;
    }
  }
  public class Pile
  {
    public Bcard[] bCards { get; set; }
    public double? x { get; set; }
    public double? y { get; set; }
    public Pile()
    {
      bCards = Array.Empty<Bcard>();
    }
    public void AddCard(Bcard card)
    {
      Bcard[] bcards = new Bcard[bCards.Length + 1];
      var newCards = bcards;
      int cardI;
      for (cardI = 0; cardI < bCards.Length; cardI++)
      {
        newCards[cardI] = bCards[cardI];
        // will that work? Yes!
      }
      newCards[cardI] = card;
      bCards = newCards;
    }
  }
  public class Bcard
  {
    public int cards52I { get; set; }
    public int playerI { get; set; }
    public double x { get; set; }
    public double y { get; set; }
    public bool faceUp { get; set; }
    public double angle { get; set; }
    public Bcard(int cards52I, int playerI, double x, double y, bool faceUp, double angle)
    {
      this.cards52I = cards52I;
      this.playerI = playerI;
      this.x = x;
      this.y = y;
      this.faceUp = faceUp;
      this.angle = angle;
    }
    public int Rank() 
    {
      return (cards52I % 13 + 1);   // not zero base. Ace = 1, 2=2, king = 13
    }
    public int Suit() {
      return (cards52I / 13);
    }
    public bool IsBlack()
    {
      if (cards52I < 13 || cards52I >= 39) return true;
      return false;
    }
  }

}
