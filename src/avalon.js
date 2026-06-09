// Quest team sizes: [quest1, quest2, quest3, quest4, quest5]
export const QUEST_SIZES = {
  5:  [2, 3, 2, 3, 3],
  6:  [2, 3, 4, 3, 4],
  7:  [2, 3, 3, 4, 4],
  8:  [3, 4, 4, 5, 5],
  9:  [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
}

// 4th quest needs 2 fails with 7+ players
export const DOUBLE_FAIL_QUEST = 4 // index 3 (0-based)

// Good/Evil split per player count [good, evil]
export const TEAM_SPLIT = {
  5:  [3, 2],
  6:  [4, 2],
  7:  [4, 3],
  8:  [5, 3],
  9:  [6, 3],
  10: [6, 4],
}

export const ROLES = {
  // Good
  MERLIN:          { name: 'Merlin',                   team: 'good', required: true },
  PERCIVAL:        { name: 'Percival',                  team: 'good' },
  LOYAL_SERVANT:   { name: 'Loyal Servant of Arthur',  team: 'good' },
  // Evil
  ASSASSIN:        { name: 'Assassin',                  team: 'evil', required: true },
  MORGANA:         { name: 'Morgana',                   team: 'evil' },
  MORDRED:         { name: 'Mordred',                   team: 'evil' },
  OBERON:          { name: 'Oberon',                    team: 'evil' },
  MINION:          { name: 'Minion of Mordred',         team: 'evil' },
}

export const ROLE_DESCRIPTIONS = {
  MERLIN:        'You know all evil players (except Mordred). Guide the good side without revealing yourself.',
  PERCIVAL:      'You see Merlin and Morgana, but not which is which. Protect Merlin.',
  LOYAL_SERVANT: 'You know nothing. Trust your instincts and vote wisely.',
  ASSASSIN:      'If good completes 3 quests, you may name Merlin to steal the win.',
  MORGANA:       'You appear as Merlin to Percival. Confuse and deceive.',
  MORDRED:       'You are hidden from Merlin. Lead evil undetected.',
  OBERON:        'You do not know other evil players, and they do not know you.',
  MINION:        'You know who your evil allies are. Help them sabotage quests.',
}

// What each role sees during the night phase
export function buildNightInfo(players, roles) {
  const info = {}

  const evilPlayers = players.filter(p =>
    ['ASSASSIN', 'MORGANA', 'MORDRED', 'MINION'].includes(roles[p.id])
  )
  const evilExceptOberon = evilPlayers // Oberon not in this list anyway
  const evilExceptMordred = players.filter(p =>
    ['ASSASSIN', 'MORGANA', 'OBERON', 'MINION'].includes(roles[p.id])
  )
  const merlinAndMorgana = players.filter(p =>
    ['MERLIN', 'MORGANA'].includes(roles[p.id])
  )

  for (const p of players) {
    const role = roles[p.id]
    if (role === 'MERLIN') {
      info[p.id] = {
        sees: evilExceptMordred.filter(e => e.id !== p.id).map(e => e.displayName),
        label: 'Evil players (excluding Mordred)',
      }
    } else if (role === 'PERCIVAL') {
      info[p.id] = {
        sees: merlinAndMorgana.filter(e => e.id !== p.id).map(e => e.displayName),
        label: 'One of these is Merlin (the other is Morgana)',
      }
    } else if (['ASSASSIN', 'MORGANA', 'MORDRED', 'MINION'].includes(role)) {
      info[p.id] = {
        sees: evilExceptOberon.filter(e => e.id !== p.id).map(e => e.displayName),
        label: 'Your evil allies',
      }
    } else {
      info[p.id] = { sees: [], label: 'You have no special knowledge' }
    }
  }
  return info
}

export function assignRoles(players, selectedOptionalRoles) {
  const count = players.length
  const [goodCount, evilCount] = TEAM_SPLIT[count]

  // Always: Merlin (good), Assassin (evil)
  const goodRoles = ['MERLIN']
  const evilRoles = ['ASSASSIN']

  const optionalGood = ['PERCIVAL']
  const optionalEvil = ['MORGANA', 'MORDRED', 'OBERON']

  for (const role of selectedOptionalRoles) {
    if (optionalGood.includes(role)) goodRoles.push(role)
    if (optionalEvil.includes(role)) evilRoles.push(role)
  }

  // Fill remaining with generics
  while (goodRoles.length < goodCount) goodRoles.push('LOYAL_SERVANT')
  while (evilRoles.length < evilCount) evilRoles.push('MINION')

  const allRoles = [...goodRoles, ...evilRoles]
  const shuffled = [...players].sort(() => Math.random() - 0.5)

  const roles = {}
  shuffled.forEach((p, i) => { roles[p.id] = allRoles[i] })
  return roles
}

export function questPassed(missionCards, questIndex, playerCount) {
  const fails = Object.values(missionCards).filter(c => c === 'fail').length
  const needsTwoFails = questIndex === DOUBLE_FAIL_QUEST && playerCount >= 7
  return needsTwoFails ? fails < 2 : fails === 0
}
