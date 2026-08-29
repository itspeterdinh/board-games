export default function AvalonRulesScreen({ onBack }) {
  return (
    <div className="screen" style={{ gap: 20, paddingBottom: 40 }}>
      <div className="header-row">
        {onBack && (
          <button className="btn btn-ghost btn-small" onClick={onBack} style={{ marginRight: 8 }}>← Back</button>
        )}
        <div className="screen-title" style={{ flex: 1 }}>⚔️ Avalon Rules</div>
      </div>

      <Section title="Overview">
        <p>Avalon is a social deduction game for <strong>5–10 players</strong>. Loyal servants of Arthur must complete quests, while Minions of Mordred secretly sabotage them. Good wins by succeeding 3 quests; Evil wins by failing 3 quests — or by correctly identifying Merlin at the end.</p>
      </Section>

      <Section title="Teams">
        <Row icon="🔵" label="Good (Loyal Servants)" desc="Know nothing about each other. Work together to pass quests." color="var(--gold)" />
        <Row icon="🔴" label="Evil (Minions of Mordred)" desc="Know who each other are. Secretly sabotage quests." color="var(--red)" />
        <div style={{ marginTop: 10, background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: 'var(--muted)' }}>
          Team sizes by player count:<br />
          5p: 3G/2E · 6p: 4G/2E · 7p: 4G/3E · 8p: 5G/3E · 9p: 6G/3E · 10p: 6G/4E
        </div>
      </Section>

      <Section title="Special Roles">
        <Row icon="🧙" label="Merlin (Good)" desc="Knows who all Evil players are, but must stay hidden. If Evil identifies Merlin after losing, Evil wins instead." color="var(--gold)" />
        <Row icon="🔮" label="Percival (Good)" desc="Knows who Merlin is (and Morgana, if in play). Helps protect Merlin." color="var(--gold)" />
        <Row icon="🐍" label="Morgana (Evil)" desc="Appears as Merlin to Percival, creating confusion." color="var(--red)" />
        <Row icon="🗡️" label="Assassin (Evil)" desc="At the end of the game, if Good has won 3 quests, the Assassin gets one chance to name Merlin. If correct, Evil wins." color="var(--red)" />
        <Row icon="🎭" label="Oberon (Evil)" desc="Does not know other Evil players, and they don't know Oberon." color="var(--red)" />
        <Row icon="🛡️" label="Mordred (Evil)" desc="Hidden from Merlin — Merlin does not know Mordred is Evil." color="var(--red)" />
      </Section>

      <Section title="How to Play">
        {[
          ['1. Night Phase', 'Everyone closes their eyes. Evil players open their eyes to see each other. Merlin opens their eyes to see Evil (except Mordred). Percival sees Merlin (and Morgana).'],
          ['2. Quest Proposal', 'The Leader proposes a team of players to go on the quest. Team sizes vary by quest and player count.'],
          ['3. Team Vote', 'Everyone votes Approve or Reject. If majority approves, the team goes on the quest. If rejected, leadership passes left. After 5 consecutive rejections, Evil wins automatically.'],
          ['4. Quest', 'Team members secretly play a Success or Fail card. Good players must play Success. Evil players may play Fail. Most quests fail with 1 Fail card (Quest 4 in 7+ player games requires 2).'],
          ['5. Repeat', 'Play continues until Good wins 3 quests or Evil wins 3 quests.'],
          ['6. Assassination', 'If Good wins 3 quests, the Assassin names who they think Merlin is. If correct, Evil wins.'],
        ].map(([title, desc]) => (
          <div key={title} style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700, color: 'var(--gold)', marginBottom: 4, fontSize: '0.9rem' }}>{title}</div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </Section>

      <Section title="Quest Team Sizes">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ color: 'var(--muted)' }}>
              <th style={th}>Players</th>
              <th style={th}>Q1</th>
              <th style={th}>Q2</th>
              <th style={th}>Q3</th>
              <th style={th}>Q4</th>
              <th style={th}>Q5</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['5', '2','3','2','3','3'],
              ['6', '2','3','4','3','4'],
              ['7', '2','3','3','4*','4'],
              ['8', '3','4','4','5*','5'],
              ['9', '3','4','4','5*','5'],
              ['10','3','4','4','5*','5'],
            ].map(([p, ...qs]) => (
              <tr key={p}>
                <td style={td}>{p}</td>
                {qs.map((q, i) => <td key={i} style={td}>{q}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 6 }}>* Quest 4 requires 2 Fail cards in 7+ player games.</div>
      </Section>

      <Section title="Tips for Good">
        <Tip>Pay attention to who votes Approve or Reject — patterns reveal Evil players.</Tip>
        <Tip>Merlin must be subtle. If you know who Evil is, avoid making it obvious.</Tip>
        <Tip>Percival: protect Merlin by misdirecting Evil's assassination guess.</Tip>
      </Section>

      <Section title="Tips for Evil">
        <Tip>Don't fail every quest you're on — it makes you obvious. Sometimes passing builds trust.</Tip>
        <Tip>Morgana: act like Merlin to confuse Percival and the Assassin's guess.</Tip>
        <Tip>Try to identify Merlin early through their voting and discussion behavior.</Tip>
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 10 }}>{title}</div>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  )
}

function Row({ icon, label, desc, color }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color }}>{label}</div>
        <div style={{ fontSize: '0.83rem', color: 'var(--muted)', marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
      </div>
    </div>
  )
}

function Tip({ children }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.88rem', lineHeight: 1.5 }}>
      <span style={{ color: 'var(--gold)', flexShrink: 0 }}>•</span>
      <span>{children}</span>
    </div>
  )
}

const th = { padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid var(--border)', fontWeight: 600 }
const td = { padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid var(--border)' }
