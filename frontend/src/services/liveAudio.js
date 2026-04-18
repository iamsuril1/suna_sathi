const AUDIOBASE = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/uploads`;

class LiveAudioManager {
  constructor() {
    this._live   = null;
    this._normal = null;

    this._liveListeners   = new Set();
    this._normalListeners = new Set();

    this._liveSong    = null;
    this._normalSong  = null;
    this._liveActive  = false;
    this._liveSrc     = null;
  }

  // ── Lazy element creation ──────────────────────────────
  _getLive() {
    if (!this._live) {
      this._live = new Audio();
      this._live.preload = "auto";
      this._live.setAttribute("playsinline", "");
      this._live.setAttribute("webkit-playsinline", "");

      this._live.addEventListener("timeupdate",     () => this._notifyLive());
      this._live.addEventListener("play",           () => { this._notifyLive("play"); });
      this._live.addEventListener("pause",          () => { this._notifyLive("pause"); });
      this._live.addEventListener("ended",          () => { this._notifyLive("ended"); });
      this._live.addEventListener("loadedmetadata", () => { this._notifyLive("meta"); });
    }
    return this._live;
  }

  _getNormal() {
    if (!this._normal) {
      this._normal = new Audio();
      this._normal.preload = "auto";

      this._normal.addEventListener("timeupdate",     () => this._notifyNormal());
      this._normal.addEventListener("play",           () => { this._notifyNormal("play"); });
      this._normal.addEventListener("pause",          () => { this._notifyNormal("pause"); });
      this._normal.addEventListener("ended",          () => { this._notifyNormal("ended"); });
      this._normal.addEventListener("loadedmetadata", () => { this._notifyNormal("meta"); });
    }
    return this._normal;
  }

  _notifyLive(e)   { this._liveListeners.forEach((fn)   => fn(e)); }
  _notifyNormal(e) { this._normalListeners.forEach((fn) => fn(e)); }

  // ── Subscribe ──────────────────────────────────────────
  subscribeLive(fn) {
    this._liveListeners.add(fn);
    return () => this._liveListeners.delete(fn);
  }

  subscribeNormal(fn) {
    this._normalListeners.add(fn);
    return () => this._normalListeners.delete(fn);
  }
  async loadLiveAndPlay(song, seekTo = 0) {
    if (!song?.file) return;

    // Pause normal audio — do NOT destroy it
    const normal = this._getNormal();
    if (!normal.paused) {
      normal.pause();
      this._notifyNormal("pause");
    }

    const live = this._getLive();
    const url  = `${AUDIOBASE}/${encodeURIComponent(song.file)}`;

    this._liveSong   = song;
    this._liveActive = true;

    // Only change src if song is different
    if (this._liveSrc !== url) {
      this._liveSrc  = url;
      live.src       = url;
      live.load();
    }

    // Seek immediately on metadata — no waiting for full buffer
    await new Promise((resolve) => {
      if (live.readyState >= 1) {
        if (seekTo > 0 && Math.abs(live.currentTime - seekTo) > 0.5) {
          live.currentTime = seekTo;
        }
        resolve();
      } else {
        live.addEventListener("loadedmetadata", () => {
          if (seekTo > 0 && Math.abs(live.currentTime - seekTo) > 0.5) {
            live.currentTime = seekTo;
          }
          resolve();
        }, { once: true });
      }
    });

    try {
      await live.play();
      this._notifyLive("play");
    } catch (err) {
      console.warn("Live play blocked:", err.message);
      throw err;
    }
  }

  /**
   * Re-sync live position without reloading the file.
   * Only corrects if drift > 1.5 seconds to avoid stuttering.
   */
  syncLivePosition(seekTo) {
    const live = this._getLive();
    if (live.readyState >= 1 && Math.abs(live.currentTime - seekTo) > 1.5) {
      live.currentTime = seekTo;
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
    try {
      await this._getLive().play();
      this._notifyLive("play");
    } catch (err) {
      console.warn("Resume live failed:", err.message);
      throw err;
    }
  }


  stopLive() {
    if (this._live) {
      this._live.pause();
      this._live.src = "";
      this._live.load();
    }
    this._liveSrc    = null;
    this._liveSong   = null;
    this._liveActive = false;
    this._notifyLive("stopped");
  }

  setLiveVolume(v) {
    this._getLive().volume = Math.max(0, Math.min(1, v));
  }

  get liveCurrentTime() { return this._live?.currentTime || 0; }
  get liveDuration()    { return this._live?.duration    || 0; }
  get liveIsPlaying()   { return this._live ? !this._live.paused : false; }
  get liveSong()        { return this._liveSong; }
  get liveActive()      { return this._liveActive; }
  get livePaused()      { return this._live ? this._live.paused : true; }

  // ── NORMAL controls ────────────────────────────────────

  /**
   * Load and play a regular dashboard song.
   * Pauses live audio locally — server stream keeps running.
   * IMPORTANT: This must NEVER be called from the Live page.
   */
  async loadNormalAndPlay(song, seekTo = 0) {
    if (!song?.file) return;

    // Pause live locally
    this.pauseLive();

    const normal = this._getNormal();
    const url    = `${AUDIOBASE}/${encodeURIComponent(song.file)}`;

    if (this._normalSong?._id !== song._id) {
      this._normalSong = song;
      normal.src       = url;
      normal.load();
    }

    const doPlay = async () => {
      if (seekTo > 0 && Math.abs(normal.currentTime - seekTo) > 1) {
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
    if (!n.paused) {
      n.pause();
      this._notifyNormal("pause");
    }
  }

  async resumeNormal() {
    try {
      await this._getNormal().play();
    } catch (err) {
      console.warn("Resume normal failed:", err.message);
      throw err;
    }
  }

  seekNormal(time) {
    const n = this._getNormal();
    if (n.readyState >= 1) n.currentTime = time;
  }

  /**
   * Fully stop and reset normal audio.
   * Called on logout or when user wants to stop playback.
   */
  stopNormal() {
    if (this._normal) {
      this._normal.pause();
      this._normal.src = "";
      this._normal.load();
    }
    this._normalSong = null;
    this._notifyNormal("stopped");
  }

  setNormalVolume(v) {
    this._getNormal().volume = Math.max(0, Math.min(1, v));
  }

  get normalCurrentTime() { return this._normal?.currentTime || 0; }
  get normalDuration()    { return this._normal?.duration    || 0; }
  get normalIsPlaying()   { return this._normal ? !this._normal.paused : false; }
  get normalSong()        { return this._normalSong; }
  get normalPaused()      { return this._normal ? this._normal.paused : true; }
}

export const liveAudio = new LiveAudioManager();