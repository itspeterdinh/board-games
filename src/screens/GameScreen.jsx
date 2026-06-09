import NightScreen from './game/NightScreen'
import ProposeScreen from './game/ProposeScreen'
import VoteScreen from './game/VoteScreen'
import MissionScreen from './game/MissionScreen'
import AssassinScreen from './game/AssassinScreen'
import EndScreen from './game/EndScreen'

export default function GameScreen({ user, room, onLeave }) {
  const props = { user, room, onLeave }

  switch (room.status) {
    case 'night':        return <NightScreen {...props} />
    case 'propose':      return <ProposeScreen {...props} />
    case 'vote':         return <VoteScreen {...props} />
    case 'mission':      return <MissionScreen {...props} />
    case 'assassination': return <AssassinScreen {...props} />
    case 'ended':        return <EndScreen {...props} />
    default:             return <div className="screen"><div className="text-muted text-center">Loading game…</div></div>
  }
}
