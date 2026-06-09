/**
 * Renders a circular avatar: photo if available, else initial letter.
 * Accepts the same className/style as any div.
 */
export default function PlayerAvatar({ player, size, style = {}, className = 'avatar', children }) {
  const sz = size ? { width: size, height: size, minWidth: size } : {}
  if (player?.photoURL) {
    return (
      <div className={className} style={{ ...sz, padding: 0, overflow: 'hidden', ...style }}>
        <img
          src={player.photoURL}
          alt={player.displayName}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {children}
      </div>
    )
  }
  return (
    <div className={className} style={{ ...sz, ...style }}>
      {player?.displayName?.[0]?.toUpperCase() || '?'}
      {children}
    </div>
  )
}
