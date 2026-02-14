import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import { ArrowLeft, User, Calendar, Ticket, Phone, Mail, Clock } from 'lucide-react';

export function PersonHistoryPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { people, sales, shows } = useData();

    const person = people.find(p => p.id === id);

    if (!person) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>Person not found</h2>
                <button 
                    onClick={() => navigate('/people')}
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
                    Back to People
                </button>
            </div>
        );
    }

    // Get ticket history
    const allTickets = sales
        .filter(sale => sale.personId === id && sale.status !== 'Cancelled')
        .map(sale => {
            const show = shows.find(s => s.id === sale.showId);
            return {
                ...sale,
                showTitle: show?.title || 'Unknown Show',
                showDate: show?.date || null,
                showTime: show?.time || null
            };
        })
        .sort((a, b) => new Date(b.showDate) - new Date(a.showDate));

    const now = new Date();
    const upcoming = allTickets.filter(t => t.showDate && new Date(t.showDate) >= now);
    const past = allTickets.filter(t => t.showDate && new Date(t.showDate) < now);

    const totalSpent = allTickets.reduce((acc, t) => acc + Number(t.totalAmount || 0), 0);
    const totalTickets = allTickets.reduce((acc, t) => acc + Number(t.quantity), 0);

    const formatShowDateTime = (dateStr, timeStr) => {
        if (!dateStr) return 'Date TBD';
        const date = new Date(`${dateStr}T${timeStr || '00:00'}`);
        const datePart = date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
        if (timeStr) {
            const [hours, minutes] = timeStr.split(':');
            const h = parseInt(hours, 10);
            const ampm = h >= 12 ? 'pm' : 'am';
            const h12 = h % 12 || 12;
            return `${datePart} at ${h12}:${minutes} ${ampm}`;
        }
        return datePart;
    };

    return (
        <div style={{ padding: '32px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <button
                    onClick={() => navigate('/people')}
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
                    Back to People
                </button>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'var(--color-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        fontWeight: 700,
                        flexShrink: 0
                    }}>
                        {person.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0' }}>{person.name}</h1>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-secondary)' }}>
                            {person.phone && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Phone size={16} />
                                    {person.phone}
                                </div>
                            )}
                            {person.email && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Mail size={16} />
                                    {person.email}
                                </div>
                            )}
                        </div>
                        {person.notes && (
                            <p style={{ 
                                marginTop: '12px', 
                                fontStyle: 'italic', 
                                color: 'var(--text-secondary)',
                                background: 'rgba(255,255,255,0.05)',
                                padding: '12px',
                                borderRadius: '8px'
                            }}>
                                "{person.notes}"
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
            }}>
                <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Spent</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-success)' }}>
                        ${totalSpent.toLocaleString()}
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Tickets</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-accent)' }}>{totalTickets}</div>
                </div>
                <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Upcoming Shows</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-accent)' }}>{upcoming.length}</div>
                </div>
                <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Attended Shows</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{past.length}</div>
                </div>
            </div>

            {/* Upcoming Shows */}
            {upcoming.length > 0 && (
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                    <h2 style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        marginBottom: '24px',
                        fontSize: '1.5rem',
                        color: 'var(--color-accent)'
                    }}>
                        <Calendar size={28} />
                        Upcoming Shows ({upcoming.length})
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {upcoming.map((ticket) => (
                            <div 
                                key={ticket.id} 
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '20px',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(99, 102, 241, 0.3)'
                                }}
                            >
                                <div>
                                    <a
                                        href={`/shows/${ticket.showId}/attendees`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            navigate(`/shows/${ticket.showId}/attendees`);
                                        }}
                                        style={{
                                            fontSize: '1.2rem',
                                            fontWeight: 600,
                                            color: 'var(--color-accent)',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        {ticket.showTitle}
                                    </a>
                                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                                        {formatShowDateTime(ticket.showDate, ticket.showTime)}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                                        <Ticket size={18} style={{ display: 'inline', marginRight: '4px' }} />
                                        {ticket.quantity} tickets
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                                        ${ticket.totalAmount}
                                    </div>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '0.85rem',
                                        marginTop: '8px',
                                        background: ticket.status === 'Paid' ? 'var(--color-success)' : 'var(--color-warning)',
                                        color: 'black'
                                    }}>
                                        {ticket.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Past Shows */}
            {past.length > 0 && (
                <div className="glass-panel" style={{ padding: '24px', opacity: 0.9 }}>
                    <h2 style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        marginBottom: '24px',
                        fontSize: '1.5rem',
                        color: 'var(--text-muted)'
                    }}>
                        <Clock size={28} />
                        Past Shows ({past.length})
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {past.map((ticket) => (
                            <div 
                                key={ticket.id} 
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '20px',
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    borderRadius: '12px'
                                }}
                            >
                                <div>
                                    <span style={{
                                        fontSize: '1.15rem',
                                        fontWeight: 500,
                                        color: 'var(--text-primary)'
                                    }}>
                                        {ticket.showTitle}
                                    </span>
                                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                                        {formatShowDateTime(ticket.showDate, ticket.showTime)}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>
                                        {ticket.quantity} tickets
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                                        ${ticket.totalAmount}
                                    </div>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '0.85rem',
                                        marginTop: '8px',
                                        background: 'var(--glass-bg)',
                                        color: 'var(--text-secondary)',
                                        border: '1px solid var(--glass-border)'
                                    }}>
                                        Attended
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No History */}
            {upcoming.length === 0 && past.length === 0 && (
                <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
                    <Ticket size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        No ticket history for {person.name} yet.
                    </p>
                    <button
                        onClick={() => navigate('/sales')}
                        style={{
                            marginTop: '24px',
                            background: 'var(--color-accent)',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Go to Sales Box Office
                    </button>
                </div>
            )}
        </div>
    );
}
