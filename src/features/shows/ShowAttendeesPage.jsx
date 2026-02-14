import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import { SeatPicker } from '../../components/SeatPicker';
import { ArrowLeft, Users, Calendar, Ticket, Clock, Plus, CheckCircle, Trash2, UserPlus, AlertCircle, Armchair, Edit2, Save, X, Hourglass, AlertTriangle } from 'lucide-react';

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
    let iconColor = '#10b981';
    let status = 'safe';
    
    if (daysUntilDeadline <= 0) {
        color = 'var(--text-muted)';
        bgColor = 'rgba(255, 255, 255, 0.1)';
        iconColor = 'var(--text-muted)';
        status = 'passed';
    } else if (daysUntilDeadline <= 3) {
        color = 'var(--color-danger)';
        bgColor = 'rgba(239, 68, 68, 0.15)';
        iconColor = '#ef4444';
        status = 'urgent';
    } else if (daysUntilDeadline <= 7) {
        color = 'var(--color-warning)';
        bgColor = 'rgba(245, 158, 11, 0.15)';
        iconColor = '#f59e0b';
        status = 'warning';
    }
    
    return {
        deadlineDate: deadline,
        daysUntilDeadline,
        daysUntilShow,
        color,
        bgColor,
        iconColor,
        status,
        formattedDeadline: deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
};

export function ShowAttendeesPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { shows, sales, people, waitlist, addToWaitlist, updateWaitlistEntry, deleteWaitlistEntry, convertWaitlistToSale, getWaitlistForShow, getShowWaitlistStats, updateSale } = useData();
    
    const [showAddWaitlist, setShowAddWaitlist] = useState(false);
    const [waitlistForm, setWaitlistForm] = useState({ personId: '', quantity: 1, notes: '' });
    const [editSeatsMode, setEditSeatsMode] = useState(false);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [selectedAttendee, setSelectedAttendee] = useState(null);

    const show = shows.find(s => s.id === id);

    if (!show) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>Show not found</h2>
                <button 
                    onClick={() => navigate('/shows')}
                    style={{
                        marginTop: '20px',
                        background: 'var(--color-accent)',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    Back to Shows
                </button>
            </div>
        );
    }

    // Get attendees sorted by purchase date
    const attendees = sales
        .filter(sale => sale.showId === id && sale.status !== 'Cancelled')
        .map(sale => {
            const person = people.find(p => p.id === sale.personId);
            return {
                ...sale,
                personName: person?.name || 'Unknown',
                personPhone: person?.phone || '',
                personEmail: person?.email || ''
            };
        })
        .sort((a, b) => new Date(a.saleDate) - new Date(b.saleDate));

    const totalTickets = attendees.reduce((acc, a) => acc + Number(a.quantity), 0);
    const totalRevenue = attendees.reduce((acc, a) => acc + Number(a.totalAmount || 0), 0);
    const remaining = show.maxTickets - totalTickets;

    // Get waitlist
    const showWaitlist = getWaitlistForShow(id);
    const waitlistStats = getShowWaitlistStats(id);

    // Get occupied seats for this show
    const occupiedSeats = useMemo(() => {
        const showSales = sales.filter(s => s.showId === id && s.status !== 'Cancelled' && s.seats);
        const seats = [];
        showSales.forEach(sale => {
            if (sale.seats && Array.isArray(sale.seats)) {
                seats.push(...sale.seats);
            }
        });
        return seats;
    }, [sales, id]);

    // Seats for currently selected attendee (to show as "selected" in picker)
    const attendeeSeats = useMemo(() => {
        if (!selectedAttendee) return [];
        const sale = attendees.find(a => a.id === selectedAttendee);
        return sale?.seats || [];
    }, [selectedAttendee, attendees]);

    // Build seat -> customer name map for tooltips
    const seatToCustomer = useMemo(() => {
        const map = new Map();
        attendees.forEach(attendee => {
            if (attendee.seats && Array.isArray(attendee.seats)) {
                attendee.seats.forEach(seat => {
                    const key = `${seat.row}-${seat.seat}`;
                    map.set(key, attendee.personName);
                });
            }
        });
        return map;
    }, [attendees]);

    const getSeatInfo = (row, seat) => {
        const key = `${row}-${seat}`;
        const customerName = seatToCustomer.get(key);
        if (customerName) {
            return { customerName, status: 'sold' };
        }
        return null;
    };

    const formatDate = (dateStr, timeStr) => {
        if (!dateStr) return 'TBD';
        const date = new Date(`${dateStr}T${timeStr || '00:00'}`);
        const options = { month: 'long', day: 'numeric', year: 'numeric', weekday: 'long' };
        return date.toLocaleDateString('en-US', options);
    };

    const handleAddToWaitlist = (e) => {
        e.preventDefault();
        if (!waitlistForm.personId) return;
        addToWaitlist(id, waitlistForm.personId, waitlistForm.quantity, waitlistForm.notes);
        setWaitlistForm({ personId: '', quantity: 1, notes: '' });
        setShowAddWaitlist(false);
    };

    const handleConvert = (waitlistId) => {
        if (remaining <= 0) {
            alert('No tickets available! Cannot convert waitlist entry.');
            return;
        }
        const entry = showWaitlist.find(w => w.id === waitlistId);
        if (entry && entry.quantity > remaining) {
            if (!confirm(`Only ${remaining} tickets available. Convert anyway with partial quantity?`)) {
                return;
            }
        }
        convertWaitlistToSale(waitlistId);
    };

    const handleNotify = (waitlistId) => {
        updateWaitlistEntry(waitlistId, { 
            status: 'Notified', 
            notifiedAt: new Date().toISOString() 
        });
        alert('Customer marked as notified! (In a full app, this would send an email/SMS)');
    };

    const formatSeats = (seats) => {
        if (!seats || seats.length === 0) return null;
        const section = seats[0]?.section || 'SOUTH';
        const seatList = seats.map(s => typeof s.row === 'string' ? `${s.row}${s.seat}` : `${String.fromCharCode(64 + s.row)}${s.seat}`).join(', ');
        return `${section} ${seatList}`;
    };

    const handleSaveSeats = () => {
        if (!selectedAttendee) {
            alert('Please select an attendee first!');
            return;
        }
        if (selectedSeats.length === 0) {
            if (!confirm('Remove all seat assignments for this attendee?')) return;
        }
        
        // Update the sale with new seats
        updateSale(selectedAttendee, { seats: selectedSeats });
        
        // Reset
        setSelectedSeats([]);
        setSelectedAttendee(null);
        setEditSeatsMode(false);
    };

    const handleCancelEdit = () => {
        setEditSeatsMode(false);
        setSelectedSeats([]);
        setSelectedAttendee(null);
    };

    const handleSeatToggle = (seats) => {
        setSelectedSeats(seats);
    };

    const handleSelectAttendee = (attendeeId) => {
        setSelectedAttendee(attendeeId);
        const attendee = attendees.find(a => a.id === attendeeId);
        setSelectedSeats(attendee?.seats || []);
    };

    return (
        <div style={{ padding: '32px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <button
                    onClick={() => navigate('/shows')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        marginBottom: '16px',
                        padding: '8px 0'
                    }}
                >
                    <ArrowLeft size={20} />
                    Back to Shows
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                    <div style={{
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: '#a5b4fc',
                        padding: '12px',
                        borderRadius: '12px'
                    }}>
                        <Calendar size={32} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2rem', margin: 0 }}>{show.title}</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                            {formatDate(show.date, show.time)}
                        </p>
                    </div>
                </div>
                {show.section && (
                    <span style={{
                        display: 'inline-block',
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)',
                        marginLeft: '68px'
                    }}>
                        {show.section}
                    </span>
                )}
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '32px'
            }}>
                <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tickets Sold</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-accent)' }}>{totalTickets}</div>
                </div>
                <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Revenue</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-success)' }}>
                        ${totalRevenue.toLocaleString()}
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Remaining</div>
                    <div style={{ 
                        fontSize: '2rem', 
                        fontWeight: 700, 
                        color: remaining > 0 ? 'var(--color-accent)' : 'var(--color-danger)' 
                    }}>
                        {remaining}
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Attendees</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{attendees.length}</div>
                </div>
                {(() => {
                    const dl = getDeadlineInfo(show.date);
                    if (!dl || dl.status === 'passed' || remaining === 0) return null;
                    return (
                        <div className="glass-panel" style={{ 
                            padding: '20px', 
                            textAlign: 'center',
                            background: dl.bgColor,
                            border: `1px solid ${dl.color}`
                        }}>
                            <div style={{ 
                                fontSize: '0.85rem', 
                                color: dl.color, 
                                marginBottom: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                            }}>
                                {dl.status === 'urgent' ? <AlertTriangle size={14} /> : <Hourglass size={14} />}
                                Return Deadline
                            </div>
                            <div style={{ 
                                fontSize: '1.6rem', 
                                fontWeight: 700, 
                                color: dl.color 
                            }}>
                                {dl.daysUntilDeadline} days
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                by {dl.formattedDeadline}
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Seating Chart Section */}
            <div className="glass-panel" style={{ marginBottom: '32px', overflow: 'hidden' }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--glass-border)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Armchair size={24} />
                        <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Seating Chart — {show.section || 'South Section'}</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {editSeatsMode && (
                            <>
                                <button
                                    onClick={handleCancelEdit}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 14px',
                                        background: 'transparent',
                                        border: '1px solid var(--text-secondary)',
                                        color: 'var(--text-secondary)',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <X size={14} />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveSeats}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 14px',
                                        background: 'var(--color-success)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <Save size={14} />
                                    Save Seats
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => setEditSeatsMode(!editSeatsMode)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                background: editSeatsMode ? 'var(--color-danger)' : 'var(--color-accent)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            <Edit2 size={14} />
                            {editSeatsMode ? 'Done' : 'Edit Seats'}
                        </button>
                    </div>
                </div>

                {/* Attendee Selector (when in edit mode) */}
                {editSeatsMode && (
                    <div style={{ 
                        padding: '16px 24px', 
                        background: 'rgba(99, 102, 241, 0.1)', 
                        borderBottom: '1px solid var(--glass-border)'
                    }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            {selectedAttendee 
                                ? `Editing seats for: ${attendees.find(a => a.id === selectedAttendee)?.personName}`
                                : 'Select an attendee to assign seats:'
                            }
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {attendees.map(attendee => (
                                <button
                                    key={attendee.id}
                                    onClick={() => handleSelectAttendee(attendee.id)}
                                    style={{
                                        padding: '8px 14px',
                                        background: selectedAttendee === attendee.id ? 'var(--color-accent)' : 'rgba(0,0,0,0.2)',
                                        color: selectedAttendee === attendee.id ? 'white' : 'var(--text-primary)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    {selectedAttendee === attendee.id && <CheckCircle size={14} />}
                                    {attendee.personName}
                                    {attendee.seats?.length > 0 && (
                                        <span style={{ opacity: 0.7 }}>({attendee.seats.length} seats)</span>
                                    )}
                                </button>
                            ))}
                            {attendees.length === 0 && (
                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    No attendees yet — add sales first
                                </span>
                            )}
                        </div>
                        {selectedAttendee && (
                            <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Click seats above to assign/remove. Currently selected: {selectedSeats.length} seats
                            </div>
                        )}
                    </div>
                )}

                {/* Seat Picker */}
                <SeatPicker
                    rowConfig={[
                        { name: 'B', seats: 9, leftSeats: 5 },
                        { name: 'C', seats: 12, leftSeats: 6 },
                        { name: 'D', seats: 9, leftSeats: 2 }
                    ]}
                    alignAisle={true}
                    disabledSeats={occupiedSeats.filter(s => !selectedSeats.find(sel => sel.row === s.row && sel.seat === s.seat))}
                    selectedSeats={selectedSeats}
                    onSeatToggle={editSeatsMode ? handleSeatToggle : () => {}}
                    maxSelection={selectedAttendee ? attendees.find(a => a.id === selectedAttendee)?.quantity || 10 : 0}
                    section={show.section || 'South'}
                    getSeatInfo={getSeatInfo}
                />

                {/* Seat Legend & Info */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: '24px', 
                    padding: '16px 24px',
                    borderTop: '1px solid var(--glass-border)',
                    fontSize: '0.85rem',
                    background: 'rgba(0,0,0,0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                            width: '20px', 
                            height: '20px', 
                            borderRadius: '4px',
                            background: 'var(--color-accent)',
                            border: '2px solid #a5b4fc'
                        }} />
                        <span>Sold ({occupiedSeats.length})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                            width: '20px', 
                            height: '20px', 
                            borderRadius: '4px',
                            background: 'rgba(99, 102, 241, 0.3)',
                            border: '1px solid rgba(99, 102, 241, 0.5)'
                        }} />
                        <span>Available ({30 - occupiedSeats.length})</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)' }}>
                        30 seats: B(9) → C(12) → D(9)
                    </div>
                </div>
            </div>

            {/* Sold Out / Waitlist Banner */}
            {remaining === 0 && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%)',
                    border: '1px solid var(--color-danger)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <AlertCircle size={32} color="var(--color-danger)" />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-danger)' }}>
                            This Show is SOLD OUT
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {waitlistStats.waiting > 0 
                                ? `${waitlistStats.waiting} people waiting for ${waitlistStats.totalTicketsWanted} tickets`
                                : 'No waitlist entries yet — add customers who want tickets if they become available'}
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddWaitlist(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            background: 'var(--color-accent)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.9rem'
                        }}
                    >
                        <UserPlus size={18} />
                        Add to Waitlist
                    </button>
                </div>
            )}

            {/* Two Column Layout */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '24px'
            }}>
                {/* Attendees List */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <h2 style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        marginBottom: '20px',
                        fontSize: '1.4rem'
                    }}>
                        <Users size={24} />
                        Attendees ({attendees.length})
                    </h2>

                    {attendees.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            <Users size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                            <p>No tickets sold for this show yet.</p>
                            <button
                                onClick={() => navigate('/sales')}
                                style={{
                                    marginTop: '16px',
                                    padding: '10px 20px',
                                    background: 'var(--color-accent)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                Go to Sales
                            </button>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>#</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Customer</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Qty</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Seats</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendees.map((attendee, index) => (
                                    <tr key={attendee.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{index + 1}</td>
                                        <td style={{ padding: '12px' }}>
                                            <div style={{ fontWeight: 500 }}>{attendee.personName}</div>
                                            {attendee.personPhone && (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{attendee.personPhone}</div>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>{attendee.quantity}</td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            {attendee.seats?.length > 0 ? (
                                                <span style={{ 
                                                    fontSize: '0.8rem', 
                                                    color: 'var(--color-accent)',
                                                    background: 'rgba(99, 102, 241, 0.1)',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px'
                                                }}>
                                                    <Armchair size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                                    {formatSeats(attendee.seats)}
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '3px 10px',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                background: attendee.status === 'Paid' ? 'var(--color-success)' : 'var(--color-warning)',
                                                color: 'black'
                                            }}>
                                                {attendee.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 500 }}>${attendee.totalAmount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Waitlist Section */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            margin: 0,
                            fontSize: '1.4rem'
                        }}>
                            <Clock size={24} />
                            Waitlist ({waitlistStats.waiting})
                        </h2>
                        <button
                            onClick={() => setShowAddWaitlist(!showAddWaitlist)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                background: showAddWaitlist ? 'var(--color-danger)' : 'var(--color-accent)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            {showAddWaitlist ? 'Cancel' : <><Plus size={16} /> Add Person</>}
                        </button>
                    </div>

                    {/* Add to Waitlist Form */}
                    {showAddWaitlist && (
                        <form onSubmit={handleAddToWaitlist} style={{ 
                            background: 'rgba(0,0,0,0.2)', 
                            padding: '16px', 
                            borderRadius: '8px',
                            marginBottom: '20px'
                        }}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Customer
                                </label>
                                <select
                                    value={waitlistForm.personId}
                                    onChange={e => setWaitlistForm({ ...waitlistForm, personId: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '6px',
                                        color: 'white'
                                    }}
                                >
                                    <option value="">Select a customer...</option>
                                    {people.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Tickets Wanted
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={waitlistForm.quantity}
                                    onChange={e => setWaitlistForm({ ...waitlistForm, quantity: parseInt(e.target.value) || 1 })}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '6px',
                                        color: 'white'
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Notes (optional)
                                </label>
                                <input
                                    type="text"
                                    value={waitlistForm.notes}
                                    onChange={e => setWaitlistForm({ ...waitlistForm, notes: e.target.value })}
                                    placeholder="e.g. prefers aisle seats"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '6px',
                                        color: 'white'
                                    }}
                                />
                            </div>
                            <button
                                type="submit"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'var(--color-accent)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                Add to Waitlist
                            </button>
                        </form>
                    )}

                    {/* Waitlist Entries */}
                    {showWaitlist.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            <Clock size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                            <p>No one on the waitlist yet.</p>
                            {remaining > 0 && (
                                <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>
                                    This show still has {remaining} tickets available — use Sales to sell them!
                                </p>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {showWaitlist.map((entry, index) => (
                                <div 
                                    key={entry.id}
                                    style={{
                                        padding: '16px',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--glass-border)',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{
                                                width: '26px',
                                                height: '26px',
                                                borderRadius: '50%',
                                                background: 'var(--glass-bg)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.75rem',
                                                fontWeight: 600
                                            }}>
                                                {index + 1}
                                            </span>
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{entry.person?.name || 'Unknown'}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {entry.person?.phone || entry.person?.email || ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 600 }}>{entry.quantity} tickets</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                Added {new Date(entry.addedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {entry.notes && (
                                        <div style={{ 
                                            fontSize: '0.8rem', 
                                            color: 'var(--text-secondary)',
                                            fontStyle: 'italic',
                                            marginBottom: '12px',
                                            padding: '6px 10px',
                                            background: 'rgba(0,0,0,0.2)',
                                            borderRadius: '4px'
                                        }}>
                                            "{entry.notes}"
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {entry.status === 'Waiting' && remaining > 0 && (
                                            <button
                                                onClick={() => handleConvert(entry.id)}
                                                style={{
                                                    flex: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px',
                                                    padding: '8px',
                                                    background: 'var(--color-success)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600
                                                }}
                                            >
                                                <CheckCircle size={14} />
                                                Sell Tickets
                                            </button>
                                        )}
                                        {entry.status === 'Waiting' && (
                                            <button
                                                onClick={() => handleNotify(entry.id)}
                                                style={{
                                                    padding: '8px 12px',
                                                    background: 'var(--color-warning)',
                                                    color: 'black',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                Notify
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteWaitlistEntry(entry.id)}
                                            style={{
                                                padding: '8px',
                                                background: 'transparent',
                                                color: 'var(--color-danger)',
                                                border: '1px solid var(--color-danger)',
                                                borderRadius: '6px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
