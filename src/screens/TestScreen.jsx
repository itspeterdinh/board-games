import { useState, useEffect, useRef } from 'react';
import { createRoom, joinRoom, leaveRoom } from '../roomActions';
import { useRoom } from '../useRoom';
import LobbyScreen from './LobbyScreen';
import GameScreen from './GameScreen';

const FAKE_NAMES = [
  'Alice',
  'Bob',
  'Charlie',
  'Diana',
  'Eve',
  'Frank',
  'Grace',
  'Henry',
  'Ivan',
  'Julia',
  'Kevin',
  'Luna',
  'Mike',
  'Nina',
];

function fakeUser(name, i) {
  return {
    uid: `test_${name.toLowerCase()}_${i}`,
    displayName: name,
    photoURL: null,
  };
}

// ── Setup form ────────────────────────────────────────────────────────────────

function SetupForm({ user, onCreated, onBack }) {
  const [gameType, setGameType] = useState('avalon');
  const [playerCount, setPlayerCount] = useState(6);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // For Avalon: host plays → total = playerCount, fakes = playerCount - 1
  // For Werewolf: host = moderator → total = playerCount + 1, fakes = playerCount
  const minPlayers = gameType === 'werewolf' ? 5 : 5;
  const maxPlayers = gameType === 'werewolf' ? 14 : 10;
  const totalLabel =
    gameType === 'werewolf'
      ? `${playerCount} players + you as moderator`
      : `${playerCount} players total (including you)`;

  async function create() {
    setCreating(true);
    setError('');
    try {
      const id = await createRoom(user, '🧪 Test Room', 'test', gameType);

      const fakeCount = gameType === 'werewolf' ? playerCount : playerCount - 1;
      const fakes = FAKE_NAMES.slice(0, fakeCount).map((n, i) =>
        fakeUser(n, i),
      );
      for (const fp of fakes) await joinRoom(fp, id, 'test');

      onCreated({ roomId: id, fakePlayers: fakes, gameType });
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="screen">
      <div className="header-row">
        <button className="btn btn-ghost btn-small" onClick={onBack}>
          ← Back
        </button>
        <div
          className="screen-title"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          🧪 Test Mode
        </div>
      </div>
      <div
        style={{
          fontSize: '0.85rem',
          color: 'var(--muted)',
          textAlign: 'center',
        }}
      >
        Creates a room with fake players so you can switch between every
        perspective.
      </div>

      {/* Game picker */}
      <div className="field">
        <label>Game</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { key: 'avalon', icon: '⚔️', name: 'Avalon' },
            { key: 'werewolf', icon: '🐺', name: 'Werewolf' },
          ].map((g) => (
            <div
              key={g.key}
              onClick={() => {
                setGameType(g.key);
                setPlayerCount(6);
              }}
              style={{
                flex: 1,
                padding: '12px 10px',
                borderRadius: 12,
                cursor: 'pointer',
                textAlign: 'center',
                background:
                  gameType === g.key ? 'var(--surface)' : 'var(--surface2)',
                border: `2px solid ${gameType === g.key ? 'var(--gold)' : 'var(--border)'}`,
                boxShadow:
                  gameType === g.key ? '0 0 12px rgba(201,168,76,0.2)' : 'none',
              }}
            >
              <div style={{ fontSize: '1.8rem' }}>{g.icon}</div>
              <div
                style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: 4 }}
              >
                {g.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Player count */}
      <div className="field">
        <label>Players ({totalLabel})</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Array.from(
            { length: maxPlayers - minPlayers + 1 },
            (_, i) => i + minPlayers,
          ).map((n) => (
            <button
              key={n}
              onClick={() => setPlayerCount(n)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                border: '1.5px solid',
                borderColor:
                  playerCount === n ? 'var(--gold)' : 'var(--border)',
                background:
                  playerCount === n ? 'var(--gold)' : 'var(--surface2)',
                color: playerCount === n ? '#0d0d1a' : 'var(--text)',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <button className="btn btn-primary" onClick={create} disabled={creating}>
        {creating ? 'Creating…' : '🚀 Create Test Room'}
      </button>
    </div>
  );
}

// ── Room view with player switcher ────────────────────────────────────────────

function RoomView({ user, fakePlayers, roomId, gameType, onReset }) {
  const { room, loading } = useRoom(roomId);
  const [activeIdx, setActiveIdx] = useState(-1); // -1 = host/moderator
  const lastPhaseRef = useRef(undefined);
  const lastStatusRef = useRef(undefined);

  // Auto-switch to the player whose turn it is whenever the phase/status changes
  useEffect(() => {
    if (!room?.roles || room.status === 'lobby') return;

    const phaseChanged = room.nightPhase !== lastPhaseRef.current;
    const statusChanged = room.status !== lastStatusRef.current;
    lastPhaseRef.current = room.nightPhase;
    lastStatusRef.current = room.status;
    if (!phaseChanged && !statusChanged) return;

    const alive = (id) => (room.alivePlayers || []).includes(id);

    if (room.status === 'ww_night' && room.nightPhase) {
      const phase = room.nightPhase;
      let target = null;

      switch (phase) {
        case 'wolves': {
          const wolves = fakePlayers.filter(
            (p) => room.roles[p.uid] === 'WEREWOLF' && alive(p.uid),
          );
          if (wolves.length)
            target = wolves[Math.floor(Math.random() * wolves.length)];
          break;
        }
        case 'seer':
          target = fakePlayers.find(
            (p) => room.roles[p.uid] === 'SEER' && alive(p.uid),
          );
          break;
        case 'doctor':
          target = fakePlayers.find(
            (p) => room.roles[p.uid] === 'DOCTOR' && alive(p.uid),
          );
          break;
        case 'hunter':
          target = fakePlayers.find(
            (p) => room.roles[p.uid] === 'HUNTER' && alive(p.uid),
          );
          break;
        case 'witch':
          target = fakePlayers.find(
            (p) => room.roles[p.uid] === 'WITCH' && alive(p.uid),
          );
          break;
        case 'cupid':
          target = fakePlayers.find(
            (p) => room.roles[p.uid] === 'CUPID' && alive(p.uid),
          );
          break;
        default:
          break;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (target) setActiveIdx(fakePlayers.indexOf(target));
    } else if (statusChanged) {
      const st = room.status;
      if (st === 'ww_dayReveal' || st === 'ww_dayResult' || st === 'ended') {
        setActiveIdx(-1); // back to moderator/host
      } else if (st === 'ww_day' || st === 'ww_dayVote') {
        const aliveFakes = fakePlayers.filter((p) => alive(p.uid));
        if (aliveFakes.length) {
          const rnd = aliveFakes[Math.floor(Math.random() * aliveFakes.length)];
          setActiveIdx(fakePlayers.indexOf(rnd));
        }
      }
    }
  }, [room?.nightPhase, room?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeUser = activeIdx === -1 ? user : fakePlayers[activeIdx];

  // All switchable identities
  const tabs = [
    { uid: user.uid, label: gameType === 'werewolf' ? '📋 Mod' : '⚔️ Host' },
    ...fakePlayers.map((p) => ({ uid: p.uid, label: p.displayName })),
  ];

  async function handleLeave() {
    // Clean up the room on exit
    try {
      await leaveRoom(user, roomId);
    } catch {
      // empty
    }
    onReset();
  }

  if (loading) {
    return (
      <div style={{ paddingTop: 48 }}>
        <SwitcherBar
          tabs={tabs}
          activeIdx={activeIdx}
          onSwitch={setActiveIdx}
          onReset={handleLeave}
        />
        <div className="screen">
          <div className="spinner" style={{ margin: '60px auto' }} />
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div style={{ paddingTop: 48 }}>
        <SwitcherBar
          tabs={tabs}
          activeIdx={activeIdx}
          onSwitch={setActiveIdx}
          onReset={onReset}
        />
        <div className="screen">
          <div className="card text-center">
            <div className="text-muted">Room was deleted or not found.</div>
            <button
              className="btn btn-ghost btn-small"
              onClick={onReset}
              style={{ marginTop: 10 }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 48 }}>
      <SwitcherBar
        tabs={tabs}
        activeIdx={activeIdx}
        onSwitch={setActiveIdx}
        onReset={handleLeave}
      />
      {room.status === 'lobby' ? (
        <LobbyScreen
          key={activeUser.uid}
          user={activeUser}
          room={room}
          onLeave={handleLeave}
        />
      ) : (
        <GameScreen
          key={activeUser.uid}
          user={activeUser}
          room={room}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
}

function SwitcherBar({ tabs, activeIdx, onSwitch, onReset }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        zIndex: 9999,
        background: 'rgba(13,13,26,0.97)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 8px',
        overflowX: 'auto',
        backdropFilter: 'blur(8px)',
      }}
    >
      <span
        style={{ fontSize: '0.7rem', color: 'var(--muted)', flexShrink: 0 }}
      >
        👁
      </span>
      {tabs.map((t, i) => {
        const idx = i === 0 ? -1 : i - 1;
        const active = activeIdx === idx;
        return (
          <button
            key={t.uid}
            onClick={() => onSwitch(idx)}
            style={{
              flexShrink: 0,
              padding: '4px 10px',
              borderRadius: 16,
              background: active ? 'var(--gold)' : 'var(--surface2)',
              border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
              color: active ? '#0d0d1a' : 'var(--text)',
              fontSize: '0.75rem',
              fontWeight: active ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        );
      })}
      <button
        onClick={onReset}
        style={{
          flexShrink: 0,
          marginLeft: 'auto',
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          color: 'var(--muted)',
          fontSize: '0.75rem',
          cursor: 'pointer',
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function TestScreen({ user, onBack }) {
  const [session, setSession] = useState(null); // { roomId, fakePlayers, gameType }

  if (!session) {
    return <SetupForm user={user} onCreated={setSession} onBack={onBack} />;
  }

  return (
    <RoomView
      user={user}
      fakePlayers={session.fakePlayers}
      roomId={session.roomId}
      gameType={session.gameType}
      onReset={() => setSession(null)}
    />
  );
}
