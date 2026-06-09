// ── Werewolf game logic ──────────────────────────────────────────────────────

export const WW_ROLES = {
  WEREWOLF:   { name: 'Werewolf',    team: 'werewolves', icon: '🐺', color: '#e74c3c', bg: 'linear-gradient(145deg,#2c0a0a,#3d1111)', border: '#e74c3c', glow: 'rgba(231,76,60,0.4)',  desc: 'Each night, choose a villager to eliminate. By day, blend in and avoid suspicion.' },
  WHITE_WOLF: { name: 'White Wolf',  team: 'werewolves', icon: '🤍🐺', color: '#e0e0e0', bg: 'linear-gradient(145deg,#1a1a1a,#2e2e2e)', border: '#e0e0e0', glow: 'rgba(224,224,224,0.4)', desc: 'You are a werewolf, but the Seer sees you as safe. Hunt with the pack each night.' },
  VILLAGER:   { name: 'Villager',    team: 'village',    icon: '🧑‍🌾', color: '#7ec8a0', bg: 'linear-gradient(145deg,#0d2818,#163d27)', border: '#7ec8a0', glow: 'rgba(126,200,160,0.4)', desc: 'No special power. Use logic and persuasion to find and eliminate the werewolves.' },
  SEER:       { name: 'Seer',        team: 'village',    icon: '🔮', color: '#c9a84c', bg: 'linear-gradient(145deg,#1a1a2e,#16213e)', border: '#c9a84c', glow: 'rgba(201,168,76,0.4)',  desc: 'Each night, investigate one player — you learn if they are a Werewolf or not.' },
  DOCTOR:     { name: 'Doctor',      team: 'village',    icon: '💉', color: '#5b9bd5', bg: 'linear-gradient(145deg,#0f2444,#1a3a5c)', border: '#5b9bd5', glow: 'rgba(91,155,213,0.4)',  desc: 'Each night, protect one player from the wolves. You cannot protect the same person two nights in a row.' },
  HUNTER:     { name: 'Hunter',      team: 'village',    icon: '🏹', color: '#e67e22', bg: 'linear-gradient(145deg,#2a1200,#3d1c00)', border: '#e67e22', glow: 'rgba(230,126,34,0.4)',  desc: 'If you are eliminated (day or night), you immediately take one player down with you.' },
  WITCH:      { name: 'Witch',       team: 'village',    icon: '🧙', color: '#9b59b6', bg: 'linear-gradient(145deg,#1e0a2e,#2d1244)', border: '#9b59b6', glow: 'rgba(155,89,182,0.4)',  desc: 'You have one save potion and one poison potion for the whole game. Use them wisely.' },
  CUPID:      { name: 'Cupid',       team: 'village',    icon: '💘', color: '#e91e8c', bg: 'linear-gradient(145deg,#2a0018,#3d0026)', border: '#e91e8c', glow: 'rgba(233,30,140,0.4)',  desc: 'On the first night, choose two players to be lovers. If one dies, the other dies of heartbreak.' },
}

// All wolf-team roles
export const WOLF_ROLES = ['WEREWOLF', 'WHITE_WOLF']

// Default wolf count by player number
const WOLF_COUNT = { 5:1, 6:1, 7:2, 8:2, 9:2, 10:2, 11:3, 12:3, 13:3, 14:3, 15:4 }

// Max wolves allowed = floor(playerCount / 3)
export function maxWolves(playerCount) { return Math.max(1, Math.floor(playerCount / 3)) }

export function assignWerewolfRoles(players, optionalRoles = [], wolfCount = null) {
  const count = players.length

  // Separate wolf-count overrides (WHITE_WOLF) from regular optional roles
  const hasWhiteWolf = optionalRoles.includes('WHITE_WOLF')
  const nonWolfOptional = optionalRoles.filter(r => !WOLF_ROLES.includes(r))

  // Total wolves: respect explicit wolfCount, else use default table
  const totalWolves = wolfCount ?? (WOLF_COUNT[count] ?? Math.max(1, Math.floor(count / 4)))
  // If white wolf is enabled, one of the wolf slots becomes WHITE_WOLF
  const whiteWolves = hasWhiteWolf ? 1 : 0
  const regularWolves = totalWolves - whiteWolves

  const pool = [
    ...Array(regularWolves).fill('WEREWOLF'),
    ...Array(whiteWolves).fill('WHITE_WOLF'),
    'SEER',
    'DOCTOR',
    ...nonWolfOptional,                        // HUNTER, WITCH, CUPID replace villagers
  ]
  while (pool.length < count) pool.push('VILLAGER')

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const roles = {}
  players.forEach((p, i) => { roles[p.id] = pool[i] })
  return roles
}

// Static night info shown at game start (wolf teammates)
export function buildWerewolfNightInfo(players, roles) {
  const info = {}
  const wolfNames = players.filter(p => WOLF_ROLES.includes(roles[p.id])).map(p => p.displayName)
  players.forEach(p => {
    const isWolf = WOLF_ROLES.includes(roles[p.id])
    const allies = wolfNames.filter(n => n !== p.displayName)
    info[p.id] = isWolf
      ? { sees: allies, label: allies.length ? 'Your wolf allies:' : 'You are the lone wolf.' }
      : { sees: [], label: '' }
  })
  return info
}

// Determine first night phase
export function getInitialNightPhase(roles, alivePlayers, round) {
  if (round === 1 && alivePlayers.some(uid => roles[uid] === 'CUPID')) return 'cupid'
  return 'wolves'
}

// Advance to next sub-phase; returns 'resolve' when night is over
export function getNextNightPhase(roles, alivePlayers, currentPhase, witchUsedSave, witchUsedPoison) {
  const has = r => alivePlayers.some(uid => roles[uid] === r)
  const witchActive = has('WITCH') && (!witchUsedSave || !witchUsedPoison)

  switch (currentPhase) {
    case 'cupid':  return 'wolves'
    case 'wolves': return has('SEER') ? 'seer' : has('DOCTOR') ? 'doctor' : has('HUNTER') ? 'hunter' : witchActive ? 'witch' : 'resolve'
    case 'seer':   return has('DOCTOR') ? 'doctor' : has('HUNTER') ? 'hunter' : witchActive ? 'witch' : 'resolve'
    case 'doctor': return has('HUNTER') ? 'hunter' : witchActive ? 'witch' : 'resolve'
    case 'hunter': return witchActive ? 'witch' : 'resolve'
    case 'witch':  return 'resolve'
    default:       return 'resolve'
  }
}

// Resolve night: returns array of { id, killedBy }
export function resolveNightDeaths({ roles, alivePlayers, wolfKillTarget, nightDoctorTarget, nightWitchSave, nightWitchPoison, lovers, hunterNightTarget }) {
  const deaths = []
  const dead = id => deaths.find(d => d.id === id)

  // Wolf kill (unless doctor/witch saved)
  if (wolfKillTarget) {
    const saved = nightDoctorTarget === wolfKillTarget || nightWitchSave === wolfKillTarget
    if (!saved) deaths.push({ id: wolfKillTarget, killedBy: 'wolves' })
  }
  // Witch poison
  if (nightWitchPoison && !dead(nightWitchPoison)) {
    deaths.push({ id: nightWitchPoison, killedBy: 'witch' })
  }

  // Hunter auto-fires: if hunter was killed, their pre-selected target also dies
  const hunterDied = deaths.find(d => roles[d.id] === 'HUNTER')
  if (hunterDied && hunterNightTarget && alivePlayers.includes(hunterNightTarget) && !dead(hunterNightTarget)) {
    deaths.push({ id: hunterNightTarget, killedBy: 'hunter' })
  }

  // Lover heartbreak — runs last (and catches chains: wolf kills lover A → lover B dies)
  const addHeartbreak = () => {
    if (!lovers?.length) return
    const before = deaths.length
    const deadIds = new Set(deaths.map(d => d.id))
    lovers.forEach(id => {
      if (deadIds.has(id)) {
        const other = lovers.find(l => l !== id)
        if (other && alivePlayers.includes(other) && !deadIds.has(other)) {
          deaths.push({ id: other, killedBy: 'heartbreak' })
        }
      }
    })
    if (deaths.length > before) addHeartbreak() // recurse if new deaths created more heartbreak
  }
  addHeartbreak()

  return deaths
}

// Check overall win; returns 'village' | 'werewolves' | null
export function checkWerewolfWin(alivePlayers, roles) {
  const wolves = alivePlayers.filter(id => WOLF_ROLES.includes(roles[id])).length
  const others = alivePlayers.filter(id => !WOLF_ROLES.includes(roles[id])).length
  if (wolves === 0) return 'village'
  if (wolves >= others) return 'werewolves'
  return null
}
