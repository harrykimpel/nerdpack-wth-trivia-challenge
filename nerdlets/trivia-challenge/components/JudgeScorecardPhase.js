import React from 'react';

function getWeightedScore(score, weight) {
    if (score === null || score === undefined || score === '') return 0;
    return (score / 4) * weight;
}

export default function JudgeScorecardPhase({
    state,
    dispatch,
    categories,
    scoreMultiplier,
}) {
    return (
        <section className="wth-panel wth-judge-scorecard">
            <h2>Judge Scorecard</h2>
            <p className="muted">
                Enter scores from 0 to 4. Weighted score per row uses: (Score / 4) x
                Weight x {scoreMultiplier}. A perfect rubric score gives 5,000 judge
                points.
            </p>

            <div className="wth-judge-grid">
                {state.teams.map((team, teamIndex) => {
                    const judgeTotal = team.judgeTotal || 0;
                    const combinedTotal = team.score + judgeTotal;

                    return (
                        <article key={teamIndex} className="wth-judge-team-card">
                            <header className="wth-judge-team-header">
                                <h3>{team.name}</h3>
                                <div className="wth-judge-team-totals">
                                    <span>Trivia: {team.score}</span>
                                    <span>Judge: {judgeTotal.toFixed(1)}</span>
                                    <span>Total: {combinedTotal.toFixed(1)}</span>
                                </div>
                            </header>

                            <table className="wth-judge-table">
                                <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th>Weight</th>
                                        <th>Score</th>
                                        <th>Weighted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map((category) => {
                                        const score = team.judgeScores?.[category.key];
                                        const weighted =
                                            getWeightedScore(score, category.weight) *
                                            scoreMultiplier;

                                        return (
                                            <tr key={category.key}>
                                                <td>{category.label}</td>
                                                <td>{category.weight}</td>
                                                <td>
                                                    <select
                                                        className="wth-select"
                                                        value={
                                                            score === null || score === undefined
                                                                ? ''
                                                                : String(score)
                                                        }
                                                        onChange={(e) =>
                                                            dispatch({
                                                                type: 'SET_JUDGE_SCORE',
                                                                teamIndex,
                                                                categoryKey: category.key,
                                                                score:
                                                                    e.target.value === ''
                                                                        ? null
                                                                        : parseFloat(e.target.value),
                                                            })
                                                        }
                                                        aria-label={`${team.name} ${category.label} score`}
                                                    >
                                                        <option value="">-</option>
                                                        {[0, 1, 2, 3, 4].map((optionScore) => (
                                                            <option key={optionScore} value={optionScore}>
                                                                {optionScore}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td>{weighted.toFixed(1)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th colSpan="3">Judge Total</th>
                                        <th>{judgeTotal.toFixed(1)}</th>
                                    </tr>
                                </tfoot>
                            </table>
                        </article>
                    );
                })}
            </div>

            <div className="wth-actions">
                <button
                    className="wth-button ghost"
                    onClick={() => dispatch({ type: 'RESET_ALL_JUDGE_SCORES' })}
                >
                    Reset Judge Scores
                </button>
                <button
                    className="wth-button"
                    onClick={() => dispatch({ type: 'RETURN_FROM_JUDGE_SCORECARD' })}
                >
                    Back
                </button>
            </div>
        </section>
    );
}
