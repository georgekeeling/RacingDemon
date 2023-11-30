// (c) George Arthur Keeling, Berlin 2023

using SignalRChat.Hubs;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSignalR();

var app = builder.Build();

//app.MapGet("/", () => "Hello World!");
app.UseStaticFiles();

app.MapFallbackToFile("index.html");

app.MapHub<ChatHub>("/chatHub");

app.Run();
