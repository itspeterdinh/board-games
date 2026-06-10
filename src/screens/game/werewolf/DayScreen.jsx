import { useState } from 'react';
import { WW_ROLES } from '../../../werewolf';
import { startDayVoting, castDayVote } from '../../../werewolfActions';
import PlayerAvatar from '../../../components/PlayerAvatar';
import PreviousNightsLog from './PreviousNightsLog';

export default function DayScreen({ user, room }) {
  const {
    alivePlayers,
    deadPlayers,
    players,
    roles,
    hostId,
    status,
    dayVotes,
    round,
    lovers,
  } = room;
  const isHost = user.uid === hostId;
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const aliveList = (alivePlayers || [])
    .map((id) => playerMap[id])
    .filter(Boolean);

  const isVoting = status === 'ww_dayVote';
  const isAlive = (alivePlayers || []).includes(user.uid);
  const myVote = dayVotes?.[user.uid];
  const votedCount = Object.keys(dayVotes || {}).length;
  const totalAlive = alivePlayers?.length || 0;

  const [pick, setPick] = useState(null);

  async function handleStartVote() {
    await startDayVoting(room.id);
  }
  async function handleVote() {
    if (!pick) return;
    await castDayVote(room.id, user.uid, pick);
  }

  // ── Moderator view ──────────────────────────────────────────────────────────
  if (isHost) {
    // Tally live votes for moderator view
    const tally = {};
    Object.values(dayVotes || {}).forEach((t) => {
      tally[t] = (tally[t] || 0) + 1;
    });

    return (
      <div className="screen">
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <div style={{ fontSize: '2rem' }}>📋</div>
          <div className="screen-title" style={{ marginTop: 4 }}>
            Moderator — Day {round}
          </div>
          <div className="screen-subtitle">
            {isVoting
              ? `Vote in progress — ${votedCount}/${totalAlive} voted`
              : 'Discussion phase'}
          </div>
        </div>

        {/* Script */}
        <div className="card" style={{ borderColor: 'rgba(201,168,76,0.4)' }}>
          <div className="card-title">📜 Script</div>
          {!isVoting ? (
            <ol
              style={{
                margin: 0,
                paddingLeft: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {[
                'Good morning, village!',
                `Last night, ${(room.nightDeaths || []).length === 0 ? 'no one died.' : `${(room.nightDeaths || []).length} player(s) died.`}`,
                'Discuss who you think the werewolves are.',
                'When ready, click "Start Vote" to begin the elimination vote.',
              ].map((line, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: '0.9rem',
                    color: line.startsWith('When')
                      ? 'var(--muted)'
                      : 'var(--text)',
                    fontStyle: line.startsWith('When') ? 'italic' : 'normal',
                  }}
                >
                  {line}
                </li>
              ))}
            </ol>
          ) : (
            <ol
              style={{
                margin: 0,
                paddingLeft: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {[
                'Everyone votes on their phones for who to eliminate.',
                'The player with the most votes is eliminated.',
                'In case of a tie, no one is eliminated.',
              ].map((line, i) => (
                <li key={i} style={{ fontSize: '0.9rem' }}>
                  {line}
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Live vote tally for host */}
        {isVoting && Object.keys(tally).length > 0 && (
          <div className="card">
            <div className="card-title">🗳️ Live Tally</div>
            {Object.entries(tally)
              .sort((a, b) => b[1] - a[1])
              .map(([id, count]) => (
                <div
                  key={id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '4px 0',
                  }}
                >
                  <PlayerAvatar player={playerMap[id]} size={30} />
                  <div style={{ flex: 1 }}>{playerMap[id]?.displayName}</div>
                  <span style={{ fontWeight: 700, color: 'var(--gold)' }}>
                    {count} vote{count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--muted)',
                marginTop: 8,
              }}
            >
              {votedCount}/{totalAlive} players voted
            </div>
          </div>
        )}

        {/* Alive players with role info */}
        <div className="card">
          <div className="card-title">Alive ({aliveList.length})</div>
          <div className="player-list">
            {aliveList.map((p) => {
              const roleData = WW_ROLES[roles?.[p.id]];
              return (
                <div key={p.id} className="player-row">
                  <PlayerAvatar player={p} />
                  <div className="player-name">{p.displayName}</div>
                  <span
                    className="player-badge"
                    style={{
                      color: roleData?.color,
                      borderColor: roleData?.color,
                    }}
                  >
                    {roleData?.icon} {roleData?.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {!isVoting && (
          <button className="btn btn-primary" onClick={handleStartVote}>
            🗳️ Start Vote
          </button>
        )}

        {/* Graveyard */}
        {(deadPlayers || []).length > 0 && (
          <Graveyard
            deadPlayers={deadPlayers}
            playerMap={playerMap}
            showRoles
          />
        )}

        {/* Previous nights */}
        {room.nightLogs?.length > 0 && (
          <PreviousNightsLog
            nightLogs={room.nightLogs}
            playerMap={playerMap}
            roles={roles}
          />
        )}
      </div>
    );
  }

  // ── Player view ──────────────────────────────────────────────────────────────
  return (
    <div className="screen">
      <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
        <div style={{ fontSize: '2rem' }}>☀️</div>
        <div className="screen-title" style={{ marginTop: 4 }}>
          Day — Round {round}
        </div>
        <div className="screen-subtitle">
          {isVoting
            ? 'Vote to eliminate a suspect'
            : 'Discuss and find the werewolves'}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Alive ({aliveList.length})</div>
        <div className="player-list">
          {aliveList.map((p) => {
            const isLover = lovers?.includes(p.id) && lovers?.includes(user.uid);
            const isSelected = isVoting && pick === p.id;
            const isSelf = p.id === user.uid;
            const canSelect = isVoting && isAlive && !myVote && !isSelf;
            const votersForMe = isVoting
              ? Object.entries(dayVotes || {})
                  .filter(([, t]) => t === p.id)
                  .map(([vid]) => playerMap[vid]?.displayName)
                  .filter(Boolean)
              : [];
            return (
              <div key={p.id}>
                <div
                  className={`player-row ${canSelect ? 'selectable' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => canSelect && setPick(p.id)}
                  style={{
                    cursor: canSelect ? 'pointer' : 'default',
                    borderBottom: 'none',
                  }}
                >
                  <PlayerAvatar
                    player={p}
                    style={isSelected ? { background: 'var(--red)' } : {}}
                  />
                  <div className="player-name">
                    {p.displayName}
                    {isLover && (
                      <span style={{ marginLeft: 4, fontSize: '0.75rem' }}>
                        💘
                      </span>
                    )}
                  </div>
                  {isSelf && <span className="player-badge you">You</span>}
                  {isSelected && (
                    <span
                      className="player-badge"
                      style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                    >
                      Suspect
                    </span>
                  )}
                </div>
                {votersForMe.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                      marginTop: 12,
                      marginBottom: 4,
                      paddingLeft: 44,
                    }}
                  >
                    {votersForMe.map((name) => (
                      <span
                        key={name}
                        style={{
                          fontSize: '0.82rem',
                          padding: '4px 12px',
                          borderRadius: 12,
                          background: 'rgba(231,76,60,0.12)',
                          border: '1px solid rgba(231,76,60,0.3)',
                          color: 'var(--red,#e74c3c)',
                        }}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {isVoting && isAlive && (
        <div className="card">
          {myVote ? (
            <div className="text-center text-muted">
              ✓ Vote cast. Waiting for others… ({votedCount}/{totalAlive})
            </div>
          ) : (
            <>
              <div
                className="text-muted text-center"
                style={{ marginBottom: 10, fontSize: '0.85rem' }}
              >
                Select a player to eliminate ({votedCount}/{totalAlive} voted)
              </div>
              <button
                className="btn btn-primary"
                style={{ background: '#c0392b' }}
                onClick={handleVote}
                disabled={!pick}
              >
                🗳️ Eliminate {pick ? playerMap[pick]?.displayName : '…'}
              </button>
            </>
          )}
        </div>
      )}
      {isVoting && !isAlive && (
        <div className="card text-center">
          <div className="text-muted">💀 You are dead — observe silently.</div>
        </div>
      )}

      {!isVoting && (
        <div className="card text-center">
          <div className="text-muted">
            Discuss with the group. Waiting for the moderator to start the vote…
          </div>
        </div>
      )}

      {(deadPlayers || []).length > 0 && (
        <Graveyard
          deadPlayers={deadPlayers}
          playerMap={playerMap}
          showRoles={false}
        />
      )}
    </div>
  );
}

function Graveyard({ deadPlayers, playerMap, showRoles }) {
  return (
    <div className="card">
      <div className="card-title">Graveyard</div>
      <div className="player-list">
        {deadPlayers.map((d, i) => {
          const p = playerMap[d.id];
          const roleData = WW_ROLES[d.role];
          return (
            <div key={i} className="player-row" style={{ opacity: 0.6 }}>
              <PlayerAvatar player={p} style={{ filter: 'grayscale(1)' }} />
              <div
                className="player-name"
                style={{ textDecoration: 'line-through' }}
              >
                {d.displayName}
              </div>
              {showRoles && (
                <span
                  className="player-badge"
                  style={{
                    color: roleData?.color,
                    borderColor: roleData?.color,
                  }}
                >
                  {roleData?.icon} {roleData?.name}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
