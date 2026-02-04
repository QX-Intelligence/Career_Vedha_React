import React, { useMemo, useCallback } from 'react';
import Tree from 'react-d3-tree';
import './TaxonomyTreeView.css';

const NODE_WIDTH = 240;
const NODE_HEIGHT = 140;

const renderLuxuryNode = ({ nodeDatum, toggleNode, onEdit, onToggleStatus }) => {
    const isActive = nodeDatum.attributes?.is_active !== false;
    
    return (
        <foreignObject width={NODE_WIDTH + 40} height={NODE_HEIGHT + 40} x={-NODE_WIDTH / 2} y={-40}>
            <div className={`node-card-premium ${isActive ? 'active' : 'disabled'}`} onClick={toggleNode}>
                <div className="node-accent-bar"></div>
                <div className="node-header">
                    <span className="node-id-pill">#{nodeDatum.attributes?.id}</span>
                    <div className="node-status-dot"></div>
                </div>
                
                <div className="node-main">
                    <div className="node-icon">
                        <i className={`fas fa-${nodeDatum.children?.length ? 'folder-open' : 'folder'}`}></i>
                    </div>
                    <div className="node-info">
                        <div className="node-name-premium">{nodeDatum.name}</div>
                        <div className="node-slug-premium">{nodeDatum.attributes?.slug}</div>
                    </div>
                </div>

                <div className="node-footer-premium">
                    <button 
                        className="node-action-btn-p" 
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit({
                                id: nodeDatum.attributes?.id,
                                name: nodeDatum.name,
                                slug: nodeDatum.attributes?.slug,
                                section: nodeDatum.attributes?.section,
                                parent_id: nodeDatum.attributes?.parent_id,
                                rank: nodeDatum.attributes?.rank,
                                is_active: isActive
                            });
                        }} 
                        title="Edit Category"
                    >
                        <i className="fas fa-edit"></i>
                    </button>
                    <button 
                        className={`node-action-btn-p ${isActive ? 'disable' : 'enable'}`} 
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleStatus({
                                id: nodeDatum.attributes?.id,
                                is_active: isActive
                            });
                        }} 
                        title={isActive ? 'Disable' : 'Enable'}
                    >
                        <i className={`fas fa-${isActive ? 'eye-slash' : 'eye'}`}></i>
                    </button>
                </div>
            </div>
        </foreignObject>
    );
};

const TaxonomyTreeView = ({ data, onEdit, onToggleStatus }) => {
    // Transform original hierarchy into D3-tree format
    const treeData = useMemo(() => {
        if (!data || data.length === 0) return null;

        const transform = (node) => ({
            name: node.name,
            attributes: {
                id: node.id,
                slug: node.slug,
                is_active: node.is_active,
                section: node.section,
                parent_id: node.parent_id,
                rank: node.rank
            },
            children: (node.children || []).map(transform)
        });

        // If multiple roots, wrap them in a virtual root or just take the first
        // Usually, one section has multiple root categories.
        if (data.length > 1) {
            return {
                name: "Section Root",
                attributes: { id: 'root', is_active: true, slug: 'root' },
                children: data.map(transform)
            };
        }
        
        return transform(data[0]);
    }, [data]);

    const nodeSize = { x: 300, y: 250 };
    const translate = { x: 500, y: 50 };

    if (!treeData) {
        return (
            <div className="tree-empty-premium">
                <i className="fas fa-sitemap"></i>
                <p>No hierarchy data available to visualize</p>
            </div>
        );
    }

    return (
        <div className="tree-viewport-container">
            <Tree
                data={treeData}
                nodeSize={nodeSize}
                translate={translate}
                orientation="vertical"
                pathFunc="diagonal" // Smooth curved paths
                renderCustomNodeElement={(rd3tProps) => 
                    renderLuxuryNode({ ...rd3tProps, onEdit, onToggleStatus })
                }
                separation={{ siblings: 1.2, nonSiblings: 2 }}
                pathClassNames="tree-connector-path-premium"
                enableLegacyTransitions={true}
                transitionDuration={500}
                zoom={0.7}
            />
        </div>
    );
};

export default TaxonomyTreeView;
