/**
 * Utility function to check if an article should be visible to the public
 * based on its published_at timestamp
 */

export const isArticlePublished = (article) => {
    if (!article) return false;
    
    // If status is present and NOT PUBLISHED, don't show it.
    // In public feeds, the status field might be omitted entirely.
    if (article.status && article.status !== 'PUBLISHED') return false;
    
    // If no published_at date, it's published immediately
    if (!article.published_at) return true;
    
    // Check if the published_at time has passed (with 5 min buffer for clock skew)
    let publishDate = new Date(article.published_at);
    
    // Handle SQL-like timestamps (YYYY-MM-DD HH:MM:SS) which might fail strict parsing
    if (isNaN(publishDate.getTime()) && typeof article.published_at === 'string') {
        publishDate = new Date(article.published_at.replace(' ', 'T'));
    }

    const now = new Date();
    // Allow articles published up to 5 minutes in the future
    const adjustedNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    // If still invalid, assume it's valid to likely show it (or hide it? hiding safely)
    if (isNaN(publishDate.getTime())) {
        console.warn('[ArticleUtils] Invalid date format for:', article.title, article.published_at);
        return false;
    }

    return publishDate <= adjustedNow;
};

/**
 * Filter an array of articles to only show published ones
 */
export const filterPublishedArticles = (articles) => {
    if (!Array.isArray(articles)) return [];
    return articles.filter(isArticlePublished);
};

/**
 * Check if an article is scheduled for future publication
 */
export const isArticleScheduled = (article) => {
    if (!article) return false;
    if (article.status !== 'PUBLISHED') return false;
    if (!article.published_at) return false;
    
    const publishDate = new Date(article.published_at);
    const now = new Date();
    
    return publishDate > now;
};
