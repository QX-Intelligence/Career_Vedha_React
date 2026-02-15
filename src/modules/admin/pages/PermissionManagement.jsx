import React, { useState } from 'react';
import CustomSelect from '../../../components/ui/CustomSelect';
import { useSnackbar } from '../../../context/SnackbarContext';
import { 
    usePermissions, 
    useActiveRoles, 
    useCreatePermission, 
    useDeletePermission, 
    useAssignPermission, 
    useRemovePermission 
} from '../../../hooks/useAccessControl';
import '../../../styles/Dashboard.css';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Skeleton, { SkeletonChart } from '../../../components/ui/Skeleton';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PermissionManagement = () => {
    const { showSnackbar } = useSnackbar();

    // Data Hooks
    const { data: permissions = [], isLoading: loadingPermissions } = usePermissions();
    const { data: roles = [], isLoading: loadingRoles } = useActiveRoles();

    // Mutations
    const createPermissionMutation = useCreatePermission();
    const deletePermissionMutation = useDeletePermission();
    const assignPermissionMutation = useAssignPermission();
    const removePermissionMutation = useRemovePermission();

    // Local State
    const [permissionInput, setPermissionInput] = useState('');
    const [assignRole, setAssignRole] = useState('');
    const [assignPermission, setAssignPermission] = useState('');

    // Modal State
    const [deleteModal, setDeleteModal] = useState(false);
    const [targetPermission, setTargetPermission] = useState(null);

    /* ================= HANDLERS ================= */
    const handleCreatePermission = async () => {
        if (!permissionInput) return showSnackbar("Please enter a permission name", "warning");
        
        try {
            await createPermissionMutation.mutateAsync(permissionInput);
            setPermissionInput('');
            showSnackbar('Permission created successfully', 'success');
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Failed to create permission', 'error');
        }
    };

    const handleAssignPermission = async () => {
        if (!assignRole || !assignPermission) return showSnackbar("Please select both role and permission", "warning");
        
        try {
            await assignPermissionMutation.mutateAsync({ roleName: assignRole, permissionName: assignPermission });
            showSnackbar('Permission added successfully', 'success');
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Failed to add permission', 'error');
        }
    };

    const handleRemovePermission = async () => {
        if (!assignRole || !assignPermission) return showSnackbar("Select both role and permission", "warning");
        
        try {
            await removePermissionMutation.mutateAsync({ roleName: assignRole, permissionName: assignPermission });
            showSnackbar('Permission removed', 'success');
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Failed to remove permission', 'error');
        }
    };

    const handleDeleteConfirm = async () => {
        if (!targetPermission) return;
        
        try {
            await deletePermissionMutation.mutateAsync(targetPermission);
            showSnackbar('Permission deleted successfully', 'success');
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Failed to delete permission', 'error');
        } finally {
            setDeleteModal(false);
            setTargetPermission(null);
        }
    };

    const openDeleteModal = (permission) => {
        if (!permission) return;
        setTargetPermission(permission);
        setDeleteModal(true);
    };

    return (
        <div className="section-fade-in">
            <div className="page-header-row">
                <div>
                    <h1>Permissions</h1>
                    <p className="subtitle">Configure granular action rights and API access.</p>
                </div>
            </div>

            <div className="dashboard-section">
                <div className="management-grid-refined">
                    {/* Create Policy Card */}
                    <div className="m-card">
                        <div className="m-card-title">Policy Definition</div>
                        <div className="m-card-body">
                            <div className="m-input-group">
                                <label>New Permission</label>
                                <div className="input-with-icon">
                                    {/* <i className="fas fa-key"></i> */}
                                    <input 
                                        placeholder="e.g. DELETE_POST" 
                                        value={permissionInput} 
                                        onChange={e => setPermissionInput(e.target.value)} 
                                    />
                                </div>
                                <button 
                                    onClick={handleCreatePermission} 
                                    className="m-btn-primary"
                                    disabled={createPermissionMutation.isPending}
                                >
                                    {createPermissionMutation.isPending ? 'Creating...' : 'Create Permission'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mapping & Assignment Card */}
                    <div className="m-card">
                        <div className="m-card-title">Mapping & Assignment</div>
                        <div className="m-card-body">
                            <div className="m-input-group">
                                <CustomSelect
                                    label="Role"
                                    value={assignRole}
                                    options={roles}
                                    onChange={setAssignRole}
                                    placeholder="Choose a role..."
                                />
                            </div>
                            <div className="m-input-group">
                                <CustomSelect
                                    label="Permission"
                                    value={assignPermission}
                                    options={permissions}
                                    onChange={setAssignPermission}
                                    placeholder="Choose a permission..."
                                />
                            </div>
                            <div className="m-btn-row">
                                <button 
                                    onClick={handleAssignPermission} 
                                    className="m-btn-success"
                                    disabled={assignPermissionMutation.isPending}
                                >
                                    {assignPermissionMutation.isPending ? 'Adding...' : 'Add'}
                                </button>
                                <button 
                                    onClick={handleRemovePermission} 
                                    className="m-btn-danger-outline"
                                    disabled={removePermissionMutation.isPending}
                                >
                                    {removePermissionMutation.isPending ? 'Removing...' : <><i className="fas fa-minus"></i> Remove</>}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Delete Permission Card */}
                    <div className="m-card danger-zone">
                        <div className="m-card-title">Delete Permission</div>
                        <div className="m-card-body">
                            <div className="m-input-group">
                                <CustomSelect
                                    label="Delete Permission"
                                    value=""
                                    options={permissions}
                                    onChange={openDeleteModal}
                                    placeholder="Select permission to delete..."
                                    icon="fas fa-trash-alt"
                                />
                            </div>
                            <p className="danger-hint">Warning: Deleting a permission is permanent and affects all assigned roles.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Permission Distribution Chart */}
            <div className="dashboard-section" style={{ marginTop: '2rem' }}>
                <div className="section-title-row" style={{ marginBottom: '1.5rem' }}>
                    <h3><i className="fas fa-chart-bar"></i> Permission Overview</h3>
                </div>
                <div className="stat-card no-hover-transform" style={{ display: 'block', padding: '2rem' }}>
                    <div style={{ height: '300px' }}>
                        {loadingPermissions || loadingRoles ? (
                            <SkeletonChart variant="bar" height="250px" />
                        ) : (
                            <Bar 
                                data={{
                                    labels: ['Total Permissions', 'Active Roles'],
                                    datasets: [{
                                        label: 'Count',
                                        data: [permissions.length, roles.length],
                                        backgroundColor: ['#facc15', '#10b981'],
                                        borderColor: ['#eab308', '#059669'],
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
                                                    const label = context.label;
                                                    const value = context.parsed.y;
                                                    if (label === 'Total Permissions') {
                                                        return 'Permissions: ' + value;
                                                    } else {
                                                        return 'Roles: ' + value;
                                                    }
                                                }
                                            }
                                        },
                                        title: {
                                            display: true,
                                            text: 'System Permission & Role Statistics',
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

            {/* Delete Confirmation Modal */}
            {deleteModal && (
                <div className="modal-overlay-refined">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Confirm Deletion</h3>
                            <button className="close-btn" onClick={() => setDeleteModal(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: '#64748b', marginBottom: '20px' }}>
                                Are you sure you want to delete the permission <strong>{targetPermission}</strong>?
                            </p>
                            <div className="warning-box" style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '12px', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'start' }}>
                                <i className="fas fa-exclamation-triangle" style={{ color: '#ef4444', marginTop: '3px' }}></i>
                                <span style={{ fontSize: '0.85rem', color: '#b91c1c' }}>This action is permanent and will remove this permission from all assigned roles immediately.</span>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setDeleteModal(false)}>Cancel</button>
                            <button 
                                className="btn-confirm-delete" 
                                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                                onClick={handleDeleteConfirm}
                                disabled={deletePermissionMutation.isPending}
                            >
                                {deletePermissionMutation.isPending ? <><i className="fas fa-spinner fa-spin"></i> Deleting...</> : 'Delete Permission'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PermissionManagement;
