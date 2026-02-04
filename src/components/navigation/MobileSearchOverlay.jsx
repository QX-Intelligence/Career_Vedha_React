import React, { useState } from 'react';
import { X, Search as SearchIcon, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MobileSearchOverlay = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      // Implement navigation to search results page or filter
      console.log('Searching for:', query);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="search-overlay"
        >
          <div className="search-header">
            <form onSubmit={handleSearch} className="search-form">
              <SearchIcon size={20} className="search-icon" />
              <input 
                autoFocus
                type="text" 
                placeholder="Search articles, exams, jobs..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button type="submit" className="submit-btn">
                  <ArrowRight size={20} />
                </button>
              )}
            </form>
            <button onClick={onClose} className="close-btn">
              <X size={24} />
            </button>
          </div>

          <div className="search-suggestions">
            <h4>Quick Links</h4>
            <div className="suggestion-tags">
              <span>Latest Exams</span>
              <span>Job News</span>
              <span>Study Material</span>
              <span>Results</span>
            </div>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileSearchOverlay;
