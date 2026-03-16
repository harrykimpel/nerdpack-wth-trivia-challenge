import React from 'react';

function getOrdinal(n) {
    const r100 = n % 100;
    const suffix =
        r100 === 11 || r100 === 12 || r100 === 13
            ? 'th'
            : { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th';
    return `${n}${suffix}`;
}

function getMedal(place) {
    return { 1: '\u{1F947}', 2: '\u{1F948}', 3: '\u{1F949}' }[place] || '\u{1F3C5}';
}

function getCombinedScore(team) {
    return team.score + (team.judgeTotal || 0);
}

function getRankedTeams(teams) {
    return [...teams].sort(
        (a, b) =>
            getCombinedScore(b) - getCombinedScore(a) ||
            b.score - a.score ||
            a.name.localeCompare(b.name)
    );
}

function getWinnerText(teams) {
    const ranked = getRankedTeams(teams);
    if (ranked.length === 0) return 'No teams yet.';
    const topScore = getCombinedScore(ranked[0]);
    const winners = ranked
        .filter((t) => getCombinedScore(t) === topScore)
        .map((t) => t.name);
    return winners.length === 1
        ? `${getMedal(1)} ${winners[0]} with ${topScore.toFixed(1)} total points`
        : `${getMedal(1)} Tie between ${winners.join(', ')} with ${topScore.toFixed(1)} total points`;
}

export default function WinnerPhase({ state, dispatch }) {
    const rankedTeams = getRankedTeams(state.teams);
    const podiumTeams = rankedTeams.slice(0, 3);
    const remainingTeams = rankedTeams.slice(3);

    return (
        <section className="wth-panel wth-winner">
            <h2>Winner</h2>
            <p className="wth-winner-name">{getWinnerText(state.teams)}</p>

            <div className="wth-podium">
                {podiumTeams.map((team, i) => {
                    const place = i + 1;
                    return (
                        <article key={i} className={`wth-podium-card place-${place}`}>
                            <p className="wth-podium-medal">{getMedal(place)}</p>
                            <p className="wth-podium-place">{getOrdinal(place)}</p>
                            <p className="wth-podium-team">{team.name}</p>
                            <p className="wth-podium-score">
                                Total: {getCombinedScore(team).toFixed(1)} pts
                            </p>
                            <p className="muted">Trivia: {team.score}</p>
                            <p className="muted">Judge: {(team.judgeTotal || 0).toFixed(1)}</p>
                        </article>
                    );
                })}
            </div>

            {remainingTeams.length > 0 && (
                <>
                    <h3 className="wth-other-teams-heading">Other Teams</h3>
                    <table className="wth-leaderboard-table">
                        <thead>
                            <tr>
                                <th>Place</th>
                                <th>Team</th>
                                <th>Total</th>
                                <th>Trivia</th>
                                <th>Judge</th>
                            </tr>
                        </thead>
                        <tbody>
                            {remainingTeams.map((team, i) => {
                                const place = i + 4;
                                return (
                                    <tr key={i}>
                                        <td>{getOrdinal(place)}</td>
                                        <td>{team.name}</td>
                                        <td>{getCombinedScore(team).toFixed(1)}</td>
                                        <td>{team.score}</td>
                                        <td>{(team.judgeTotal || 0).toFixed(1)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </>
            )}

            <div className="wth-actions">
                {state.leaderboardReturnPhase && (
                    <button
                        className="wth-button ghost"
                        onClick={() => dispatch({ type: 'RETURN_FROM_LEADERBOARD' })}
                    >
                        Back to Game
                    </button>
                )}
                <button
                    className="wth-button"
                    onClick={() => dispatch({ type: 'RESET_GAME' })}
                >
                    Play Again
                </button>
            </div>
        </section>
    );
}
