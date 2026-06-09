import { QUEST_SIZES } from '../../avalon'

export default function QuestHeader({ room }) {
  const { currentQuest, questResults, players, rejectionCount } = room
  const count = players.length
  const sizes = QUEST_SIZES[count] || []

  return (
    <div className="card">
      <div className="card-title">Quests</div>
      <div className="quest-tracker">
        {sizes.map((size, i) => {
          let cls = 'quest-dot'
          if (i < questResults.length) cls += questResults[i] ? ' success' : ' fail'
          else if (i === currentQuest) cls += ' current'
          return (
            <div className={cls} key={i}>
              {i < questResults.length ? (questResults[i] ? '✓' : '✗') : i + 1}
              <span className="team-size">{size}p</span>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14 }}>
        <span className="text-muted" style={{ fontSize: '0.8rem' }}>Rejection strikes:</span>
        <div className="rejection-bar">
          {[0,1,2,3,4].map(i => (
            <div key={i} className={`rejection-pip ${i < rejectionCount ? 'used' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
