const AUDIOBASE = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/uploads`;

class LiveAudioManager {
  constructor() {
    this._live        = null;  // HTMLAudioElement for live stream
    this._normal      = null;  // HTMLAudioElement for regular songs
    this._liveListeners   = new Set();
    this._normalListeners = new Set();

    this._liveSong    = null;
    this._normalSong  = null;
    this._liveActive  = false; // whether live stream is loaded
  }

  // ── Lazy element creation ────────────────────────────
  _getLive() {
    if (!this._live) {
      this._live = new Audio();
      this._live.preload = "auto";
      this._live.addEventListener("timeupdate",      () => this._notifyLive());
      this._live.addEventListener("play",            () => this._notifyLive("play"));
      this._live.addEventListener("pause",           () => this._notifyLive("pause"));
      this._live.addEventListener("ended",           () => this._notifyLive("ended"));
      this._live.addEventListener("loadedmetadata",  () => this._notifyLive("meta"));
    }
    return this._live;
  }

  _getNormal() {
    if (!this._normal) {
      this._normal = new Audio();
      this._normal.preload = "auto";
      this._normal.addEventListener("timeupdate",     () => this._notifyNormal());
      this._normal.addEventListener("play",           () => this._notifyNormal("play"));
      this._normal.addEventListener("pause",          () => this._notifyNormal("pause"));
      this._normal.addEventListener("ended",          () => this._notifyNormal("ended"));
      this._normal.addEventListener("loadedmetadata", () => this._notifyNormal("meta"));
    }
    return this._normal;
  }

  _notifyLive(event)   { this._liveListeners.forEach((fn)   => fn(event)); }
  _notifyNormal(event) { this._normalListeners.forEach((fn) => fn(event)); }

  // ── Subscribe ────────────────────────────────────────
  subscribeLive(fn) {
    this._liveListeners.add(fn);
    return () => this._liveListeners.delete(fn);
  }

  subscribeNormal(fn) {
    this._normalListeners.add(fn);
    return () => this._normalListeners.delete(fn);
  }

  // ── LIVE controls ─────────────────────────────────────

  /**
   * Load live song and seek to current server position, then play.
   * Pauses normal audio first.
   */
  async loadLiveAndPlay(song, seekTo = 0) {
    if (!song?.file) return;

    // Pause normal audio without destroying it
    const normal = this._getNormal();
    if (!normal.paused) {
      normal.pause();
      this._notifyNormal("pause");
    }

    const live = this._getLive();
    const url  = `${AUDIOBASE}/${encodeURIComponent(song.file)}`;

    if (this._liveSong?._id !== song._id) {
      this._liveSong   = song;
      this._liveActive = true;
      live.src         = url;
      live.load();
    }

    const doPlay = async () => {
      try {
        if (Math.abs(live.currentTime - seekTo) > 1.5) {
          live.currentTime = seekTo;
        }
        await live.play();
      } catch (err) {
        console.warn("Live play failed:", err.message);
        throw err; // let caller show interaction prompt
      }
    };

    if (live.readyState >= 1) {
      await doPlay();
    } else {
      await new Promise((resolve, reject) => {
        live.addEventListener("loadedmetadata", async () => {
          try { await doPlay(); resolve(); } catch (e) { reject(e); }
        }, { once: true });
        live.addEventListener("error", reject, { once: true });
      });
    }
  }

  pauseLive() {
    const live = this._getLive();
    if (!live.paused) {
      live.pause();
      this._notifyLive("pause");
    }
  }

  async resumeLive() {
    await this._getLive().play();
  }

  seekLive(time) {
    const live = this._getLive();
    if (live.readyState >= 1 && Math.abs(live.currentTime - time) > 1.5) {
      live.currentTime = time;
    }
  }

  stopLive() {
    const live   = this._getLive();
    live.pause();
    live.src     = "";
    this._liveSong   = null;
    this._liveActive = false;
    this._notifyLive("stopped");
  }

  setLiveVolume(v) {
    this._getLive().volume = Math.max(0, Math.min(1, v));
  }

  get liveCurrentTime() { return this._getLive().currentTime; }
  get liveDuration()    { return this._getLive().duration || 0; }
  get liveIsPlaying()   { return !this._getLive().paused; }
  get liveSong()        { return this._liveSong; }
  get liveActive()      { return this._liveActive; }
  get livePaused()      { return this._getLive().paused; }

  // ── NORMAL controls ───────────────────────────────────

  /**
   * Play a regular song.
   * Pauses live audio locally (stream keeps going server-side).
   */
  async loadNormalAndPlay(song, seekTo = 0) {
    if (!song?.file) return;

    // Pause live locally — it will re-sync when user returns to Live page
    this.pauseLive();

    const normal = this._getNormal();
    const url    = `${AUDIOBASE}/${encodeURIComponent(song.file)}`;

    if (this._normalSong?._id !== song._id) {
      this._normalSong  = song;
      normal.src        = url;
      normal.load();
    }

    const doPlay = async () => {
      if (Math.abs(normal.currentTime - seekTo) > 1) {
        normal.currentTime = seekTo;
      }
      await normal.play();
    };

    if (normal.readyState >= 1) {
      await doPlay();
    } else {
      await new Promise((resolve, reject) => {
        normal.addEventListener("loadedmetadata", async () => {
          try { await doPlay(); resolve(); } catch (e) { reject(e); }
        }, { once: true });
        normal.addEventListener("error", reject, { once: true });
      });
    }
  }

  pauseNormal() {
    const n = this._getNormal();
    if (!n.paused) { n.pause(); this._notifyNormal("pause"); }
  }

  async resumeNormal() { await this._getNormal().play(); }

  seekNormal(time) {
    const n = this._getNormal();
    if (n.readyState >= 1) n.currentTime = time;
  }

  stopNormal() {
    const n  = this._getNormal();
    n.pause();
    n.src    = "";
    this._normalSong = null;
    this._notifyNormal("stopped");
  }

  setNormalVolume(v) {
    this._getNormal().volume = Math.max(0, Math.min(1, v));
  }

  get normalCurrentTime() { return this._getNormal().currentTime; }
  get normalDuration()    { return this._getNormal().duration || 0; }
  get normalIsPlaying()   { return !this._getNormal().paused; }
  get normalSong()        { return this._normalSong; }
  get normalPaused()      { return this._getNormal().paused; }
}

// Single shared instance across the entire app
export const liveAudio = new LiveAudioManager();