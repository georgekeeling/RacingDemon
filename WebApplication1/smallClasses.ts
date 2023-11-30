"use strict";
// (c) George Arthur Keeling, Berlin 2023

/*
 * File for small, independent classes
 */
class Sound {
  // trumpets from https://pixabay.com/sound-effects/search/trumpet/
  trumpet = document.getElementById("audioTr1") as HTMLAudioElement;
  smallTrumpet = document.getElementById("audioTr2") as HTMLAudioElement;
  ready = document.getElementById("audioReady") as HTMLAudioElement;
  steady = document.getElementById("audioSteady") as HTMLAudioElement;
  go = document.getElementById("audioGo") as HTMLAudioElement;
  tick1 = document.getElementById("audioTick1") as HTMLAudioElement;
  ding = document.getElementById("audioDing") as HTMLAudioElement;
  dingBot = document.getElementById("audioDing") as HTMLAudioElement;
  // must have different objects for different volumes of dings. 
  // See bug 11/11/23 bot bell sound increases after “Press Start ?” bell sounds.
  volume = 0.05;
  constructor() {
    if (table.siteWindow.realMobile()) {
      this.volume = 1;
    }
  }

  soundTrumpet() {
    this.trumpet.volume = this.volume;
    this.trumpet.play();
  }
  soundSmallTrumpet() {
    this.smallTrumpet.volume = this.volume;
    this.smallTrumpet.play();
  }
  soundFail() {
    let i = Math.floor(Math.random() * 4);
    let fail = document.getElementById("audiofl" + i) as HTMLAudioElement;
    fail.volume = this.volume / 2;
    fail.play();
  }
  sayReady() {
    this.ready.volume = this.volume;
    this.ready.play();
  }
  saySteady() {
    this.steady.volume = this.volume;
    this.steady.play();
  }
  sayGo() {
    this.go.volume = this.volume;
    this.go.play();
  }
  soundTick() {
    this.tick1.autoplay = true;
    this.tick1.loop = true;
    this.tick1.volume = 0.01;
    this.tick1.play();
  }
  soundDing() {
    let volume = this.volume * 10;
    if (volume > 1) {
      volume = 1;
    }
    this.ding.volume = volume;
    this.ding.play();
    if (bot.speed > 0) {
      // gets back to correct volume
      this.playDingBot();
      // See bug 11/11/23 bot bell sound increases after “Press Start ?” bell sounds.
    }
  }
  playDingBot() {
    this.dingBot.autoplay = true;
    this.dingBot.loop = true;
    this.dingBot.volume = 0.02;   // 0.01 is too low. Bot gets throttled
    this.dingBot.play();
  }

  pauseDingBot() {
    this.dingBot.pause();
  }
}
