import React from 'react';
import { Link } from 'react-router-dom';

const HeroIntro = () => {
    const slides = [
        {
            id: 1,
            title: "Boost Your Exam Preparation",
            subtitle: "Comprehensive study materials and quizzes for all competitive exams.",
            ctaText: "Start Learning",
            link: "/academic-exams",
            image: "/hero_illustration.png", // Keeping the existing one for Exams
            color: "var(--primary-yellow)",
            icon: "fas fa-graduation-cap"
        },
        {
            id: 2,
            title: "Latest Educational News",
            subtitle: "Stay updated with the most recent notifications and educational announcements.",
            ctaText: "Read News",
            link: "/news",
            image: "/assets/hero_news.png", // New generated image
            color: "#e11d48",
            icon: "fas fa-newspaper"
        },
        {
            id: 3,
            title: "Find Your Dream Job",
            subtitle: "Explore thousands of government and private job opportunities updated daily.",
            ctaText: "Browse Jobs",
            link: "/jobs",
            image: "/assets/hero_jobs.png", // New generated image
            color: "#0891b2",
            icon: "fas fa-briefcase"
        },
        {
            id: 4,
            title: "Academic Resources",
            subtitle: "Syllabus, previous papers, and study guides for schools and colleges.",
            ctaText: "Explore Resources",
            link: "/question-papers",
            image: "/assets/hero_academics.png", // New generated image
            color: "#7c3aed",
            icon: "fas fa-book-reader"
        }
    ];

    const [currentSlide, setCurrentSlide] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000); // 5 seconds per slide
        return () => clearInterval(interval);
    }, [slides.length]);

    const handleDotClick = (index) => {
        setCurrentSlide(index);
    };

    return (
        <section className="hero-intro-section">
            <div className="container">
                <div className="hero-carousel">
                    {slides.map((slide, index) => (
                        <div 
                            key={slide.id} 
                            className={`hero-intro-content slide ${index === currentSlide ? 'active' : ''}`}
                            style={{ display: index === currentSlide ? 'flex' : 'none' }}
                        >
                            <div className="hero-text-side">
                                <span className="slide-tag" style={{ color: slide.color, background: `${slide.color}15` }}>
                                    <i className={slide.icon}></i> {slide.title.split(' ')[0]} Focus
                                </span>
                                <h1>{slide.title}</h1>
                                <p>{slide.subtitle}</p>
                                <Link to={slide.link} className="get-started-btn" style={{ background: slide.color === 'var(--primary-yellow)' ? null : slide.color, boxShadow: slide.color === 'var(--primary-yellow)' ? null : `0 10px 25px -5px ${slide.color}66`, color: slide.color === 'var(--primary-yellow)' ? null : '#fff' }}>
                                    {slide.ctaText}
                                </Link>
                            </div>
                            <div className="hero-img-side">
                                <div className="hero-image-glow" style={{ background: slide.color }}></div>
                                <img 
                                    src={slide.image} 
                                    alt={slide.title} 
                                    onError={(e) => {
                                        // Fallback logic if needed, or just hide
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                    
                    <div className="hero-background-decorations">
                        <i className="fas fa-book-open decor-icon decor-1"></i>
                        <i className="fas fa-graduation-cap decor-icon decor-2"></i>
                        <i className="fas fa-pen-nib decor-icon decor-3"></i>
                        <i className="fas fa-university decor-icon decor-4"></i>
                        <i className="fas fa-brain decor-icon decor-5"></i>
                        <i className="fas fa-award decor-icon decor-6"></i>
                    </div>
                    
                    <div className="carousel-dots">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                className={`dot ${index === currentSlide ? 'active' : ''}`}
                                onClick={() => handleDotClick(index)}
                                aria-label={`Go to slide ${index + 1}`}
                            ></button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroIntro;
