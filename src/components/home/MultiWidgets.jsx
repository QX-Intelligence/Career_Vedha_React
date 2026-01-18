import React from 'react';
import { mockSuccessStories, mockJobAlerts, mockVideos } from '../../utils/mockData';

const MultiWidgets = () => {
    return (
        <section className="multi-widgets">
            <div className="container">
                <div className="widgets-grid">
                    {/* Success Stories */}
                    <div className="widget-column">
                        <h3 className="column-title">Success Stories</h3>
                        <div className="widget-content">
                            {mockSuccessStories.map((story) => (
                                <article key={story.id} className="widget-item">
                                    <img src={story.image} alt={story.name} />
                                    <div className="item-info">
                                        <h4>{story.name}</h4>
                                        <p>{story.achievement}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                        <a href="#" className="view-all">
                            View All <i className="fas fa-chevron-right"></i>
                        </a>
                    </div>

                    {/* Job Alerts */}
                    <div className="widget-column">
                        <h3 className="column-title">Job Alerts</h3>
                        <div className="widget-content">
                            {mockJobAlerts.map((job) => (
                                <article key={job.id} className="widget-item">
                                    <div className="job-icon">
                                        <i className="fas fa-building"></i>
                                    </div>
                                    <div className="item-info">
                                        <h4>{job.title}</h4>
                                        <p>{job.description}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                        <a href="#" className="view-all">
                            View All <i className="fas fa-chevron-right"></i>
                        </a>
                    </div>

                    {/* Guidance Videos */}
                    <div className="widget-column">
                        <h3 className="column-title">Guidance Videos</h3>
                        <div className="widget-content">
                            {mockVideos.map((video) => (
                                <article key={video.id} className="widget-item">
                                    <img src={video.thumbnail} alt={video.title} />
                                    <div className="item-info">
                                        <h4>{video.title}</h4>
                                        <p><i className="fas fa-play-circle"></i> {video.duration}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                        <a href="#" className="view-all">
                            View All <i className="fas fa-chevron-right"></i>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MultiWidgets;
