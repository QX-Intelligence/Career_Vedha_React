import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import inventoryApi from '../../api/inventoryApi';
import { useSnackbar } from '../../../../context/SnackbarContext';

const AdminOverview = () => {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const [activeTab, setActiveTab] = useState('DASHBOARD'); // DASHBOARD, SETTINGS
    const [stats, setStats] = useState({
        revenue: 0,
        totalBooks: 0,
        totalOrders: 0,
        pendingOrders: 0,
        recentOrders: [],
        lowStockBooks: []
    });
    const [gstData, setGstData] = useState([]);
    const [newGst, setNewGst] = useState('');
    const [loading, setLoading] = useState(true);
    const [isGstUpdating, setIsGstUpdating] = useState(false);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Total Revenue
            const revRes = await inventoryApi.get('admin/orders/revenue');
            const revenue = revRes.data?.totalRevenue || 0;

            // 2. Fetch All Books (Active + Inactive)
            const [activeBooksRes, inactiveBooksRes] = await Promise.all([
                inventoryApi.get('books'),
                inventoryApi.get('admin/ebooks/inactive')
            ]);
            
            const activeBooks = activeBooksRes.data || [];
            const inactiveBooks = inactiveBooksRes.data || [];
            const allBooks = [...activeBooks, ...inactiveBooks];
            
            const totalBooks = allBooks.length;
            const lowStockBooks = allBooks.filter(b => b.availableQuantity < 10);

            // 3. Fetch All Orders to calculate stats
            const ordersRes = await inventoryApi.get('admin/orders/get/all/orders/admin');
            const allOrders = ordersRes.data || [];
            const totalOrders = allOrders.length;
            const pendingOrders = allOrders.filter(o => o.status === 'PENDING').length;
            const recentOrders = allOrders.slice(0, 5); // Latest 5

            // 4. Fetch GST Data
            const gstRes = await inventoryApi.get('admin/gst');
            setGstData(gstRes.data || []);

            setStats({
                revenue,
                totalBooks,
                totalOrders,
                pendingOrders,
                recentOrders,
                lowStockBooks
            });
        } catch (err) {
            console.error("Failed to fetch admin overview data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleUpdateGst = async (e) => {
        e.preventDefault();
        if (!newGst) return;
        setIsGstUpdating(true);
        try {
            // Check if we already have a GST entry (to update) or need to add a new one
            if (gstData.length > 0) {
                await inventoryApi.put(`admin/gst/${gstData[0].id}?percentage=${newGst}`);
            } else {
                await inventoryApi.post(`admin/gst?percentage=${newGst}`);
            }
            showSnackbar("GST Percentage updated successfully", "success");
            const res = await inventoryApi.get('admin/gst');
            setGstData(res.data || []);
            setNewGst('');
        } catch (err) {
            console.error("Failed to update GST", err);
            showSnackbar("Failed to update GST", "error");
        } finally {
            setIsGstUpdating(false);
        }
    };

    if (loading) return (
        <div className="um-loading">
            <div className="um-spinner"></div>
            <p>Gathering store intelligence...</p>
        </div>
    );

    return (
        <div className="admin-overview-container">
            <div className="um-header">
                <div className="um-header-content">
                    <div className="um-title-section">
                        <h1 className="um-title">
                            <i className="fas fa-chart-line"></i>
                            E-Store Command Center
                        </h1>
                        <p className="um-subtitle">Real-time overview of your store's sales and inventory</p>
                    </div>
                    <div className="um-header-actions">
                        <div className="um-tabs compact" style={{ marginRight: '1rem' }}>
                            <button 
                                className={`um-tab ${activeTab === 'DASHBOARD' ? 'active' : ''}`}
                                onClick={() => setActiveTab('DASHBOARD')}
                            >
                                Dashboard
                            </button>
                            <button 
                                className={`um-tab ${activeTab === 'SETTINGS' ? 'active' : ''}`}
                                onClick={() => setActiveTab('SETTINGS')}
                            >
                                Settings
                            </button>
                        </div>
                        <button className="um-btn-save" onClick={() => navigate('/cms/e-store/books')}>
                            <i className="fas fa-plus"></i> Add Inventory
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'DASHBOARD' ? (
                <>
                    {/* Metric Cards */}
                    <div className="um-stats-grid">
                        <div className="um-stat-card premium-gold">
                            <div className="um-stat-icon">
                                <i className="fas fa-rupee-sign"></i>
                            </div>
                            <div className="um-stat-info">
                                <span className="um-stat-label">Total Revenue</span>
                                <span className="um-stat-value">₹{stats.revenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <div className="um-stat-card">
                            <div className="um-stat-icon">
                                <i className="fas fa-book"></i>
                            </div>
                            <div className="um-stat-info">
                                <span className="um-stat-label">Catalog Size</span>
                                <span className="um-stat-value">{stats.totalBooks} <small style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748B' }}>Books</small></span>
                            </div>
                        </div>

                        <div className="um-stat-card">
                            <div className="um-stat-icon">
                                <i className="fas fa-shopping-bag"></i>
                            </div>
                            <div className="um-stat-info">
                                <span className="um-stat-label">Total Orders</span>
                                <span className="um-stat-value">{stats.totalOrders}</span>
                            </div>
                        </div>

                        <div className="um-stat-card highlight-warning">
                            <div className="um-stat-icon">
                                <i className="fas fa-exclamation-triangle"></i>
                            </div>
                            <div className="um-stat-info">
                                <span className="um-stat-label">Low Stock items</span>
                                <span className="um-stat-value" style={{ color: stats.lowStockBooks.length > 0 ? '#ef4444' : 'inherit' }}>
                                    {stats.lowStockBooks.length}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="um-dashboard-grid">
                        {/* Recent Orders Section */}
                        <div className="um-dashboard-section" style={{ flex: 2 }}>
                            <div className="um-section-header">
                                <h3 className="um-section-title">Recent Activity</h3>
                                <button className="um-btn-text" onClick={() => navigate('/cms/e-store/orders')}>View All Orders <i className="fas fa-arrow-right"></i></button>
                            </div>
                            <div className="um-table-container">
                                <table className="um-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Customer</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.recentOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                                                    <i className="fas fa-receipt" style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem', opacity: 0.3 }}></i>
                                                    No recent orders found
                                                </td>
                                            </tr>
                                        ) : (
                                            stats.recentOrders.map((order) => (
                                                <tr key={order.orderId} className="um-table-row" onClick={() => navigate('/cms/e-store/orders')} style={{ cursor: 'pointer' }}>
                                                    <td style={{ fontWeight: 700 }}>#CV-{order.orderId}</td>
                                                    <td style={{ fontSize: '0.85rem' }}>{order.userEmail.split('@')[0]}...</td>
                                                    <td style={{ fontWeight: 600 }}>₹{order.totalAmount}</td>
                                                    <td>
                                                        <span className={`um-status-badge ${order.status.toLowerCase()}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Quick Actions / Stock Warnings */}
                        <div className="um-dashboard-section" style={{ flex: 1 }}>
                            {stats.lowStockBooks.length > 0 ? (
                                <div style={{ marginBottom: '2rem' }}>
                                    <div className="um-section-header">
                                        <h3 className="um-section-title" style={{ color: '#ef4444' }}>Stock Alerts</h3>
                                    </div>
                                    <div className="um-quick-actions">
                                        {stats.lowStockBooks.slice(0, 3).map(book => (
                                            <div key={book.bookId} className="um-info-card" style={{ borderLeftColor: '#ef4444' }}>
                                                <p style={{ fontWeight: 800, color: 'var(--slate-900)' }}>{book.bookName}</p>
                                                <p>Available: <span style={{ color: '#ef4444', fontWeight: 700 }}>{book.availableQuantity} left</span></p>
                                            </div>
                                        ))}
                                        {stats.lowStockBooks.length > 3 && (
                                            <p className="um-item-subtext" style={{ textAlign: 'center' }}>+ {stats.lowStockBooks.length - 3} more low stock items</p>
                                        )}
                                        <button className="um-btn-text" onClick={() => navigate('/cms/e-store/books')} style={{ marginTop: '0.5rem' }}>Update Stock <i className="fas fa-boxes"></i></button>
                                    </div>
                                </div>
                            ) : null}

                            <div className="um-section-header">
                                <h3 className="um-section-title">Quick Actions</h3>
                            </div>
                            <div className="um-quick-actions">
                                <button className="um-action-card" onClick={() => navigate('/cms/e-store/books')}>
                                    <i className="fas fa-boxes"></i>
                                    <span>Manage Inventory</span>
                                </button>
                                <button className="um-action-card" onClick={() => navigate('/cms/e-store/orders')}>
                                    <i className="fas fa-clipboard-list"></i>
                                    <span>Process Orders</span>
                                </button>
                                <div className="um-info-card">
                                    <i className="fas fa-info-circle"></i>
                                    <p>Changes made to the inventory reflect instantly on the public Career Vedha E-Store.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="um-dashboard-section" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div className="um-section-header">
                        <h3 className="um-section-title">Store Settings</h3>
                    </div>
                    
                    <div className="um-form-group">
                        <label className="um-label">Current GST Percentage</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                                {gstData.length > 0 ? gstData[0].percentage : '0'}%
                            </div>
                            <span className="um-status-badge active">Active</span>
                        </div>
                        <p className="um-item-subtext" style={{ marginTop: '0.5rem' }}>This GST rate is applied to all calculated order totals during checkout.</p>
                    </div>

                    <form onSubmit={handleUpdateGst} style={{ marginTop: '2.5rem', borderTop: '1px solid var(--slate-100)', paddingTop: '2rem' }}>
                        <div className="um-form-group">
                            <label className="um-label">Update GST Percentage</label>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <input 
                                    type="number" 
                                    className="um-input" 
                                    placeholder="Enter new percentage (e.g. 18)"
                                    value={newGst}
                                    onChange={(e) => setNewGst(e.target.value)}
                                    required
                                />
                                <button 
                                    type="submit" 
                                    className="um-btn-save" 
                                    disabled={isGstUpdating}
                                    style={{ whiteSpace: 'nowrap' }}
                                >
                                    {isGstUpdating ? 'Updating...' : 'Apply Rate'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AdminOverview;
