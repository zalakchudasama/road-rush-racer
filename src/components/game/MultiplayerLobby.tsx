import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { THEMES, ThemeId } from "./themes";
import { playClickSound } from "./sounds";
import type { RealtimeChannel } from "@supabase/supabase-js";

const MAX_PLAYERS = 6;
const COLORS = ["#ff4444", "#44dd44", "#4488ff", "#ffcc00", "#cc44ff", "#00ddcc"];

interface Player {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
}

interface ChatMsg { id: string; from: string; text: string; at: number }

interface Props {
  onStart: (info: { themeId: ThemeId; roomCode: string; me: Player; players: Player[]; channel: RealtimeChannel }) => void;
  onBack: () => void;
}

const genCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const MultiplayerLobby = ({ onStart, onBack }: Props) => {
  const [screen, setScreen] = useState<"menu" | "lobby">("menu");
  const [name, setName] = useState(() => localStorage.getItem("tr_mp_name") || "");
  const [codeInput, setCodeInput] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [themeId, setThemeId] = useState<ThemeId>("alien");
  const [players, setPlayers] = useState<Player[]>([]);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [error, setError] = useState("");

  const channelRef = useRef<RealtimeChannel | null>(null);
  const meRef = useRef<Player | null>(null);

  const me = meRef.current;

  useEffect(() => () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const joinRoom = async (code: string, host: boolean) => {
    if (!name.trim()) { setError("Enter your name"); return; }
    localStorage.setItem("tr_mp_name", name.trim());
    setError("");

    const myId = crypto.randomUUID();
    const myColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const meP: Player = { id: myId, name: name.trim(), color: myColor, isHost: host };
    meRef.current = meP;

    const channel = supabase.channel(`race:${code}`, {
      config: { presence: { key: myId } },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<Player & { themeId?: ThemeId }>();
      const list: Player[] = [];
      let currentTheme: ThemeId | null = null;
      Object.values(state).forEach((arr) => {
        arr.forEach((p: any) => {
          list.push({ id: p.id, name: p.name, color: p.color, isHost: p.isHost });
          if (p.isHost && p.themeId) currentTheme = p.themeId;
        });
      });
      list.sort((a, b) => (a.isHost ? -1 : b.isHost ? 1 : 0));
      setPlayers(list);
      if (currentTheme && !host) setThemeId(currentTheme);
    });

    channel.on("broadcast", { event: "chat" }, ({ payload }) => {
      setChat((c) => [...c.slice(-30), payload as ChatMsg]);
    });

    channel.on("broadcast", { event: "theme" }, ({ payload }) => {
      if (!host) setThemeId((payload as any).themeId);
    });

    channel.on("broadcast", { event: "start" }, ({ payload }) => {
      const info = payload as { themeId: ThemeId };
      const state = channel.presenceState<Player>();
      const list: Player[] = [];
      Object.values(state).forEach((arr) => arr.forEach((p: any) =>
        list.push({ id: p.id, name: p.name, color: p.color, isHost: p.isHost })));
      onStart({ themeId: info.themeId, roomCode: code, me: meP, players: list, channel });
    });

    await channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ ...meP, themeId: host ? themeId : undefined });
      }
    });

    channelRef.current = channel;
    setRoomCode(code);
    setIsHost(host);
    setScreen("lobby");
  };

  const handleCreate = () => {
    playClickSound();
    joinRoom(genCode(), true);
  };

  const handleJoin = () => {
    playClickSound();
    const c = codeInput.trim();
    if (!/^\d{6}$/.test(c)) { setError("Enter a 6-digit code"); return; }
    joinRoom(c, false);
  };

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || !channelRef.current || !meRef.current) return;
    const msg: ChatMsg = { id: crypto.randomUUID(), from: meRef.current.name, text, at: Date.now() };
    await channelRef.current.send({ type: "broadcast", event: "chat", payload: msg });
    setChat((c) => [...c.slice(-30), msg]);
    setChatInput("");
  };

  const updateTheme = async (id: ThemeId) => {
    setThemeId(id);
    if (!isHost || !channelRef.current || !meRef.current) return;
    await channelRef.current.track({ ...meRef.current, themeId: id });
    await channelRef.current.send({ type: "broadcast", event: "theme", payload: { themeId: id } });
  };

  const startRace = async () => {
    if (!channelRef.current || !isHost) return;
    playClickSound();
    await channelRef.current.send({ type: "broadcast", event: "start", payload: { themeId } });
    // Local host also transitions
    setTimeout(() => {
      const ch = channelRef.current!;
      const state = ch.presenceState<Player>();
      const list: Player[] = [];
      Object.values(state).forEach((arr) => arr.forEach((p: any) =>
        list.push({ id: p.id, name: p.name, color: p.color, isHost: p.isHost })));
      onStart({ themeId, roomCode, me: meRef.current!, players: list, channel: ch });
    }, 50);
  };

  const leave = () => {
    playClickSound();
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    onBack();
  };

  const themeList: ThemeId[] = useMemo(() => ["rain", "lava", "ice", "desert", "alien"], []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 overflow-y-auto"
    >
      <button
        onClick={leave}
        className="fixed top-4 left-4 z-50 w-10 h-10 rounded-full border-2 border-white/40 bg-black/60 text-white text-xl font-bold flex items-center justify-center"
      >
        ←
      </button>

      {screen === "menu" && (
        <div className="w-full max-w-sm px-4 flex flex-col gap-4">
          <h2
            className="text-2xl font-extrabold tracking-[0.25em] text-center"
            style={{
              background: "linear-gradient(135deg,#ff4444,#ff8800,#ffcc00)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            MULTIPLAYER
          </h2>

          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 14))}
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-xl bg-white/10 border-2 border-white/20 text-white text-center tracking-wider outline-none"
          />

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCreate}
            className="py-3 rounded-xl font-extrabold text-white tracking-widest"
            style={{ background: "linear-gradient(135deg,#22cc55,#118844)" }}
          >
            ➕ CREATE ROOM
          </motion.button>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/40 text-xs tracking-widest">OR</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          <input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit code"
            inputMode="numeric"
            className="w-full px-4 py-3 rounded-xl bg-white/10 border-2 border-white/20 text-white text-center tracking-[0.5em] font-mono text-lg outline-none"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleJoin}
            className="py-3 rounded-xl font-extrabold text-white tracking-widest"
            style={{ background: "linear-gradient(135deg,#4488ff,#2255cc)" }}
          >
            🔗 JOIN ROOM
          </motion.button>

          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
        </div>
      )}

      {screen === "lobby" && (
        <div className="w-full max-w-md px-4 py-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/50 text-xs tracking-widest">ROOM CODE</div>
              <div className="text-white font-mono text-3xl tracking-[0.3em]">{roomCode}</div>
            </div>
            <button
              onClick={() => { playClickSound(); navigator.clipboard?.writeText(roomCode); }}
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs tracking-widest"
            >
              📋 COPY
            </button>
          </div>

          {/* Players */}
          <div>
            <div className="text-white/60 text-xs tracking-widest mb-1">
              PLAYERS {players.length}/{MAX_PLAYERS}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: MAX_PLAYERS }).map((_, i) => {
                const p = players[i];
                return (
                  <div
                    key={i}
                    className="aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-1 text-center"
                    style={{
                      borderColor: p ? p.color : "rgba(255,255,255,0.15)",
                      background: p ? `${p.color}22` : "rgba(255,255,255,0.03)",
                    }}
                  >
                    {p ? (
                      <>
                        <div className="text-2xl">{p.isHost ? "👑" : "🏎️"}</div>
                        <div className="text-white text-[10px] font-bold truncate max-w-full">{p.name}</div>
                        {me?.id === p.id && <div className="text-white/60 text-[9px]">(you)</div>}
                      </>
                    ) : (
                      <div className="text-white/20 text-2xl">＋</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Map selection */}
          <div>
            <div className="text-white/60 text-xs tracking-widest mb-1">
              MAP {isHost ? "(host chooses)" : "(host chooses)"}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {themeList.map((tid) => {
                const t = THEMES[tid];
                const active = tid === themeId;
                return (
                  <button
                    key={tid}
                    disabled={!isHost}
                    onClick={() => { playClickSound(); updateTheme(tid); }}
                    className="px-2 py-1.5 rounded-lg border-2 text-xs font-bold text-white flex items-center gap-1 disabled:cursor-not-allowed"
                    style={{
                      borderColor: active ? t.edgeColor : "rgba(255,255,255,0.15)",
                      background: active ? `${t.edgeColor}33` : "rgba(255,255,255,0.03)",
                      opacity: isHost ? 1 : active ? 1 : 0.6,
                    }}
                  >
                    <span>{t.emoji}</span>
                    <span>{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat */}
          <div className="rounded-xl border border-white/15 bg-white/5 p-2 flex flex-col gap-2">
            <div className="text-white/60 text-xs tracking-widest">CHAT</div>
            <div className="h-28 overflow-y-auto flex flex-col gap-1 text-sm">
              <AnimatePresence initial={false}>
                {chat.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-white/90"
                  >
                    <span className="text-white/50 font-bold mr-1">{m.from}:</span>
                    {m.text}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="flex gap-1">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value.slice(0, 120))}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="Say something..."
                className="flex-1 px-2 py-1.5 rounded-lg bg-white/10 border border-white/15 text-white text-sm outline-none"
              />
              {["👍", "🔥", "🏁", "😂"].map((emo) => (
                <button
                  key={emo}
                  onClick={() => { setChatInput((v) => (v + emo).slice(0, 120)); }}
                  className="px-2 rounded-lg bg-white/10 border border-white/15 text-sm"
                >{emo}</button>
              ))}
              <button
                onClick={sendChat}
                className="px-3 rounded-lg bg-primary text-primary-foreground text-sm font-bold"
              >➤</button>
            </div>
          </div>

          {/* Start */}
          {isHost ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled={players.length < 1}
              onClick={startRace}
              className="py-3 rounded-xl font-extrabold text-white tracking-widest disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#ff4444,#ff8800)" }}
            >
              🏁 START RACE
            </motion.button>
          ) : (
            <div className="py-3 text-center text-white/60 text-sm tracking-widest">
              Waiting for host to start...
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default MultiplayerLobby;