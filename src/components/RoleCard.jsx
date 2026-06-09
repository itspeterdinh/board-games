// Illustrated role cards with unique SVG art per role

const ROLE_CONFIG = {
  MERLIN: {
    name: 'Merlin',
    team: 'good',
    color: '#c9a84c',
    bg: 'linear-gradient(145deg, #1a1a2e, #16213e)',
    border: '#c9a84c',
    glow: 'rgba(201,168,76,0.4)',
    desc: 'You know all evil players (except Mordred). Guide the good side without revealing yourself.',
  },
  PERCIVAL: {
    name: 'Percival',
    team: 'good',
    color: '#5b9bd5',
    bg: 'linear-gradient(145deg, #0f2444, #1a3a5c)',
    border: '#5b9bd5',
    glow: 'rgba(91,155,213,0.4)',
    desc: 'You see Merlin and Morgana, but not which is which. Protect Merlin at all costs.',
  },
  LOYAL_SERVANT: {
    name: 'Loyal Servant',
    team: 'good',
    color: '#7ec8a0',
    bg: 'linear-gradient(145deg, #0d2818, #163d27)',
    border: '#7ec8a0',
    glow: 'rgba(126,200,160,0.4)',
    desc: 'You know nothing. Trust your instincts and vote wisely for the realm.',
  },
  ASSASSIN: {
    name: 'Assassin',
    team: 'evil',
    color: '#e74c3c',
    bg: 'linear-gradient(145deg, #2c0a0a, #3d1111)',
    border: '#e74c3c',
    glow: 'rgba(231,76,60,0.4)',
    desc: 'If good completes 3 quests, you may name Merlin to steal victory for evil.',
  },
  MORGANA: {
    name: 'Morgana',
    team: 'evil',
    color: '#9b59b6',
    bg: 'linear-gradient(145deg, #1e0a2e, #2d1244)',
    border: '#9b59b6',
    glow: 'rgba(155,89,182,0.4)',
    desc: 'You appear as Merlin to Percival. Sow confusion and protect your true identity.',
  },
  MORDRED: {
    name: 'Mordred',
    team: 'evil',
    color: '#e67e22',
    bg: 'linear-gradient(145deg, #2a1200, #3d1c00)',
    border: '#e67e22',
    glow: 'rgba(230,126,34,0.4)',
    desc: 'You are hidden from Merlin. Lead evil undetected from the shadows.',
  },
  OBERON: {
    name: 'Oberon',
    team: 'evil',
    color: '#1abc9c',
    bg: 'linear-gradient(145deg, #001a17, #002a22)',
    border: '#1abc9c',
    glow: 'rgba(26,188,156,0.4)',
    desc: 'You do not know other evil players and they do not know you. Sabotage alone.',
  },
  MINION: {
    name: 'Minion of Mordred',
    team: 'evil',
    color: '#c0392b',
    bg: 'linear-gradient(145deg, #200000, #300808)',
    border: '#c0392b',
    glow: 'rgba(192,57,43,0.4)',
    desc: 'You know your evil allies. Coordinate secretly to sabotage quests and win.',
  },
}

// SVG illustrations per role
function RoleArt({ role, color }) {
  switch (role) {
    case 'MERLIN': return (
      <svg viewBox="0 0 100 120" width="100" height="120">
        {/* Starfield */}
        {[[15,10],[85,18],[50,8],[30,30],[75,25],[10,50],[90,45]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="1.5" fill={color} opacity={0.6 + (i%3)*0.15} />
        ))}
        {/* Wizard hat */}
        <polygon points="50,5 25,55 75,55" fill="#1a1a4e" stroke={color} strokeWidth="1.5"/>
        <rect x="20" y="53" width="60" height="8" rx="4" fill={color} opacity="0.9"/>
        {/* Stars on hat */}
        <text x="50" y="38" textAnchor="middle" fontSize="14" fill={color}>✦</text>
        <text x="38" y="50" textAnchor="middle" fontSize="8" fill={color} opacity="0.7">✦</text>
        <text x="62" y="48" textAnchor="middle" fontSize="8" fill={color} opacity="0.7">✦</text>
        {/* Robe */}
        <path d="M35,61 L20,115 L80,115 L65,61 Z" fill="#1a1a4e" stroke={color} strokeWidth="1"/>
        {/* Face */}
        <ellipse cx="50" cy="65" rx="14" ry="16" fill="#f0d0a0"/>
        {/* Long beard */}
        <path d="M38,72 Q50,100 50,115 Q50,100 62,72" fill="#e8e8e8" stroke="#ccc" strokeWidth="0.5"/>
        {/* Eyes */}
        <circle cx="45" cy="63" r="2" fill={color}/>
        <circle cx="55" cy="63" r="2" fill={color}/>
        {/* Staff */}
        <line x1="75" y1="115" x2="68" y2="40" stroke={color} strokeWidth="2"/>
        <circle cx="67" cy="37" r="5" fill="none" stroke={color} strokeWidth="1.5"/>
        <circle cx="67" cy="37" r="2.5" fill={color} opacity="0.8"/>
      </svg>
    )
    case 'PERCIVAL': return (
      <svg viewBox="0 0 100 120" width="100" height="120">
        {/* Helmet */}
        <path d="M30,55 Q30,20 50,20 Q70,20 70,55 L70,60 L30,60 Z" fill="#4a6fa5" stroke={color} strokeWidth="1.5"/>
        <rect x="28" y="55" width="44" height="10" rx="2" fill={color} opacity="0.8"/>
        {/* Visor slit */}
        <rect x="38" y="43" width="24" height="4" rx="2" fill="#0d0d1a"/>
        {/* Plume */}
        <path d="M50,20 Q45,5 40,8 Q45,12 42,18" fill={color} opacity="0.7"/>
        <path d="M50,20 Q50,3 50,6 Q52,12 50,18" fill={color}/>
        <path d="M50,20 Q55,5 60,8 Q55,12 58,18" fill={color} opacity="0.7"/>
        {/* Body armor */}
        <path d="M28,65 L15,115 L85,115 L72,65 Z" fill="#3a5a8a" stroke={color} strokeWidth="1"/>
        {/* Chest plate */}
        <ellipse cx="50" cy="82" rx="18" ry="22" fill="#4a6fa5" stroke={color} strokeWidth="1"/>
        <line x1="50" y1="62" x2="50" y2="104" stroke={color} strokeWidth="1" opacity="0.5"/>
        <line x1="32" y1="80" x2="68" y2="80" stroke={color} strokeWidth="1" opacity="0.5"/>
        {/* Cross on chest */}
        <text x="50" y="87" textAnchor="middle" fontSize="18" fill={color} opacity="0.8">✦</text>
        {/* Shield */}
        <path d="M68,70 L68,95 Q68,105 78,100 L88,70 Z" fill="#2a4a7a" stroke={color} strokeWidth="1.5"/>
        <text x="78" y="90" textAnchor="middle" fontSize="12" fill={color}>⚜</text>
      </svg>
    )
    case 'LOYAL_SERVANT': return (
      <svg viewBox="0 0 100 120" width="100" height="120">
        {/* Figure */}
        <ellipse cx="50" cy="30" rx="14" ry="16" fill="#f0d0a0"/>
        {/* Tunic */}
        <path d="M30,44 L20,115 L80,115 L70,44 Z" fill="#2d5a2d" stroke={color} strokeWidth="1"/>
        <path d="M36,44 L50,48 L64,44" stroke={color} strokeWidth="1.5" fill="none"/>
        {/* Belt */}
        <rect x="22" y="75" width="56" height="6" rx="3" fill={color} opacity="0.6"/>
        {/* Sword */}
        <line x1="72" y1="115" x2="65" y2="48" stroke="#aaa" strokeWidth="3"/>
        <line x1="58" y1="72" x2="74" y2="72" stroke={color} strokeWidth="3"/>
        <rect x="63" y="44" width="6" height="8" rx="1" fill={color}/>
        {/* Hair */}
        <path d="M36,26 Q50,18 64,26" fill="#8b6914" stroke="#8b6914" strokeWidth="1"/>
        {/* Eyes */}
        <circle cx="45" cy="29" r="2" fill="#5a3a1a"/>
        <circle cx="55" cy="29" r="2" fill="#5a3a1a"/>
        {/* Shield on back hint */}
        <ellipse cx="22" cy="82" rx="8" ry="10" fill="#3a6a3a" stroke={color} strokeWidth="1.5"/>
        <line x1="22" y1="73" x2="22" y2="91" stroke={color} strokeWidth="1" opacity="0.6"/>
        <line x1="15" y1="82" x2="29" y2="82" stroke={color} strokeWidth="1" opacity="0.6"/>
      </svg>
    )
    case 'ASSASSIN': return (
      <svg viewBox="0 0 100 120" width="100" height="120">
        {/* Dark hood */}
        <path d="M25,60 Q25,15 50,15 Q75,15 75,60 L75,65 L25,65 Z" fill="#1a0a0a" stroke={color} strokeWidth="1.5"/>
        <path d="M28,62 Q50,40 72,62" fill="#0d0505" stroke={color} strokeWidth="1"/>
        {/* Shadow face */}
        <ellipse cx="50" cy="55" rx="15" ry="17" fill="#1a0a0a"/>
        {/* Glowing eyes */}
        <ellipse cx="44" cy="53" rx="3" ry="2" fill={color} opacity="0.9"/>
        <ellipse cx="56" cy="53" rx="3" ry="2" fill={color} opacity="0.9"/>
        <circle cx="44" cy="53" r="1" fill="#fff" opacity="0.5"/>
        <circle cx="56" cy="53" r="1" fill="#fff" opacity="0.5"/>
        {/* Dark cloak */}
        <path d="M25,65 L10,115 L90,115 L75,65 Z" fill="#1a0a0a" stroke={color} strokeWidth="1"/>
        {/* Daggers */}
        <line x1="35" y1="115" x2="42" y2="72" stroke="#999" strokeWidth="2"/>
        <polygon points="42,72 39,67 45,67" fill={color}/>
        <line x1="65" y1="115" x2="58" y2="72" stroke="#999" strokeWidth="2"/>
        <polygon points="58,72 55,67 61,67" fill={color}/>
        {/* Blood drip */}
        <circle cx="42" cy="80" r="1.5" fill={color} opacity="0.7"/>
        <circle cx="58" cy="77" r="1.5" fill={color} opacity="0.7"/>
        {/* Drops */}
        {[20,25,30,35,40,45].map(y => (
          <circle key={y} cx={10 + (y-20)*2} cy={y+70} r="1" fill={color} opacity="0.3"/>
        ))}
      </svg>
    )
    case 'MORGANA': return (
      <svg viewBox="0 0 100 120" width="100" height="120">
        {/* Moon backdrop */}
        <circle cx="75" cy="20" r="15" fill={color} opacity="0.15"/>
        <circle cx="80" cy="17" r="12" fill="#0d0d1a"/>
        {/* Flowing dark hair */}
        <path d="M30,35 Q20,60 15,115" fill="#1a0a2e" stroke="#2a1040" strokeWidth="8" strokeLinecap="round"/>
        <path d="M70,35 Q80,60 85,115" fill="#1a0a2e" stroke="#2a1040" strokeWidth="8" strokeLinecap="round"/>
        {/* Face */}
        <ellipse cx="50" cy="42" rx="16" ry="18" fill="#e8c4d0"/>
        {/* Crown */}
        <path d="M34,28 L37,18 L42,25 L50,15 L58,25 L63,18 L66,28 Z" fill={color} stroke="#6a2a8a" strokeWidth="0.5"/>
        {/* Jewels in crown */}
        <circle cx="50" cy="20" r="2.5" fill="#ff6b9d"/>
        <circle cx="40" cy="24" r="1.5" fill={color}/>
        <circle cx="60" cy="24" r="1.5" fill={color}/>
        {/* Magical eyes */}
        <ellipse cx="44" cy="41" rx="3" ry="2.5" fill={color}/>
        <ellipse cx="56" cy="41" rx="3" ry="2.5" fill={color}/>
        {/* Smile */}
        <path d="M44,50 Q50,55 56,50" stroke="#8a3a5a" strokeWidth="1.5" fill="none"/>
        {/* Dark gown */}
        <path d="M28,58 L10,115 L90,115 L72,58 Z" fill="#1a0a2e" stroke={color} strokeWidth="1"/>
        {/* Magic orb */}
        <circle cx="65" cy="75" r="10" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6"/>
        <circle cx="65" cy="75" r="6" fill={color} opacity="0.2"/>
        <circle cx="65" cy="75" r="3" fill={color} opacity="0.6"/>
      </svg>
    )
    case 'MORDRED': return (
      <svg viewBox="0 0 100 120" width="100" height="120">
        {/* Dark crown */}
        <path d="M28,38 L30,20 L38,30 L50,15 L62,30 L70,20 L72,38 Z" fill="#2a1500" stroke={color} strokeWidth="1.5"/>
        {/* Spikes */}
        <polygon points="50,12 47,22 53,22" fill={color}/>
        <polygon points="36,26 33,36 39,36" fill={color} opacity="0.8"/>
        <polygon points="64,26 61,36 67,36" fill={color} opacity="0.8"/>
        {/* Dark visor helmet */}
        <rect x="28" y="36" width="44" height="35" rx="8" fill="#1a0800" stroke={color} strokeWidth="1.5"/>
        <rect x="35" y="48" width="30" height="6" rx="3" fill="#0d0000"/>
        <rect x="35" y="48" width="30" height="6" rx="3" fill={color} opacity="0.2"/>
        {/* Glowing slit eyes */}
        <rect x="37" y="49" width="10" height="3" rx="1.5" fill={color}/>
        <rect x="53" y="49" width="10" height="3" rx="1.5" fill={color}/>
        {/* Black armor */}
        <path d="M25,70 L10,115 L90,115 L75,70 Z" fill="#1a0800" stroke={color} strokeWidth="1"/>
        <ellipse cx="50" cy="88" rx="20" ry="24" fill="#1a0800" stroke={color} strokeWidth="1.5"/>
        {/* Armor details */}
        <line x1="50" y1="68" x2="50" y2="112" stroke={color} strokeWidth="1" opacity="0.4"/>
        <path d="M30,80 Q50,76 70,80" stroke={color} strokeWidth="1" fill="none" opacity="0.4"/>
        <path d="M28,90 Q50,86 72,90" stroke={color} strokeWidth="1" fill="none" opacity="0.4"/>
        {/* Evil sigil */}
        <text x="50" y="95" textAnchor="middle" fontSize="14" fill={color} opacity="0.7">☠</text>
        {/* Sword hilt */}
        <rect x="46" y="112" width="8" height="3" fill={color} opacity="0.8"/>
        <line x1="50" y1="108" x2="50" y2="120" stroke="#888" strokeWidth="3"/>
      </svg>
    )
    case 'OBERON': return (
      <svg viewBox="0 0 100 120" width="100" height="120">
        {/* Mist/shadow effect */}
        {[0,1,2,3].map(i => (
          <ellipse key={i} cx={30+i*12} cy={95+i*5} rx={15+i*5} ry="6" fill={color} opacity="0.05"/>
        ))}
        {/* Shadowy figure - mysterious */}
        <path d="M50,18 Q30,18 28,50 Q26,75 20,115 L80,115 Q74,75 72,50 Q70,18 50,18 Z"
          fill="#001a17" stroke={color} strokeWidth="1.5" opacity="0.9"/>
        {/* Hood */}
        <path d="M28,50 Q28,18 50,18 Q72,18 72,50 Q65,38 50,38 Q35,38 28,50 Z" fill="#002a20"/>
        {/* Single eye visible in shadow */}
        <ellipse cx="50" cy="50" rx="4" ry="3" fill={color} opacity="0.9"/>
        <circle cx="50" cy="50" r="1.5" fill="#fff" opacity="0.4"/>
        {/* Teal wisps */}
        <path d="M20,70 Q35,65 30,80" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5"/>
        <path d="M80,70 Q65,65 70,80" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5"/>
        <path d="M35,90 Q50,83 65,90" stroke={color} strokeWidth="1.5" fill="none" opacity="0.4"/>
        {/* Question marks - the unknown */}
        <text x="22" y="88" fontSize="10" fill={color} opacity="0.3">?</text>
        <text x="72" y="80" fontSize="10" fill={color} opacity="0.3">?</text>
        <text x="45" y="108" fontSize="10" fill={color} opacity="0.3">?</text>
      </svg>
    )
    case 'MINION': return (
      <svg viewBox="0 0 100 120" width="100" height="120">
        {/* Dark hood */}
        <path d="M25,65 Q25,18 50,18 Q75,18 75,65 L75,70 L25,70 Z" fill="#200000" stroke={color} strokeWidth="1.5"/>
        {/* Shadowed face */}
        <ellipse cx="50" cy="57" rx="15" ry="17" fill="#1a0505"/>
        {/* Red eyes */}
        <circle cx="44" cy="55" r="3" fill={color} opacity="0.8"/>
        <circle cx="56" cy="55" r="3" fill={color} opacity="0.8"/>
        <circle cx="44" cy="55" r="1.2" fill="#ff8888"/>
        <circle cx="56" cy="55" r="1.2" fill="#ff8888"/>
        {/* Sneer */}
        <path d="M43,64 Q50,62 57,64" stroke={color} strokeWidth="1.2" fill="none"/>
        {/* Dark robe */}
        <path d="M25,70 L12,115 L88,115 L75,70 Z" fill="#200000" stroke={color} strokeWidth="1"/>
        {/* Mordred crest */}
        <circle cx="50" cy="90" r="10" fill="none" stroke={color} strokeWidth="1" opacity="0.5"/>
        <text x="50" y="95" textAnchor="middle" fontSize="12" fill={color} opacity="0.6">ᛉ</text>
        {/* Claws */}
        <line x1="25" y1="115" x2="30" y2="95" stroke={color} strokeWidth="1.5" opacity="0.6"/>
        <line x1="28" y1="115" x2="32" y2="97" stroke={color} strokeWidth="1" opacity="0.4"/>
        <line x1="75" y1="115" x2="70" y2="95" stroke={color} strokeWidth="1.5" opacity="0.6"/>
        <line x1="72" y1="115" x2="68" y2="97" stroke={color} strokeWidth="1" opacity="0.4"/>
      </svg>
    )
    default: return <div style={{ fontSize: 48 }}>❓</div>
  }
}

export default function RoleCard({ role, showDesc = true, compact = false }) {
  const cfg = ROLE_CONFIG[role]
  if (!cfg) return null

  return (
    <div style={{
      background: cfg.bg,
      border: `2px solid ${cfg.border}`,
      borderRadius: compact ? 14 : 18,
      padding: compact ? '16px 14px' : '24px 20px',
      boxShadow: `0 0 32px ${cfg.glow}, 0 8px 32px rgba(0,0,0,0.6)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: compact ? 8 : 12,
      maxWidth: compact ? 200 : 320,
      width: '100%',
      alignSelf: 'stretch',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow background */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit',
        background: `radial-gradient(circle at 50% 30%, ${cfg.glow} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Team badge */}
      <div style={{
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: cfg.color,
        background: `${cfg.color}22`,
        border: `1px solid ${cfg.color}44`,
        padding: '3px 10px',
        borderRadius: 20,
      }}>
        {cfg.team === 'good' ? '✦ Servant of Arthur' : '✦ Minion of Mordred'}
      </div>

      {/* Art */}
      <div style={{ filter: `drop-shadow(0 0 12px ${cfg.glow})` }}>
        <RoleArt role={role} color={cfg.color} />
      </div>

      {/* Name */}
      <div style={{
        fontSize: compact ? '1.1rem' : '1.4rem',
        fontWeight: 800,
        color: cfg.color,
        textShadow: `0 0 20px ${cfg.glow}`,
        letterSpacing: '0.03em',
        textAlign: 'center',
      }}>
        {cfg.name}
      </div>

      {/* Description */}
      {showDesc && (
        <div style={{
          fontSize: '0.85rem',
          color: '#b0b0c8',
          lineHeight: 1.5,
          textAlign: 'center',
        }}>
          {cfg.desc}
        </div>
      )}
    </div>
  )
}

export { ROLE_CONFIG }
