import { WW_ROLES } from '../../../werewolf';
import { resetToLobby } from '../../../roomActions';
// import { leaveRoom } from '../../../roomActions';
import PlayerAvatar from '../../../components/PlayerAvatar';

export default function WerewolfEndScreen({ user, room, onLeave }) {
  const { winner, players, roles, deadPlayers, hostId, lovers } = room;
  const isHost = user.uid === hostId;
  const myRole = roles?.[user.uid];
  const myRoleData = WW_ROLES[myRole];
  const isWinner = winner === myRoleData?.team;
  // const playerMap = Object.fromEntries(players.map(p => [p.id, p]))

  return (
    <div className="screen">
      <div className="screen-title">🐺 Game Over</div>

      {/* Winner banner */}
      <div
        style={{
          borderRadius: 16,
          padding: '20px',
          textAlign: 'center',
          background:
            winner === 'werewolves'
              ? 'linear-gradient(135deg, rgba(44,10,10,0.9), rgba(61,17,17,0.9))'
              : 'linear-gradient(135deg, rgba(13,40,24,0.9), rgba(22,61,39,0.9))',
          border: `1.5px solid ${winner === 'werewolves' ? '#e74c3c' : '#7ec8a0'}`,
          boxShadow: `0 0 30px ${winner === 'werewolves' ? 'rgba(231,76,60,0.3)' : 'rgba(126,200,160,0.3)'}`,
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: 8 }}>
          {winner === 'werewolves' ? '🐺' : '🏘️'}
        </div>
        <h2
          style={{
            margin: 0,
            color: winner === 'werewolves' ? '#e74c3c' : '#7ec8a0',
            fontSize: '1.5rem',
          }}
        >
          {winner === 'werewolves' ? 'Werewolves Win!' : 'Village Wins!'}
        </h2>
        <div
          style={{ marginTop: 8, color: 'var(--muted)', fontSize: '0.9rem' }}
        >
          {winner === 'werewolves'
            ? 'The wolves have taken over the village.'
            : 'The villagers hunted down every last wolf.'}
        </div>
        <div
          style={{
            marginTop: 12,
            fontWeight: 700,
            fontSize: '1rem',
            color: isWinner ? '#f1c40f' : 'var(--muted)',
          }}
        >
          {isWinner ? '🏆 You Won!' : '💀 You Lost'}
        </div>
      </div>

      {/* All roles revealed */}
      <div className="card">
        <div className="card-title">All Roles Revealed</div>
        <div className="player-list">
          {players.map((p) => {
            const role = roles?.[p.id];
            const roleData = WW_ROLES[role];
            const isDead = (deadPlayers || []).some((d) => d.id === p.id);
            const isLover = lovers?.includes(p.id);
            return (
              <div
                key={p.id}
                className="player-row"
                style={{ opacity: isDead ? 0.55 : 1 }}
              >
                <PlayerAvatar
                  player={p}
                  style={{
                    border: `2px solid ${roleData?.border || 'var(--border)'}`,
                    boxShadow: `0 0 8px ${roleData?.glow || 'transparent'}`,
                    filter: isDead ? 'grayscale(0.5)' : 'none',
                  }}
                />
                <div className="player-name">
                  {p.displayName}
                  {isLover && (
                    <span style={{ marginLeft: 4, fontSize: '0.75rem' }}>
                      💘
                    </span>
                  )}
                  {isDead && (
                    <span
                      style={{
                        marginLeft: 4,
                        fontSize: '0.75rem',
                        color: 'var(--muted)',
                      }}
                    >
                      (dead)
                    </span>
                  )}
                </div>
                <span
                  className="player-badge"
                  style={{
                    color: roleData?.color,
                    borderColor: roleData?.color,
                  }}
                >
                  {roleData?.icon} {roleData?.name || role}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dead players summary */}
      {(deadPlayers || []).length > 0 && (
        <div className="card">
          <div className="card-title">Graveyard</div>
          {deadPlayers.map((d, i) => {
            // const roleData = WW_ROLES[d.role];
            const LABELS = {
              wolves: '🐺 wolves',
              witch: '☠️ witch',
              heartbreak: '💔 heartbreak',
              vote: '⚖️ village',
              hunter: '🏹 hunter',
            };
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  fontSize: '0.85rem',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span style={{ color: 'var(--text)' }}>{d.displayName}</span>
                <span style={{ color: 'var(--muted)' }}>
                  Round {d.round} · {LABELS[d.killedBy] || d.killedBy}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {isHost ? (
        <button
          className="btn btn-primary"
          onClick={() => resetToLobby(room.id)}
        >
          Play Again
        </button>
      ) : (
        <div className="text-muted text-center">
          Waiting for host to start a new game…
        </div>
      )}
      <button className="btn btn-ghost" onClick={onLeave}>
        Leave Room
      </button>
    </div>
  );
}
