const Song = require("../models/Song");

const STREAM_START_UTC  = new Date("2026-04-10T05:15:00.000Z");
const DEFAULT_DURATION  = 180; // 3 minutes fallback if ffprobe not available

class RadioScheduler {
  constructor() {
    this._songs         = [];
    this._durations     = [];
    this._totalDuration = 0;
    this._loaded        = false;
    this._loadPromise   = null;
  }

  async load() {
    if (this._loadPromise) return this._loadPromise;
    this._loadPromise = this._doLoad();
    return this._loadPromise;
  }

  async _doLoad() {
    try {
      const songs = await Song.find({ isLiveOnly: { $ne: true } })
        .sort({ createdAt: 1 })
        .lean();

      if (!songs.length) {
        this._songs         = [];
        this._durations     = [];
        this._totalDuration = 0;
        this._loaded        = true;
        console.warn("⚠️  RadioScheduler: no songs found");
        return;
      }

      this._songs     = songs;
      this._durations = songs.map((s) => {
        const d = Number(s.duration);
        return (d && d > 0) ? d : DEFAULT_DURATION;
      });
      this._totalDuration = this._durations.reduce((a, b) => a + b, 0);
      this._loaded    = true;

      console.log(
        `✅ RadioScheduler: ${songs.length} songs, ` +
        `total ${(this._totalDuration / 60).toFixed(1)} min`
      );
    } catch (err) {
      console.error("RadioScheduler load error:", err);
      this._loadPromise = null; // allow retry
      throw err;
    }
  }

  async reload() {
    this._loaded      = false;
    this._loadPromise = null;
    await this.load();
  }

  getCurrentState() {
    if (!this._loaded || !this._songs.length || this._totalDuration === 0) {
      return null;
    }

    const nowMs      = Date.now();
    const startMs    = STREAM_START_UTC.getTime();
    const elapsedSec = Math.max(0, (nowMs - startMs) / 1000);

    // Wrap into playlist loop
    const loopPosition = elapsedSec % this._totalDuration;

    let accumulated = 0;
    for (let i = 0; i < this._songs.length; i++) {
      const songDur = this._durations[i];
      if (loopPosition < accumulated + songDur) {
        return {
          song:           this._songs[i],
          songIndex:      i,
          positionInSong: loopPosition - accumulated,
          totalElapsed:   elapsedSec,
        };
      }
      accumulated += songDur;
    }

    // Floating point edge case
    return {
      song:           this._songs[0],
      songIndex:      0,
      positionInSong: 0,
      totalElapsed:   elapsedSec,
    };
  }

  secondsUntilNextSong() {
    const state = this.getCurrentState();
    if (!state) return null;
    const dur = this._durations[state.songIndex];
    return Math.max(0, dur - state.positionInSong);
  }

  get songs()         { return this._songs; }
  get durations()     { return this._durations; }
  get totalDuration() { return this._totalDuration; }
  get loaded()        { return this._loaded; }
  get streamStart()   { return STREAM_START_UTC; }
}

const radioScheduler = new RadioScheduler();
module.exports = radioScheduler;