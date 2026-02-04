
import os

filepath = os.path.join("src", "modules", "articles", "pages", "ArticleManagement.jsx")

if not os.path.exists(filepath):
    print(f"File not found: {filepath}")
    exit(1)

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Target Block to Replace (The existing Title Cell Content)
# We look for the start of the Title Div and the end of the Links Div.
# Start: <div style={{ fontWeight: '600', color: 'var(--slate-900)' }}>
# End: </div> (closing links div)
# We will use a larger block to be safe.

target_start = """                                                    <div style={{ fontWeight: '600', color: 'var(--slate-900)' }}>
                                                        {(() => {
                                                            const tr = article.translations?.find(t => t.language === (activeLanguage === 'telugu' ? 'te' : 'en')) || article.translations?.[0];
                                                            return tr?.title || article.title || 'Untitled Article';
                                                        })()}
                                                    </div>"""

# Construction of the new block
new_block = """                                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                        <div style={{
                                                            width: '80px', height: '60px', borderRadius: '8px', padding: '6px',
                                                            background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)',
                                                            border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column',
                                                            justifyContent: 'center', alignItems: 'center', textAlign: 'center', overflow: 'hidden', flexShrink: 0
                                                        }}>
                                                            <div style={{ 
                                                                fontSize: '0.6rem', fontWeight: '700', color: '#475569', lineHeight: '1.2',
                                                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '4px'
                                                            }}>
                                                                {(() => {
                                                                    const tr = article.translations?.find(t => t.language === (activeLanguage === 'telugu' ? 'te' : 'en')) || article.translations?.[0];
                                                                    return tr?.title || article.title || article.slug;
                                                                })()}
                                                            </div>
                                                            {article.section && (
                                                                <div style={{ fontSize: '0.5rem', textTransform: 'uppercase', background: 'var(--slate-900)', color: 'white', padding: '1px 4px', borderRadius: '3px', lineHeight: '1' }}>
                                                                    {article.section}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '600', color: 'var(--slate-900)' }}>
                                                                {(() => {
                                                                    const tr = article.translations?.find(t => t.language === (activeLanguage === 'telugu' ? 'te' : 'en')) || article.translations?.[0];
                                                                    return tr?.title || article.title || 'Untitled Article';
                                                                })()}
                                                            </div>"""

# We also need to close the extra divs at the end of the cell.
# The original code ends the cell with the closing of the links div.
# We need to append the closing of our new wrapper divs.

# We will target the closing of the links div.
# But simply replacing the start block is easier if we leave the end alone?
# No, we opened a NEW div wrapper, we MUST close it.
# So we must also replace the end.

# Replacement Strategy:
# Replace the START block first.
# Then Replace the END block.

if target_start in content:
    content = content.replace(target_start, new_block)
    print("Start block replaced.")
else:
    print("Start block NOT found.")
    # Debug: print what we are looking for vs what might be there?
    # Normalize spaces?
    pass

# End block target:
# The closing of the links div followed by the closing of the td.
target_end = """                                                        {article.features && article.features.length > 0 && article.features.map((feat, idx) => (
                                                            <span key={idx} style={{
                                                                fontSize: '0.65rem',
                                                                background: '#fff1f2',
                                                                color: '#e11d48',
                                                                padding: '1px 6px',
                                                                borderRadius: '4px',
                                                                fontWeight: '700',
                                                                border: '1px solid #fecaca',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}>
                                                                <i className="fas fa-thumbtack" style={{ fontSize: '0.6rem' }}></i> {feat.feature_type}
                                                                {feat.section && <span style={{ opacity: 0.7, fontWeight: '400' }}>({feat.section})</span>}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>"""

new_end = """                                                        {article.features && article.features.length > 0 && article.features.map((feat, idx) => (
                                                            <span key={idx} style={{
                                                                fontSize: '0.65rem',
                                                                background: '#fff1f2',
                                                                color: '#e11d48',
                                                                padding: '1px 6px',
                                                                borderRadius: '4px',
                                                                fontWeight: '700',
                                                                border: '1px solid #fecaca',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}>
                                                                <i className="fas fa-thumbtack" style={{ fontSize: '0.6rem' }}></i> {feat.feature_type}
                                                                {feat.section && <span style={{ opacity: 0.7, fontWeight: '400' }}>({feat.section})</span>}
                                                            </span>
                                                        ))}
                                                    </div>
                                                        </div>
                                                    </div>
                                                </td>"""

if target_end in content:
    content = content.replace(target_end, new_end)
    print("End block replaced.")
else:
    print("End block NOT found.")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
