const AUDIOBASE = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/uploads`;

class LiveAudioManager {
  constructor() {
    this._live   = null;
    this._normal = null;
    this._liveListeners   = new Set();
    this._normalListeners = new Set();
    this._liveSong        = null;
    this._normalSong      = null;
    this._liveActive      = false;
    this._liveSrc         = null;   // track current src to avoid reload
  }

  _getLive() {
    if (!this._live) {
      this._live = new Audio();
      this._live.preload = "auto";
      this._live.setAttribute("playsinline", "");
      this._live.setAttribute("webkit-playsinline", "");
      this._live.addEventListener("timeupdate",     () => this._notifyLive());
      this._live.addEventListener("play",           () => this._notifyLive("play"));
      this._live.addEventListener("pause",          () => this._notifyLive("pause"));
      this._live.addEventListener("ended",          () => this._notifyLive("ended"));
      this._live.addEventListener("loadedmetadata", () => this._notifyLive("meta"));
      this._live.addEventListener("canplay",        () => this._notifyLive("canplay"));
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

  _notifyLive(e)   { this._liveListeners.forEach((fn)   => fn(e)); }
  _notifyNormal(e) { this._normalListeners.forEach((fn) => fn(e)); }

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

    // Pause normal
    const normal = this._getNormal();
    if (!normal.paused) { normal.pause(); this._notifyNormal("pause"); }

    const live = this._getLive();
    const url  = `${AUDIOBASE}/${encodeURIComponent(song.file)}`;

    this._liveSong   = song;
    this._liveActive = true;

    // Only reload src if song changed
    if (this._liveSrc !== url) {
      this._liveSrc  = url;
      live.src       = url;
      live.load();
    }

    // Seek immediately when we have enough metadata — no waiting for canplay
    await new Promise((resolve) => {
      if (live.readyState >= 1) {
        // Metadata already available — seek instantly
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

    // Play immediately after seeking — don't wait for buffering
    try {
      await live.play();
      this._notifyLive("play");
    } catch (err) {
      console.warn("Live play blocked:", err.message);
      throw err; // caller shows interaction banner
    }
  }

  syncLivePosition(seekTo) {
    const live = this._getLive();
    if (live.readyState >= 1 && Math.abs(live.currentTime - seekTo) > 1) {
      live.currentTime = seekTo;
    }
  }

  pauseLive() {
    const live = this._getLive();
    if (!live.paused) { live.pause(); this._notifyLive("pause"); }
  }

  async resumeLive() {
    await this._getLive().play();
    this._notifyLive("play");
  }

  stopLive() {
    const live   = this._getLive();
    live.pause();
    live.src     = "";
    this._liveSrc    = null;
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

  // ── NORMAL ────────────────────────────────────────────

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
    const n = this._getNormal();
    n.pause();
    n.src            = "";
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

export const liveAudio = new LiveAudioManager();