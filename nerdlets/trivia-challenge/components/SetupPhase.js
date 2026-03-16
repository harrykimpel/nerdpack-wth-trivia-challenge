import React from 'react';

export default function SetupPhase({ state, dispatch }) {
    const hasValidTeam = state.teams.some((t) => t.name.trim() !== '');

    return (
        <section className="wth-panel">
            <h2>Set up teams</h2>
            <p className="muted">Add the team or candidate names, then start the game.</p>

            <div className="wth-team-editor">
                {state.teams.map((team, i) => (
                    <div key={i} className="wth-team-row">
                        <input
                            className="wth-input"
                            value={team.name}
                            onChange={(e) =>
                                dispatch({
                                    type: 'UPDATE_TEAM_NAME',
                                    index: i,
                                    name: e.target.value,
                                })
                            }
                        />
                        <button
                            className="wth-button ghost"
                            onClick={() => dispatch({ type: 'REMOVE_TEAM', index: i })}
                            disabled={state.teams.length <= 1}
                        >
                            Remove
                        </button>
                    </div>
                ))}
            </div>

            <div className="wth-options">
                <label className="wth-toggle">
                    <input
                        type="checkbox"
                        checked={state.enableTimer}
                        onChange={() => dispatch({ type: 'TOGGLE_TIMER' })}
                    />
                    Question Timer
                </label>
                <label className="wth-toggle">
                    <input
                        type="checkbox"
                        checked={state.enableBuzzer}
                        onChange={() => dispatch({ type: 'TOGGLE_BUZZER' })}
                    />
                    Buzzer Mode
                </label>
                <label className="wth-toggle">
                    Seconds per question
                    <input
                        className="wth-input small"
                        type="number"
                        min="10"
                        max="120"
                        value={state.questionSeconds}
                        onChange={(e) =>
                            dispatch({
                                type: 'SET_QUESTION_SECONDS',
                                seconds: parseInt(e.target.value, 10) || 30,
                            })
                        }
                    />
                </label>
            </div>

            <div className="wth-actions">
                <button
                    className="wth-button ghost"
                    onClick={() => dispatch({ type: 'ADD_TEAM' })}
                >
                    Add Team
                </button>
                <button
                    className="wth-button"
                    onClick={() => dispatch({ type: 'START_GAME' })}
                    disabled={!hasValidTeam}
                >
                    Start Game
                </button>
            </div>
        </section>
    );
}
