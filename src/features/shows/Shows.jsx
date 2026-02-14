import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import { Plus, Calendar, Trash2, Edit, Clock, AlertTriangle, Hourglass } from 'lucide-react';
import { Modal } from '../../components/Modal';

// Calculate theater return deadline (2 weeks before show)
const getDeadlineInfo = (showDate) => {
    if (!showDate) return null;
    const show = new Date(showDate);
    const deadline = new Date(show);
    deadline.setDate(deadline.getDate() - 14); // 2 weeks before
    
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    const daysUntilShow = Math.ceil((show - now) / (1000 * 60 * 60 * 24));
    
    // Color coding
    let color = 'var(--color-success)';
    let bgColor = 'rgba(16, 185, 129, 0.15)';
    let status = 'safe';
    
    if (daysUntilDeadline <= 0) {
        color = 'var(--text-muted)';
        bgColor = 'rgba(255, 255, 255, 0.1)';
        status = 'passed';
    } else if (daysUntilDeadline <= 3) {
        color = 'var(--color-danger)';
        bgColor = 'rgba(239, 68, 68, 0.15)';
        status = 'urgent';
    } else if (daysUntilDeadline <= 7) {
        color = 'var(--color-warning)';
        bgColor = 'rgba(245, 158, 11, 0.15)';
        status = 'warning';
    }
    
    return {
        deadlineDate: deadline,
        daysUntilDeadline,
        daysUntilShow,
        color,
        bgColor,
        status,
        formattedDeadline: deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
};

export function Shows() {
    const navigate = useNavigate();
    const { shows, addShow, deleteShow, updateShow, sales, getShowWaitlistStats } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        time: '',
        price: '',
        maxTickets: '',
        location: 'Main Theater',
        section: ''
    });

    const formatShowDate = (dateStr, timeStr) => {
        if (!dateStr) return 'TBD';
        const date = new Date(`${dateStr}T${timeStr || '00:00'}`);

        // Format: February 2, 2026 - Monday
        const datePart = date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            weekday: 'long'
        }).replace(',', ',').replace(/(\d{4})/, '$1 -');
        // Note: standard toLocaleDateString doesn't do "Year - Weekday", so we construct it manually 
        // actually easier to do manual construction for specific format "February 2, 2026 - Monday"

        const optionsDate = { month: 'long', day: 'numeric', year: 'numeric' };
        const optionsDay = { weekday: 'long' };
        const mainDate = date.toLocaleDateString('en-US', optionsDate);
        const dayName = date.toLocaleDateString('en-US', optionsDay);

        // Format time: 06:01 pm
        let timePart = '';
        if (timeStr) {
            const [hours, minutes] = timeStr.split(':');
            const h = parseInt(hours, 10);
            const ampm = h >= 12 ? 'pm' : 'am';
            const h12 = h % 12 || 12; // 0 should be 12
            timePart = ` @ ${h12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
        }

        return `${mainDate} - ${dayName}${timePart}`;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title || !formData.date) return;

        const data = {
            ...formData,
            price: Number(formData.price),
            maxTickets: Number(formData.maxTickets),
            section: 'South'  // Always South section for Mom
        };

        if (editId) {
            updateShow(editId, data);
        } else {
            addShow(data);
        }

        setIsModalOpen(false);
        setEditId(null);
        setFormData({ title: '', date: '', time: '', price: '', maxTickets: '', location: 'Main Theater', section: '' });
    };

    const handleEdit = (show) => {
        setEditId(show.id);
        setFormData({
            title: show.title,
            date: show.date.split('T')[0], // Handle ISO string if needed, mostly date string in this app
            time: show.time,
            price: show.price,
            maxTickets: show.maxTickets,
            location: show.location || 'Main Theater',
            section: show.section || ''
        });
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditId(null);
        setFormData({ title: '', date: '', time: '', price: '', maxTickets: '', location: 'Main Theater', section: '' });
    };

    // Navigate to show attendees page
    const goToAttendees = (showId) => {
        navigate(`/shows/${showId}/attendees`);
    };

    // Calculate show stats
    const getShowStats = (showId) => {
        const showSales = sales.filter(s => s.showId === showId && s.status !== 'Cancelled');
        const totalTickets = showSales.reduce((acc, s) => acc + Number(s.quantity), 0);
        const totalRevenue = showSales.reduce((acc, s) => acc + Number(s.totalAmount || 0), 0);
        return { totalTickets, totalRevenue };
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ fontSize: '2rem' }}>Shows</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage your upcoming performances</p>
                </div>
                <button
                    onClick={() => {
                        setEditId(null);
                        setEditId(null);
                        setFormData({ title: '', date: '', time: '', price: '', maxTickets: '', location: 'Main Theater', section: '' });
                        setIsModalOpen(true);
                    }}
                    style={{
                        background: 'var(--color-accent)',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 600,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    <Plus size={20} />
                    Add Show
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {shows.map(show => {
                    const stats = getShowStats(show.id);
                    const remaining = show.maxTickets - stats.totalTickets;
                    return (
                        <div 
                            key={show.id} 
                            className="glass-panel" 
                            style={{ 
                                padding: '24px', 
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onClick={() => goToAttendees(show.id)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                                <div style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '8px', borderRadius: '8px' }}>
                                    <Calendar size={24} />
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(show);
                                        }}
                                        style={{ background: 'transparent', color: 'var(--text-primary)', padding: 4 }}
                                        title="Edit Show"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteShow(show.id);
                                        }}
                                        style={{ background: 'transparent', color: 'var(--color-danger)', padding: 4 }}
                                        title="Delete Show"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{show.title}</h3>

                            <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '1rem' }}>
                                {formatShowDate(show.date, show.time)}
                            </div>

                            {show.section && (
                                <div style={{
                                    display: 'inline-block',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.85rem',
                                    color: 'var(--text-secondary)',
                                    marginBottom: '16px'
                                }}>
                                    Section: {show.section}
                                </div>
                            )}
                            {!show.section && <div style={{ marginBottom: '16px' }}></div>}

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                <span>Tickets: {stats.totalTickets} sold, {remaining} left</span>
                                <span>${show.price}</span>
                            </div>
                            {(() => {
                                const waitlistStats = getShowWaitlistStats(show.id);
                                const deadlineInfo = getDeadlineInfo(show.date);
                                const showDeadline = deadlineInfo && deadlineInfo.status !== 'passed' && remaining > 0;
                                
                                if (waitlistStats.waiting === 0 && !showDeadline) return null;
                                
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {waitlistStats.waiting > 0 && (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '0.8rem',
                                                color: remaining === 0 ? 'var(--color-danger)' : 'var(--color-warning)',
                                                background: remaining === 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                width: 'fit-content'
                                            }}>
                                                <Clock size={12} />
                                                {waitlistStats.waiting} on waitlist ({waitlistStats.totalTicketsWanted} tickets)
                                            </div>
                                        )}
                                        {showDeadline && (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '0.8rem',
                                                color: deadlineInfo.color,
                                                background: deadlineInfo.bgColor,
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                width: 'fit-content',
                                                fontWeight: 500
                                            }}>
                                                {deadlineInfo.status === 'urgent' ? <AlertTriangle size={12} /> : <Hourglass size={12} />}
                                                Return by {deadlineInfo.formattedDeadline} ({deadlineInfo.daysUntilDeadline} days)
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    );
                })}

                {shows.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                        <p>No shows scheduled. Click "Add Show" to get started.</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Show Modal */}
            <Modal isOpen={isModalOpen} onClose={handleClose} title={editId ? "Edit Show" : "Add New Show"}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Show Title</label>
                        <input
                            style={{
                                width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', fontSize: '1rem'
                            }}
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                            placeholder="e.g. Summer Concert"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Date</label>
                            <input
                                type="date"
                                style={{
                                    width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white'
                                }}
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Time</label>
                            <input
                                type="time"
                                style={{
                                    width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white'
                                }}
                                value={formData.time}
                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Price ($)</label>
                            <input
                                type="number"
                                style={{
                                    width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white'
                                }}
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Max Tickets</label>
                            <input
                                type="number"
                                style={{
                                    width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white'
                                }}
                                value={formData.maxTickets}
                                onChange={e => setFormData({ ...formData, maxTickets: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{
                            marginTop: '10px',
                            background: 'var(--color-accent)',
                            color: 'white',
                            padding: '16px',
                            borderRadius: '8px',
                            fontWeight: 600
                        }}
                    >
                        {editId ? "Update Show" : "Create Show"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
