import React, { useState } from 'react';
import CustomSelect from '../../../components/ui/CustomSelect';
import { useSnackbar } from '../../../context/SnackbarContext';
import { 
    useActiveRoles, 
    useInactiveRoles, 
    useCreateRole, 
    useActivateRole, 
    useInactivateRole 
} from '../../../hooks/useAccessControl';
import '../../../styles/Dashboard.css'; // Utilizing existing dashboard styles
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Skeleton, { SkeletonChart } from '../../../components/ui/Skeleton';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const RoleManagement = () => {
    const { showSnackbar } = useSnackbar();

    // Data Hooks
    const { data: roles = [], isLoading: loadingActive } = useActiveRoles();
    const { data: inactiveRoles = [], isLoading: loadingInactive } = useInactiveRoles();

    // Mutations
    const createRoleMutation = useCreateRole();
    const activateRoleMutation = useActivateRole();
    const inactivateRoleMutation = useInactivateRole();

    // Local State
    const [roleInput, setRoleInput] = useState('');
    
    // Modal State for Confirmations
    const [deleteModal, setDeleteModal] = useState(false);
    const [targetRole, setTargetRole] = useState(null);
    const [actionType, setActionType] = useState(null); // 'inactivate' or 'activate'

    /* ================= HANDLERS ================= */
    const handleCreateRole = async () => {
        if (!roleInput) return showSnackbar("Please enter a role name", "warning");
        
        try {
            await createRoleMutation.mutateAsync(roleInput);
            setRoleInput('');
            showSnackbar('Role created successfully', 'success');
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Failed to create role', 'error');
        }
    };

    const handleActionConfirm = async () => {
        if (!targetRole) return;

        try {
            if (actionType === 'inactivate') {
                await inactivateRoleMutation.mutateAsync(targetRole);
                showSnackbar('Role inactivated successfully', 'success');
            } else {
                await activateRoleMutation.mutateAsync(targetRole);
                showSnackbar('Role reactivated successfully', 'success');
            }
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Action failed', 'error');
        } finally {
            setDeleteModal(false);
            setTargetRole(null);
        }
    };

    const openConfirmModal = (type, role) => {
        if (!role) return;
        setActionType(type);
        setTargetRole(role);
        setDeleteModal(true);
    };

    return (
        <div className="section-fade-in">
            <div className="page-header-row">
                <div>
                    <h1>Role Control</h1>
                    <p className="subtitle">Manage system access levels and role definitions.</p>
                </div>
            </div>

            <div className="dashboard-section">
                <div className="management-grid-refined">
                    {/* Create Role Card */}
                    <div className="m-card">
                        <div className="m-card-title">Create New Role</div>
                        <div className="m-card-body">
                            <div className="m-input-group">
                                <label>Role Name</label>
                                <div className="input-with-icon">
                                    <i className="fas fa-user-shield"></i>
                                    <input 
                                        placeholder="e.g. EDITOR" 
                                        value={roleInput} 
                                        onChange={e => setRoleInput(e.target.value)} 
                                    />
                                </div>
                                <button 
                                    onClick={handleCreateRole} 
                                    className="m-btn-primary"
                                    disabled={createRoleMutation.isPending}
                                >
                                    {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Inactivate Role Card */}
                    <div className="m-card danger-zone">
                        <div className="m-card-title">Inactivate Role</div>
                        <div className="m-card-body">
                            <div className="m-input-group">
                                <CustomSelect
                                    label="Inactivate Role"
                                    value=""
                                    options={roles}
                                    onChange={(val) => openConfirmModal('inactivate', val)}
                                    placeholder="Select role to inactivate..."
                                    icon="fas fa-ban"
                                />
                            </div>
                            <p className="danger-hint">Inactivating a role prevents new users from signing up with it.</p>
                        </div>
                    </div>

                    {/* Reactivate Role Card */}
                    <div className="m-card success-zone">
                        <div className="m-card-title">Reactivate Role</div>
                        <div className="m-card-body">
                            <div className="m-input-group">
                                <CustomSelect
                                    label="Select Role"
                                    value=""
                                    options={inactiveRoles}
                                    onChange={(val) => openConfirmModal('activate', val)}
                                    placeholder="Select role to reactivate..."
                                    icon="fas fa-redo"
                                />
                                <p className="hint-text">Reactivating allows users to sign up with this role again.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Role Distribution Chart */}
            <div className="dashboard-section" style={{ marginTop: '2rem' }}>
                <div className="section-title-row" style={{ marginBottom: '1.5rem' }}>
                    <h3><i className="fas fa-chart-bar"></i> Role Distribution</h3>
                </div>
                <div className="stat-card no-hover-transform" style={{ display: 'block', padding: '2rem' }}>
                    <div style={{ height: '300px' }}>
                        {loadingActive || loadingInactive ? (
                            <SkeletonChart variant="bar" height="250px" />
                        ) : (
                            <Bar 
                                data={{
                                    labels: ['Active Roles', 'Inactive Roles'],
                                    datasets: [{
                                        label: 'Role Count',
                                        data: [roles.length, inactiveRoles.length],
                                        backgroundColor: ['#10b981', '#ef4444'],
                                        borderColor: ['#059669', '#dc2626'],
                                        borderWidth: 1,
                                        borderRadius: 8
                                    }]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            enabled: true,
                                            backgroundColor: '#0f172a',
                                            padding: 12,
                                            titleFont: { size: 14, weight: '700' },
                                            bodyFont: { size: 13 },
                                            borderColor: '#facc15',
                                            borderWidth: 1,
                                            callbacks: {
                                                label: function(context) {
                                                    return context.dataset.label + ': ' + context.parsed.y + ' roles';
                                                }
                                            }
                                        },
                                        title: {
                                            display: true,
                                            text: 'System Role Status Overview',
                                            font: { size: 16, weight: '600' },
                                            color: '#334155',
                                            padding: { bottom: 20 }
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                color: '#64748b',
                                                font: { size: 12 },
                                                stepSize: 1
                                            },
                                            grid: {
                                                color: '#f1f5f9'
                                            }
                                        },
                                        x: {
                                            ticks: {
                                                color: '#334155',
                                                font: { size: 13, weight: '600' }
                                            },
                                            grid: {
                                                display: false
                                            }
                                        }
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {deleteModal && (
                <div className="modal-overlay-refined">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Confirm Action</h3>
                            <button className="close-btn" onClick={() => setDeleteModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>
                                Are you sure you want to <strong>{actionType}</strong> the role <strong>{targetRole}</strong>?
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setDeleteModal(false)}>Cancel</button>
                            <button 
                                className={actionType === 'inactivate' ? "reject-btn-fancy" : "approve-btn-fancy"} 
                                onClick={handleActionConfirm}
                                disabled={activateRoleMutation.isPending || inactivateRoleMutation.isPending}
                            >
                                {activateRoleMutation.isPending || inactivateRoleMutation.isPending ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleManagement;
