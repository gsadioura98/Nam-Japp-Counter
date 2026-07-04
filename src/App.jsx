import { useState, useEffect, useCallback, useRef } from "react";

const MALA_SIZE = 108;
const STORAGE_KEY = "nam-japp-progress";

const SKY_THEMES = {
  night: {
    background: "linear-gradient(160deg, #12103A 0%, #1E1B50 50%, #0E0C2E 100%)",
    textColor: "#F0EAD6",
    accent: "#C9922A",
    starOpacity: 1,
    orbColor: null,
  },
  morning: {
    background: "linear-gradient(160deg, #7FA8C9 0%, #A9C6DE 45%, #F3D9B8 100%)",
    textColor: "#2E2A1F",
    accent: "#B9791F",
    starOpacity: 0,
    orbColor: "rgba(255,245,220,0.9)",
  },
  afternoon: {
    background: "linear-gradient(160deg, #3E7EBF 0%, #6FA8D8 45%, #CFE6F5 100%)",
    textColor: "#20263A",
    accent: "#A9711A",
    starOpacity: 0,
    orbColor: "rgba(255,250,235,0.95)",
  },
  golden: {
    background: "linear-gradient(160deg, #4A2A5C 0%, #B65A3A 55%, #F0A94E 100%)",
    textColor: "#FFF3E0",
    accent: "#FFD27A",
    starOpacity: 0.15,
    orbColor: "rgba(255,210,120,0.95)",
  },
};

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "golden";
  return "night";
}

function RippleEffect({ ripples, color = "#C9922A" }) {
  return (
    <>
      {ripples.map((r) => (
        <span
          key={r.id}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: `2px solid ${color}`,
            opacity: 0,
            animation: "ripple 0.9s ease-out forwards",
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}

export default function App() {
  const [count, setCount] = useState(0);
  const [malas, setMalas] = useState(0);
  const [ripples, setRipples] = useState([]);
  const [pulse, setPulse] = useState(false);
  const [milestone, setMilestone] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());
  const rippleId = useRef(0);
  const milestoneTimer = useRef(null);
  const audioCtx = useRef(null);
  const voiceAudio = useRef(null);

  // Check time of day on mount, then re-check every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const theme = SKY_THEMES[timeOfDay];

  // Preload the voice clip once
  useEffect(() => {
    voiceAudio.current = new Audio("/waheguru.mp3");
    voiceAudio.current.preload = "auto";
  }, []);

  // Load saved progress on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setCount(data.count || 0);
        setMalas(data.malas || 0);
        setSoundOn(data.soundOn !== undefined ? data.soundOn : true);
        setVoiceOn(data.voiceOn !== undefined ? data.voiceOn : true);
      }
    } catch (e) {
      // no saved data yet, start fresh
    }
    setLoaded(true);
  }, []);

  // Save progress whenever it changes
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ count, malas, soundOn, voiceOn })
      );
    } catch (e) {
      // storage unavailable, fail silently
    }
  }, [count, malas, soundOn, voiceOn, loaded]);

  function playBell() {
    if (!soundOn) return;
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(528, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      // audio unsupported, fail silently
    }
  }

  function playVoice() {
    if (!voiceOn || !voiceAudio.current) return;
    try {
      voiceAudio.current.currentTime = 0;
      voiceAudio.current.play().catch(() => {});
    } catch (e) {
      // playback failed, fail silently
    }
  }

  const handleJapp = useCallback(() => {
    setCount((prev) => {
      const next = prev + 1;
      const beadPos = next % MALA_SIZE;

      if (beadPos === 0) {
        setMalas((m) => m + 1);
        triggerMilestone("🙏 ਇੱਕ ਮਾਲਾ ਪੂਰੀ — Mala Complete!");
      } else if (next === 1008) {
        triggerMilestone("✨ 1008 — Blessed!");
      } else if (next === 108) {
        triggerMilestone("🌟 108 — First Mala!");
      }

      return next;
    });

    setPulse(true);
    setTimeout(() => setPulse(false), 200);
    playBell();
    playVoice();

    const id = ++rippleId.current;
    setRipples((r) => [...r, { id }]);
    setTimeout(() => {
      setRipples((r) => r.filter((x) => x.id !== id));
    }, 900);
  }, [soundOn, voiceOn]);

  function triggerMilestone(msg) {
    setMilestone(msg);
    clearTimeout(milestoneTimer.current);
    milestoneTimer.current = setTimeout(() => setMilestone(null), 3000);
  }

  function handleReset() {
    setCount(0);
    setMalas(0);
    setMilestone(null);
  }

  const beadsInMala = count % MALA_SIZE;
  const progress = (beadsInMala / MALA_SIZE) * 100;

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        handleJapp();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleJapp]);

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.background,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Georgia', serif",
      color: theme.textColor,
      padding: "24px",
      position: "relative",
      overflow: "hidden",
      userSelect: "none",
      transition: "background 1.2s ease",
    }}>

      {/* Sun/moon orb for day themes */}
      {theme.orbColor && (
        <div style={{
          position: "absolute",
          top: "8%",
          right: "12%",
          width: "90px",
          height: "90px",
          borderRadius: "50%",
          background: theme.orbColor,
          boxShadow: `0 0 60px 20px ${theme.orbColor}`,
          opacity: 0.9,
          transition: "opacity 1.2s ease",
        }} />
      )}

      {/* Ambient stars (night + faint golden hour) */}
      {theme.starOpacity > 0 && [...Array(20)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: i % 3 === 0 ? "2px" : "1px",
          height: i % 3 === 0 ? "2px" : "1px",
          borderRadius: "50%",
          background: theme.accent,
          opacity: (0.2 + (i % 5) * 0.1) * theme.starOpacity,
          top: `${(i * 37 + 11) % 95}%`,
          left: `${(i * 53 + 7) % 95}%`,
          animation: `twinkle ${2 + (i % 3)}s ease-in-out infinite alternate`,
          animationDelay: `${(i * 0.4) % 2}s`,
        }} />
      ))}

      <style>{`
        @keyframes ripple {
          0% { transform: scale(0.85); opacity: 0.7; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes twinkle {
          from { opacity: 0.1; }
          to { opacity: 0.5; }
        }
        @keyframes pulse-count {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        @keyframes milestone-in {
          0% { opacity: 0; transform: translateY(-10px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
        .japp-btn:active {
          transform: scale(0.95) !important;
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{
          fontSize: "13px",
          letterSpacing: "4px",
          color: theme.accent,
          textTransform: "uppercase",
          marginBottom: "8px",
          fontFamily: "sans-serif",
          transition: "color 1.2s ease",
        }}>Nam Japp</div>
        <div style={{
          fontSize: "28px",
          letterSpacing: "2px",
          color: theme.textColor,
          fontWeight: "300",
          opacity: 0.9,
          transition: "color 1.2s ease",
        }}>ਵਾਹਿਗੁਰੂ</div>
      </div>

      {/* Milestone toast */}
      {milestone && (
        <div style={{
          position: "absolute",
          top: "60px",
          background: `${theme.accent}30`,
          border: `1px solid ${theme.accent}`,
          color: theme.textColor,
          padding: "10px 24px",
          borderRadius: "40px",
          fontSize: "14px",
          animation: "milestone-in 3s ease forwards",
          fontFamily: "sans-serif",
          backdropFilter: "blur(6px)",
        }}>
          {milestone}
        </div>
      )}

      {/* Count display */}
      <div style={{
        fontSize: "clamp(72px, 18vw, 120px)",
        fontWeight: "200",
        color: theme.textColor,
        lineHeight: 1,
        marginBottom: "8px",
        animation: pulse ? "pulse-count 0.2s ease" : "none",
        letterSpacing: "-2px",
        textShadow: pulse ? `0 0 40px ${theme.accent}80` : "none",
        transition: "text-shadow 0.3s ease, color 1.2s ease",
        minWidth: "200px",
        textAlign: "center",
      }}>
        {count.toLocaleString("en-IN")}
      </div>

      {/* Malas count */}
      <div style={{
        fontSize: "13px",
        color: theme.accent,
        letterSpacing: "2px",
        fontFamily: "sans-serif",
        marginBottom: "32px",
        opacity: 0.85,
        transition: "color 1.2s ease",
      }}>
        {malas > 0 ? `${malas} Mala${malas > 1 ? "s" : ""} · ` : ""}{beadsInMala}/108
      </div>

      {/* Mala progress arc */}
      <div style={{ marginBottom: "40px", position: "relative", width: "80px", height: "80px" }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke={`${theme.accent}26`} strokeWidth="3" />
          <circle
            cx="40" cy="40" r="34"
            fill="none"
            stroke={theme.accent}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
            transform="rotate(-90 40 40)"
            style={{ transition: "stroke-dashoffset 0.3s ease, stroke 1.2s ease" }}
          />
        </svg>
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          color: theme.accent,
          fontFamily: "sans-serif",
          letterSpacing: "0.5px",
          transition: "color 1.2s ease",
        }}>
          {Math.round(progress)}%
        </div>
      </div>

      {/* Main tap button */}
      <div
        className="japp-btn"
        onClick={handleJapp}
        style={{
          position: "relative",
          width: "clamp(150px, 40vw, 200px)",
          height: "clamp(150px, 40vw, 200px)",
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 35%, ${theme.textColor}22, transparent 60%), ${theme.background}`,
          border: `2px solid ${theme.accent}80`,
          boxShadow: pulse
            ? `0 0 60px ${theme.accent}66, 0 0 20px ${theme.accent}33, inset 0 1px 0 ${theme.accent}4d`
            : `0 0 30px ${theme.accent}1a, inset 0 1px 0 ${theme.accent}26`,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          transition: "box-shadow 0.3s ease, transform 0.1s ease, background 1.2s ease, border-color 1.2s ease",
          WebkitTapHighlightColor: "transparent",
          marginBottom: "40px",
        }}
      >
        <RippleEffect ripples={ripples} color={theme.accent} />
        <div style={{ fontSize: "32px", marginBottom: "4px" }}>🙏</div>
        <div style={{
          fontSize: "11px",
          letterSpacing: "3px",
          color: theme.accent,
          fontFamily: "sans-serif",
          textTransform: "uppercase",
          transition: "color 1.2s ease",
        }}>Japp</div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={() => setSoundOn((s) => !s)}
          style={{
            background: "transparent",
            border: `1px solid ${theme.textColor}33`,
            color: `${theme.textColor}66`,
            padding: "8px 18px",
            borderRadius: "20px",
            cursor: "pointer",
            fontSize: "12px",
            letterSpacing: "1.5px",
            fontFamily: "sans-serif",
            textTransform: "uppercase",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = theme.accent;
            e.target.style.color = theme.accent;
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = `${theme.textColor}33`;
            e.target.style.color = `${theme.textColor}66`;
          }}
        >
          {soundOn ? "🔔 Bell On" : "🔕 Bell Off"}
        </button>

        <button
          onClick={() => setVoiceOn((v) => !v)}
          style={{
            background: "transparent",
            border: `1px solid ${theme.textColor}33`,
            color: `${theme.textColor}66`,
            padding: "8px 18px",
            borderRadius: "20px",
            cursor: "pointer",
            fontSize: "12px",
            letterSpacing: "1.5px",
            fontFamily: "sans-serif",
            textTransform: "uppercase",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = theme.accent;
            e.target.style.color = theme.accent;
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = `${theme.textColor}33`;
            e.target.style.color = `${theme.textColor}66`;
          }}
        >
          {voiceOn ? "🗣️ Voice On" : "🔇 Voice Off"}
        </button>

        <button
          onClick={handleReset}
          style={{
            background: "transparent",
            border: `1px solid ${theme.textColor}33`,
            color: `${theme.textColor}66`,
            padding: "8px 22px",
            borderRadius: "20px",
            cursor: "pointer",
            fontSize: "12px",
            letterSpacing: "1.5px",
            fontFamily: "sans-serif",
            textTransform: "uppercase",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = theme.accent;
            e.target.style.color = theme.accent;
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = `${theme.textColor}33`;
            e.target.style.color = `${theme.textColor}66`;
          }}
        >
          Reset
        </button>
      </div>

      {/* Hint */}
      <div style={{
        position: "absolute",
        bottom: "20px",
        fontSize: "11px",
        color: `${theme.textColor}33`,
        fontFamily: "sans-serif",
        letterSpacing: "1px",
      }}>
        Tap button · Space · Enter
      </div>
    </div>
  );
}
