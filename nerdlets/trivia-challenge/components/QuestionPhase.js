import React from 'react';

function TextWithBreaks({ text }) {
    if (!text) return null;
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    return lines.map((line, i) => (
        <React.Fragment key={i}>
            {line}
            {i < lines.length - 1 && <br />}
        </React.Fragment>
    ));
}

export default function QuestionPhase({ state, dispatch }) {
    const { categoryIndex, questionIndex } = state.currentQuestion;
    const question = state.categories[categoryIndex].questions[questionIndex];
    const points = question.value;

    return (
        <section className="wth-panel wth-question">
            <div className="wth-question-header">
                <span className="wth-badge">{question.categoryName}</span>
                <span className="wth-badge">${points}</span>
                {state.enableTimer && (
                    <span className="wth-badge timer">{state.timeRemaining} s</span>
                )}
            </div>

            <h2 className="wth-question-text">
                <TextWithBreaks text={question.prompt} />
            </h2>

            {state.enableBuzzer && state.phase === 'question' && (
                <div className="wth-buzzer">
                    <h3>Buzzer</h3>
                    <div className="wth-buzzer-grid">
                        {state.teams.map((team, i) => (
                            <button
                                key={i}
                                className="wth-button small"
                                disabled={state.buzzerLocked}
                                onClick={() => dispatch({ type: 'BUZZ_IN', teamIndex: i })}
                            >
                                Buzz: {team.name}
                            </button>
                        ))}
                    </div>
                    {state.buzzedTeamIndex !== null && (
                        <>
                            <p className="muted">
                                Buzzed: {state.teams[state.buzzedTeamIndex].name}
                            </p>
                            <button
                                className="wth-button ghost small"
                                onClick={() => dispatch({ type: 'RESET_BUZZ' })}
                            >
                                Reset Buzz
                            </button>
                        </>
                    )}
                </div>
            )}

            {state.phase === 'answer' && (
                <div className="wth-answer">
                    <h3>Answer</h3>
                    <p className="wth-answer-text">
                        <TextWithBreaks text={question.answer} />
                    </p>
                </div>
            )}

            {state.phase === 'answer' && (
                <div className="wth-score-actions">
                    <h3>Score this question</h3>
                    <p className="muted">Points: {points}</p>

                    {state.buzzedTeamIndex !== null && (
                        <div className="wth-quick-score">
                            <span>Buzzed team:</span>
                            <button
                                className="wth-button small"
                                onClick={() =>
                                    dispatch({
                                        type: 'ADJUST_SCORE',
                                        teamIndex: state.buzzedTeamIndex,
                                        delta: points,
                                    })
                                }
                            >
                                Award {state.teams[state.buzzedTeamIndex].name}
                            </button>
                            <button
                                className="wth-button ghost small"
                                onClick={() =>
                                    dispatch({
                                        type: 'ADJUST_SCORE',
                                        teamIndex: state.buzzedTeamIndex,
                                        delta: -points,
                                    })
                                }
                            >
                                Penalize {state.teams[state.buzzedTeamIndex].name}
                            </button>
                        </div>
                    )}

                    <div className="wth-team-score-grid">
                        {state.teams.map((team, i) => (
                            <div key={i} className="wth-team-score-row">
                                <span>{team.name}</span>
                                <div className="wth-team-score-buttons">
                                    <button
                                        className="wth-button small"
                                        onClick={() =>
                                            dispatch({
                                                type: 'ADJUST_SCORE',
                                                teamIndex: i,
                                                delta: points,
                                            })
                                        }
                                    >
                                        + {points}
                                    </button>
                                    <button
                                        className="wth-button ghost small"
                                        onClick={() =>
                                            dispatch({
                                                type: 'ADJUST_SCORE',
                                                teamIndex: i,
                                                delta: -points,
                                            })
                                        }
                                    >
                                        - {points}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="wth-actions">
                {state.phase === 'question' && (
                    <button
                        className="wth-button"
                        onClick={() => dispatch({ type: 'REVEAL_ANSWER' })}
                    >
                        Show Answer
                    </button>
                )}
                <button
                    className="wth-button ghost"
                    onClick={() => dispatch({ type: 'RETURN_TO_BOARD' })}
                >
                    Back to Board
                </button>
                <button
                    className="wth-button"
                    onClick={() => dispatch({ type: 'COMPLETE_QUESTION' })}
                >
                    Mark Answered
                </button>
            </div>
        </section>
    );
}
