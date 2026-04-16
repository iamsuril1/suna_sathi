/**
 * RadioScheduler
 *
 * Treats the playlist as a continuous infinite radio broadcast
 * that started at a fixed wall-clock time.
 *
 * STREAM_START = 10 Apr 2026, 11:00:00 AM NPT (UTC+5:45)
 *             = 10 Apr 2026, 05:15:00 AM UTC
 *
 * At any moment we can calculate:
 *   elapsed  = now - STREAM_START          (seconds since broadcast began)
 *   position = elapsed % totalPlaylistDuration
 *
 * From `position` we find which song is playing and at what offset.
 */

const Song = require("../models/Song");

// 10 Apr 2026 11:00:00 AM NPT = 10 Apr 2026 05:15:00 UTC
const STREAM_START_UTC = new Date("2026-04-10T05:15:00.000Z");

class RadioScheduler {
  constructor() {
    this._songs         = [];   // ordered Song documents
    this._durations     = [];   // duration in seconds per song (from DB or fallback)
    this._totalDuration = 0;    // sum of all song durations
    this._loaded        = false;
    this._loadPromise   = null;
  }

  // ── Load songs + durations ─────────────────────────────
  async load() {
    if (this._loadPromise) return this._loadPromise;
    this._loadPromise = this._doLoad();
    return this._loadPromise;
  }

  async _doLoad() {
    // Fetch all non-live-only songs in creation order
    const songs = await Song.find({ isLiveOnly: { $ne: true } })
      .sort({ createdAt: 1 })
      .lean();

    if (!songs.length) {
      this._songs         = [];
      this._durations     = [];
      this._totalDuration = 0;
      this._loaded        = true;
      return;
    }

    // Use stored duration if available, fallback to 3 minutes
    const DEFAULT_DURATION = 180; // 3 min fallback

    this._songs     = songs;
    this._durations = songs.map((s) => s.duration || DEFAULT_DURATION);
    this._totalDuration = this._durations.reduce((a, b) => a + b, 0);
    this._loaded    = true;

    console.log(
      `RadioScheduler loaded ${songs.length} songs, ` +
      `total duration ${(this._totalDuration / 60).toFixed(1)} min`
    );
  }

  // Force reload (e.g. after new song uploaded)
  async reload() {
    this._loaded      = false;
    this._loadPromise = null;
    await this.load();
  }

  // ── Core calculation ───────────────────────────────────

  /**
   * Returns what should be playing RIGHT NOW.
   * @returns {{
   *   song: Object,
   *   songIndex: number,
   *   positionInSong: number,   // seconds into current song
   *   totalElapsed: number,     // seconds since broadcast start
   * } | null}
   */
  getCurrentState() {
    if (!this._loaded || !this._songs.length || this._totalDuration === 0) {
      return null;
    }

    const nowMs      = Date.now();
    const startMs    = STREAM_START_UTC.getTime();
    const elapsedSec = Math.max(0, (nowMs - startMs) / 1000);

    // Wrap elapsed into the playlist loop
    const loopPosition = elapsedSec % this._totalDuration;

    // Walk through songs to find which one is playing
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

    // Edge case: floating point landed exactly on boundary → first song
    return {
      song:           this._songs[0],
      songIndex:      0,
      positionInSong: 0,
      totalElapsed:   elapsedSec,
    };
  }

  /**
   * How many seconds until the current song ends?
   */
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

// Single instance shared across app
const radioScheduler = new RadioScheduler();
module.exports = radioScheduler;