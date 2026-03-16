import React from 'react';

const ARC_STEP = 0.18;

export default function BoardPhase({ state, dispatch }) {
    const { categories } = state;
    const catCount = categories.length;

    return (
        <section className="wth-board">
            <div className="wth-orbit">
                <div className="wth-orbit-hub">
                    Trivia<br />Challenge
                </div>

                {categories.map((category, catIdx) => {
                    const baseAngle =
                        (2.0 * Math.PI * catIdx) / catCount - Math.PI / 2;
                    const qCount = category.questions.length;

                    return (
                        <React.Fragment key={catIdx}>
                            {category.questions.map((question, qIdx) => {
                                const offset = (qIdx - (qCount - 1) / 2.0) * ARC_STEP;
                                const angle = baseAngle + offset;
                                const rx = 15.0 + qIdx * 5.5;
                                const ry = 12.0 + qIdx * 5.0;
                                const px = 50.0 + rx * Math.cos(angle);
                                const py = 50.0 + ry * Math.sin(angle);

                                return (
                                    <button
                                        key={qIdx}
                                        className="wth-orbit-tile"
                                        style={{ left: `${px.toFixed(2)}%`, top: `${py.toFixed(2)}%` }}
                                        disabled={question.isAnswered}
                                        onClick={() =>
                                            dispatch({
                                                type: 'SELECT_QUESTION',
                                                categoryIndex: catIdx,
                                                questionIndex: qIdx,
                                            })
                                        }
                                    >
                                        {question.isAnswered ? (
                                            <span className="wth-orbit-tile-used">&#10003;</span>
                                        ) : (
                                            <span className="wth-orbit-tile-value">
                                                ${question.value}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}

                            {(() => {
                                const lx = 50.0 + 40.0 * Math.cos(baseAngle);
                                const ly = 50.0 + 35.0 * Math.sin(baseAngle);
                                return (
                                    <span
                                        className="wth-orbit-label"
                                        style={{ left: `${lx.toFixed(2)}%`, top: `${ly.toFixed(2)}%` }}
                                    >
                                        {category.name}
                                    </span>
                                );
                            })()}
                        </React.Fragment>
                    );
                })}
            </div>
        </section>
    );
}
