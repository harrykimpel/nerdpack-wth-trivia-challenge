import React, { useReducer, useEffect, useState } from 'react';
import {
    PlatformStateContext,
    NerdGraphQuery,
    Spinner,
    AccountPicker,
} from 'nr1';
import SetupPhase from './components/SetupPhase';
import BoardPhase from './components/BoardPhase';
import QuestionPhase from './components/QuestionPhase';
import WinnerPhase from './components/WinnerPhase';
import JudgeScorecardPhase from './components/JudgeScorecardPhase';
import './styles.scss';

const JUDGE_SCORECARD_CATEGORIES = [
    { key: 'solutionCompleteness', label: 'Solution Completeness', weight: 25 },
    { key: 'observabilityQuality', label: 'Observability Quality', weight: 20 },
    { key: 'aiQuality', label: 'AI Quality & Evaluation', weight: 20 },
    { key: 'securityImplementation', label: 'Security Implementation', weight: 20 },
    {
        key: 'demoClarityEngineering',
        label: 'Demo Clarity & Engineering Excellence',
        weight: 15,
    },
];

const JUDGE_SCORE_MULTIPLIER = 50;

function createEmptyJudgeScores() {
    return JUDGE_SCORECARD_CATEGORIES.reduce((acc, item) => {
        acc[item.key] = null;
        return acc;
    }, {});
}

function clampJudgeScore(value) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseFloat(value);
    if (Number.isNaN(parsed)) return null;
    return Math.max(0, Math.min(4, parsed));
}

function calculateJudgeTotal(judgeScores) {
    return JUDGE_SCORECARD_CATEGORIES.reduce((sum, item) => {
        const score = judgeScores?.[item.key];
        if (score === null || score === undefined) return sum;
        return sum + (score / 4) * item.weight * JUDGE_SCORE_MULTIPLIER;
    }, 0);
}

const initialState = {
    phase: 'setup',
    teams: [],
    categories: [],
    currentQuestion: null,
    leaderboardReturnPhase: null,
    judgeViewReturnPhase: null,
    enableTimer: true,
    enableBuzzer: true,
    questionSeconds: 30,
    timeRemaining: 0,
    buzzerLocked: false,
    buzzedTeamIndex: null,
    scoreApplied: false,
};

function gameReducer(state, action) {
    switch (action.type) {
        case 'INIT_DATA': {
            return {
                ...state,
                teams: action.teams.map((name) => ({
                    name,
                    score: 0,
                    judgeScores: createEmptyJudgeScores(),
                    judgeTotal: 0,
                })),
                categories: action.categories,
            };
        }

        case 'UPDATE_TEAM_NAME': {
            const teams = state.teams.map((t, i) =>
                i === action.index ? { ...t, name: action.name } : t
            );
            return { ...state, teams };
        }

        case 'ADD_TEAM':
            return {
                ...state,
                teams: [
                    ...state.teams,
                    {
                        name: `Team ${state.teams.length + 1}`,
                        score: 0,
                        judgeScores: createEmptyJudgeScores(),
                        judgeTotal: 0,
                    },
                ],
            };

        case 'REMOVE_TEAM': {
            if (state.teams.length <= 1) return state;
            return {
                ...state,
                teams: state.teams.filter((_, i) => i !== action.index),
            };
        }

        case 'TOGGLE_TIMER':
            return { ...state, enableTimer: !state.enableTimer };

        case 'TOGGLE_BUZZER':
            return { ...state, enableBuzzer: !state.enableBuzzer };

        case 'SET_QUESTION_SECONDS':
            return { ...state, questionSeconds: action.seconds };

        case 'START_GAME': {
            const hasValidTeam = state.teams.some((t) => t.name.trim() !== '');
            if (!hasValidTeam) return state;
            const teams = state.teams.map((t) => ({
                ...t,
                name: t.name.trim(),
                score: 0,
                judgeScores: createEmptyJudgeScores(),
                judgeTotal: 0,
            }));
            const categories = state.categories.map((cat) => ({
                ...cat,
                questions: cat.questions.map((q) => ({ ...q, isAnswered: false })),
            }));
            return {
                ...state,
                phase: 'board',
                teams,
                categories,
                currentQuestion: null,
                buzzerLocked: false,
                buzzedTeamIndex: null,
                scoreApplied: false,
            };
        }

        case 'SELECT_QUESTION': {
            const { categoryIndex, questionIndex } = action;
            const q = state.categories[categoryIndex]?.questions[questionIndex];
            if (!q || q.isAnswered) return state;
            return {
                ...state,
                phase: 'question',
                leaderboardReturnPhase: null,
                currentQuestion: { categoryIndex, questionIndex },
                scoreApplied: false,
                buzzerLocked: false,
                buzzedTeamIndex: null,
                timeRemaining: state.enableTimer
                    ? Math.max(1, state.questionSeconds)
                    : 0,
            };
        }

        case 'REVEAL_ANSWER':
            return { ...state, phase: 'answer' };

        case 'ADJUST_SCORE': {
            const teams = state.teams.map((t, i) =>
                i === action.teamIndex ? { ...t, score: t.score + action.delta } : t
            );
            return { ...state, teams, scoreApplied: true };
        }

        case 'SET_JUDGE_SCORE': {
            const teams = state.teams.map((t, i) => {
                if (i !== action.teamIndex) return t;
                const judgeScores = {
                    ...t.judgeScores,
                    [action.categoryKey]: clampJudgeScore(action.score),
                };
                return {
                    ...t,
                    judgeScores,
                    judgeTotal: calculateJudgeTotal(judgeScores),
                };
            });
            return { ...state, teams };
        }

        case 'RESET_ALL_JUDGE_SCORES': {
            const teams = state.teams.map((t) => ({
                ...t,
                judgeScores: createEmptyJudgeScores(),
                judgeTotal: 0,
            }));
            return { ...state, teams };
        }

        case 'BUZZ_IN': {
            if (state.buzzerLocked) return state;
            return {
                ...state,
                buzzedTeamIndex: action.teamIndex,
                buzzerLocked: true,
            };
        }

        case 'RESET_BUZZ':
            return {
                ...state,
                buzzerLocked: false,
                buzzedTeamIndex: null,
                scoreApplied: false,
            };

        case 'COMPLETE_QUESTION': {
            if (!state.currentQuestion) return state;
            const { categoryIndex, questionIndex } = state.currentQuestion;
            const categories = state.categories.map((cat, ci) =>
                ci === categoryIndex
                    ? {
                        ...cat,
                        questions: cat.questions.map((q, qi) =>
                            qi === questionIndex ? { ...q, isAnswered: true } : q
                        ),
                    }
                    : cat
            );
            const allAnswered = categories.every((c) =>
                c.questions.every((q) => q.isAnswered)
            );
            return {
                ...state,
                categories,
                phase: allAnswered ? 'winner' : 'board',
                leaderboardReturnPhase: null,
                currentQuestion: null,
                buzzerLocked: false,
                buzzedTeamIndex: null,
                scoreApplied: false,
            };
        }

        case 'SHOW_LEADERBOARD': {
            if (!['board', 'question', 'answer'].includes(state.phase)) return state;
            return {
                ...state,
                phase: 'winner',
                leaderboardReturnPhase: state.phase,
                judgeViewReturnPhase: null,
            };
        }

        case 'RETURN_FROM_LEADERBOARD': {
            if (!state.leaderboardReturnPhase) return state;
            return {
                ...state,
                phase: state.leaderboardReturnPhase,
                leaderboardReturnPhase: null,
            };
        }

        case 'SHOW_JUDGE_SCORECARD': {
            if (!['setup', 'board', 'question', 'answer', 'winner'].includes(state.phase)) {
                return state;
            }
            return {
                ...state,
                phase: 'judge',
                judgeViewReturnPhase: state.phase,
                leaderboardReturnPhase: null,
            };
        }

        case 'RETURN_FROM_JUDGE_SCORECARD': {
            const returnPhase = state.judgeViewReturnPhase || 'board';
            return {
                ...state,
                phase: returnPhase,
                judgeViewReturnPhase: null,
            };
        }

        case 'RETURN_TO_BOARD':
            return {
                ...state,
                phase: 'board',
                leaderboardReturnPhase: null,
                judgeViewReturnPhase: null,
                currentQuestion: null,
                buzzerLocked: false,
                buzzedTeamIndex: null,
                scoreApplied: false,
            };

        case 'END_GAME':
            return {
                ...state,
                phase: 'winner',
                leaderboardReturnPhase: null,
                judgeViewReturnPhase: null,
            };

        case 'RESET_GAME':
            return {
                ...state,
                phase: 'setup',
                leaderboardReturnPhase: null,
                judgeViewReturnPhase: null,
                currentQuestion: null,
                buzzerLocked: false,
                buzzedTeamIndex: null,
                scoreApplied: false,
            };

        case 'TICK_TIMER': {
            if (state.phase !== 'question' || state.timeRemaining <= 0) return state;
            const timeRemaining = state.timeRemaining - 1;
            if (timeRemaining <= 0) {
                return {
                    ...state,
                    timeRemaining: 0,
                    phase: 'answer',
                    buzzerLocked: true,
                };
            }
            return { ...state, timeRemaining };
        }

        default:
            return state;
    }
}

function TeamScoreAdjuster({ team, teamIndex, dispatch }) {
    const [customDelta, setCustomDelta] = useState('5');
    const parsedDelta = parseInt(customDelta, 10);
    const safeDelta = Number.isNaN(parsedDelta) ? 0 : Math.abs(parsedDelta);
    const judgeTotal = team.judgeTotal || 0;
    const combinedTotal = team.score + judgeTotal;

    return (
        <div className="wth-team-card" key={teamIndex}>
            <div className="wth-team-card-main">
                <span className="team-name">{team.name}</span>
                <span className="team-score">{team.score}</span>
            </div>

            <div className="wth-team-subtotals muted">
                <span>Judge: {judgeTotal.toFixed(1)}</span>
                <span>Total: {combinedTotal.toFixed(1)}</span>
            </div>

            <div className="wth-team-adjustments">
                <p className="muted wth-bonus-label">Manual bonus or penalty</p>

                <div className="wth-bonus-quick">
                    {[1, 5, 10].map((amount) => (
                        <button
                            key={`plus-${amount}`}
                            className="wth-button small"
                            onClick={() =>
                                dispatch({
                                    type: 'ADJUST_SCORE',
                                    teamIndex,
                                    delta: amount,
                                })
                            }
                        >
                            +{amount}
                        </button>
                    ))}
                    {[1, 5, 10].map((amount) => (
                        <button
                            key={`minus-${amount}`}
                            className="wth-button ghost small"
                            onClick={() =>
                                dispatch({
                                    type: 'ADJUST_SCORE',
                                    teamIndex,
                                    delta: -amount,
                                })
                            }
                        >
                            -{amount}
                        </button>
                    ))}
                </div>

                <div className="wth-bonus-custom">
                    <input
                        className="wth-input small wth-bonus-input"
                        type="number"
                        min="1"
                        step="1"
                        value={customDelta}
                        onChange={(e) => setCustomDelta(e.target.value)}
                        aria-label={`Custom point amount for ${team.name}`}
                    />
                    <button
                        className="wth-button small"
                        disabled={safeDelta <= 0}
                        onClick={() =>
                            dispatch({
                                type: 'ADJUST_SCORE',
                                teamIndex,
                                delta: safeDelta,
                            })
                        }
                    >
                        Add
                    </button>
                    <button
                        className="wth-button ghost small"
                        disabled={safeDelta <= 0}
                        onClick={() =>
                            dispatch({
                                type: 'ADJUST_SCORE',
                                teamIndex,
                                delta: -safeDelta,
                            })
                        }
                    >
                        Deduct
                    </button>
                </div>
            </div>
        </div>
    );
}

function TriviaGame({ accountId }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [state, dispatch] = useReducer(gameReducer, initialState);

    useEffect(() => {
        if (!accountId) return;

        let cancelled = false;

        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                const id = parseInt(accountId, 10);
                if (isNaN(id)) throw new Error('Invalid account ID');

                const { data, errors } = await NerdGraphQuery.query({
                    query: `{
            actor {
              account(id: ${id}) {
                teams: nrql(query: "FROM TriviaTeam SELECT uniques(teamName) SINCE 1 week ago LIMIT MAX") {
                  results
                }
                board: nrql(query: "FROM TriviaBoard SELECT latest(prompt), latest(answer) FACET category, value SINCE 1 week ago LIMIT MAX") {
                  results
                }
              }
            }
          }`,
                });

                if (cancelled) return;
                if (errors) {
                    setError(errors.map((e) => e.message).join(', '));
                    return;
                }

                const teamResults = data.actor.account.teams.results;
                const teamNames = teamResults[0]?.['uniques.teamName'] || [];

                const boardResults = data.actor.account.board.results;
                const categoryMap = {};
                for (const row of boardResults) {
                    if (!row.facet) continue;
                    const [category, value] = row.facet;
                    if (!category) continue;
                    if (!categoryMap[category]) {
                        categoryMap[category] = { name: category, questions: [] };
                    }
                    categoryMap[category].questions.push({
                        value: parseInt(value, 10) || 0,
                        prompt: row['latest.prompt'] || '',
                        answer: row['latest.answer'] || '',
                        categoryName: category,
                        isAnswered: false,
                    });
                }

                const categories = Object.values(categoryMap);
                for (const cat of categories) {
                    cat.questions.sort((a, b) => a.value - b.value);
                }

                dispatch({
                    type: 'INIT_DATA',
                    teams:
                        teamNames.length > 0 ? teamNames : ['Team 1', 'Team 2'],
                    categories,
                });
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || 'Failed to load trivia data');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchData();
        return () => {
            cancelled = true;
        };
    }, [accountId]);

    // Timer
    useEffect(() => {
        if (
            state.phase !== 'question' ||
            !state.enableTimer ||
            state.buzzerLocked
        ) {
            return;
        }

        const interval = setInterval(() => {
            dispatch({ type: 'TICK_TIMER' });
        }, 1000);

        return () => clearInterval(interval);
    }, [state.phase, state.enableTimer, state.buzzerLocked]);

    // Keyboard shortcut: press "L" to toggle leaderboard preview during gameplay.
    useEffect(() => {
        function onKeyDown(event) {
            if (event.defaultPrevented) return;

            const targetTag = event.target?.tagName;
            if (
                targetTag === 'INPUT' ||
                targetTag === 'TEXTAREA' ||
                event.target?.isContentEditable
            ) {
                return;
            }

            if (event.key?.toLowerCase() !== 'l') return;

            if (state.leaderboardReturnPhase) {
                event.preventDefault();
                dispatch({ type: 'RETURN_FROM_LEADERBOARD' });
                return;
            }

            if (['board', 'question', 'answer'].includes(state.phase)) {
                event.preventDefault();
                dispatch({ type: 'SHOW_LEADERBOARD' });
            }
        }

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [state.phase, state.leaderboardReturnPhase]);

    const isGameMode = ['board', 'question', 'answer'].includes(state.phase);
    const canOpenJudgeScorecard = ['setup', 'board', 'question', 'answer', 'winner'].includes(
        state.phase
    );

    if (loading) {
        return (
            <div className="wth-trivia">
                <div className="wth-panel wth-center">
                    <Spinner />
                    <p>Loading trivia data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="wth-trivia">
                <div className="wth-panel">
                    <h2>Error loading data</h2>
                    <p className="muted">{error}</p>
                    <p className="muted">
                        Make sure your account has <code>TriviaTeam</code> and{' '}
                        <code>TriviaBoard</code> custom events. See README for setup
                        instructions.
                    </p>
                </div>
            </div>
        );
    }

    if (state.categories.length === 0) {
        return (
            <div className="wth-trivia">
                <div className="wth-panel">
                    <h2>No trivia data found</h2>
                    <p className="muted">
                        No <code>TriviaBoard</code> custom events were found in this
                        account. Send custom events with attributes:{' '}
                        <code>category</code>, <code>value</code>, <code>prompt</code>,{' '}
                        <code>answer</code>.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`wth-trivia ${isGameMode ? 'wth-game-mode' : ''}`}>
            <header className="wth-header">
                <div>
                    <h1 className="wth-logo-text">WTH Trivia Challenge</h1>
                    <div className="wth-controls">
                        {canOpenJudgeScorecard && state.phase !== 'judge' && (
                            <button
                                className="wth-button ghost"
                                onClick={() => dispatch({ type: 'SHOW_JUDGE_SCORECARD' })}
                            >
                                Judge Scorecard
                            </button>
                        )}
                        {isGameMode && (
                            <div className="wth-shortcut-control">
                                <button
                                    className="wth-button ghost"
                                    onClick={() => dispatch({ type: 'SHOW_LEADERBOARD' })}
                                >
                                    Leaderboard
                                </button>
                                <span className="wth-shortcut-hint">Shortcut: L</span>
                            </div>
                        )}
                        {isGameMode && (
                            <button
                                className="wth-button ghost"
                                onClick={() => dispatch({ type: 'RESET_GAME' })}
                            >
                                New Game
                            </button>
                        )}
                        {state.phase === 'board' && (
                            <button
                                className="wth-button"
                                onClick={() => dispatch({ type: 'END_GAME' })}
                            >
                                Finish Game
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <section className="wth-scoreboard">
                <h2>Teams</h2>
                <p className="muted wth-scoreboard-help">
                    Use manual controls to award or deduct competition bonus points.
                </p>
                <div className="wth-team-grid">
                    {state.teams.map((team, i) => (
                        <TeamScoreAdjuster
                            key={i}
                            team={team}
                            teamIndex={i}
                            dispatch={dispatch}
                        />
                    ))}
                </div>
            </section>

            <div className="wth-content-row">
                <div className="wth-content-main">
                    {state.phase === 'setup' && (
                        <SetupPhase state={state} dispatch={dispatch} />
                    )}
                    {state.phase === 'board' && (
                        <BoardPhase state={state} dispatch={dispatch} />
                    )}
                    {(state.phase === 'question' || state.phase === 'answer') && (
                        <QuestionPhase state={state} dispatch={dispatch} />
                    )}
                    {state.phase === 'judge' && (
                        <JudgeScorecardPhase
                            state={state}
                            dispatch={dispatch}
                            categories={JUDGE_SCORECARD_CATEGORIES}
                            scoreMultiplier={JUDGE_SCORE_MULTIPLIER}
                        />
                    )}
                    {state.phase === 'winner' && (
                        <WinnerPhase state={state} dispatch={dispatch} />
                    )}
                </div>

                {!isGameMode && (
                    <aside className="wth-video-sidebar">
                        <video
                            className="wth-video"
                            src="https://cdn.kimpel.com/ANI-Astronaut-in-field-of-flowers_crop.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                        />
                    </aside>
                )}
            </div>
        </div>
    );
}

function usePlatformTheme() {
    const [theme, setTheme] = useState(() => {
        if (typeof document === 'undefined') return 'dark';
        return document.documentElement.classList.contains('theme-dark')
            ? 'dark'
            : 'light';
    });

    useEffect(() => {
        const target = document.documentElement;
        const observer = new MutationObserver(() => {
            setTheme(
                target.classList.contains('theme-dark') ? 'dark' : 'light'
            );
        });
        observer.observe(target, {
            attributes: true,
            attributeFilter: ['class'],
        });
        return () => observer.disconnect();
    }, []);

    return theme;
}

export default function TriviaChallengeLauncher() {
    const [accountId, setAccountId] = useState(null);
    const theme = usePlatformTheme();

    return (
        <PlatformStateContext.Consumer>
            {(platformState) => {
                const activeAccountId = accountId || platformState?.accountId;

                return (
                    <div className={`wth-trivia-root wth-theme-${theme}`}>
                        <div className="wth-account-picker">
                            <AccountPicker
                                value={activeAccountId}
                                onChange={(_, value) => setAccountId(value)}
                            />
                        </div>
                        {activeAccountId ? (
                            <TriviaGame key={activeAccountId} accountId={activeAccountId} />
                        ) : (
                            <div className="wth-trivia">
                                <div className="wth-panel">
                                    <h2>Select an account</h2>
                                    <p className="muted">
                                        Choose a New Relic account that contains{' '}
                                        <code>TriviaTeam</code> and <code>TriviaBoard</code> custom
                                        events.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                );
            }}
        </PlatformStateContext.Consumer>
    );
}
