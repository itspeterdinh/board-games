import { QUEST_SIZES } from '../../../avalon';
import LeaderOrder from './LeaderOrder';

export default function QuestHeader({ room }) {
  const { currentQuest, questResults, players } = room;
  const count = players.length;
  const sizes = QUEST_SIZES[count] || [];

  return (
    <>
      <div className="card">
        <div className="card-title">Quests</div>
        <div className="quest-tracker">
          {sizes.map((size, i) => {
            let cls = 'quest-dot';
            if (i < questResults.length)
              cls += questResults[i] ? ' success' : ' fail';
            else if (i === currentQuest) cls += ' current';
            return (
              <div className={cls} key={i}>
                {i < questResults.length
                  ? questResults[i]
                    ? '✓'
                    : '✗'
                  : i + 1}
                <span className="team-size">{size}p</span>
              </div>
            );
          })}
        </div>
      </div>
      <LeaderOrder room={room} />
    </>
  );
}
