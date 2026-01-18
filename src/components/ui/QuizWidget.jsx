import React from 'react';

const QuizWidget = () => {
    const handleQuizClick = () => {
        alert('Quiz feature coming soon! Stay tuned for daily quizzes to test your knowledge.');
    };

    return (
        <div className="sidebar-widget quiz-widget">
            <h3 className="widget-title">Daily Quiz</h3>
            <p>Test your knowledge</p>
            <a
                href="#"
                className="quiz-btn"
                onClick={(e) => {
                    e.preventDefault();
                    handleQuizClick();
                }}
            >
                Take Quiz Now
            </a>
        </div>
    );
};

export default QuizWidget;
