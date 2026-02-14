import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import { DollarSign, Ticket, Calendar, TrendingUp, TrendingDown, Users, AlertCircle, Clock, ChevronRight, Star, Hourglass, AlertTriangle } from 'lucide-react';

// Calculate return deadline (2 weeks before show)
const getReturnDeadlineInfo = (showDate, soldCount, maxTickets) => {
    const remaining = maxTickets - soldCount;
    if (remaining <= 0) return null; // Sold out, no deadline needed
    
    const show = new Date(showDate);
    const deadline = new Date(show);
    deadline.setDate(deadline.getDate() - 14); // 2 weeks before
    
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline < -7) return null; // Return deadline passed over a week ago
    
    // Color coding
    let color = 'var(--color-success)';
    let bgColor = 'rgba(16, 185, 129, 0.15)';
    let status = 'safe';
    let icon = Clock;
    
    if (daysUntilDeadline <= 0) {
        color = 'var(--text-muted)';
        bgColor = 'rgba(255, 255, 255, 0.1)';
        status = 'passed';
        icon = Clock;
    } else if (daysUntilDeadline <= 3) {
        color = 'var(--color-danger)';
        bgColor = 'rgba(239, 68, 68, 0.2)';
        status = 'urgent';
        icon = AlertTriangle;
    } else if (daysUntilDeadline <= 7) {
        color = 'var(--color-warning)';
        bgColor = 'rgba(245, 158, 11, 0.2)';
        status = 'warning';
        icon = Hourglass;
    }
    
    return {
        deadlineDate: deadline,
        daysUntilDeadline,
        color,
        bgColor,
        status,
        Icon: icon,
        formattedDeadline: deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        remaining
    };
};

const StatCard = ({ label, value, icon: Icon, color, subtitle, trend }) => (
    <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: trend ? '8px' : '0' }}>
            <div style={{
                background: `rgba(${color}, 0.2)`,
                padding: '14px',
                borderRadius: '12px',
                color: `rgb(${color})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Icon size={28} />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{value}</div>
            </div>
            {trend && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: trend > 0 ? 'var(--color-success)' : trend < 0 ? 'var(--color-danger)' : 'var(--text-muted)',
                    fontSize: '0.85rem',
                    fontWeight: 600
                }}>
                    {trend > 0 ? <TrendingUp size={16} /> : trend < 0 ? <TrendingDown size={16} /> : null}
                    {trend > 0 ? '+' : ''}{trend}%
                </div>
            )}
        </div>
        {subtitle && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', marginLeft: '56px' }}>
                {subtitle}
            </div>
        )}
    </div>
);

export function Dashboard() {
    const navigate = useNavigate();
    const { shows, sales, people } = useData();

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Calculations
    const metrics = useMemo(() => {
        // All-time totals
        const totalRevenue = sales.reduce((acc, s) => acc + Number(s.totalAmount || 0), 0);
        const totalTickets = sales.reduce((acc, s) => acc + Number(s.quantity || 0), 0);

        // Current month sales
        const thisMonthSales = sales.filter(s => {
            const d = new Date(s.saleDate);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear && s.status !== 'Cancelled';
        });
        const thisMonthRevenue = thisMonthSales.reduce((acc, s) => acc + Number(s.totalAmount || 0), 0);
        const thisMonthTickets = thisMonthSales.reduce((acc, s) => acc + Number(s.quantity || 0), 0);

        // Last month sales
        const lastMonthSales = sales.filter(s => {
            const d = new Date(s.saleDate);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear && s.status !== 'Cancelled';
        });
        const lastMonthRevenue = lastMonthSales.reduce((acc, s) => acc + Number(s.totalAmount || 0), 0);
        const lastMonthTickets = lastMonthSales.reduce((acc, s) => acc + Number(s.quantity || 0), 0);

        // Revenue trend
        const revenueTrend = lastMonthRevenue > 0 
            ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
            : (thisMonthRevenue > 0 ? 100 : 0);

        // Ticket trend
        const ticketTrend = lastMonthTickets > 0
            ? Math.round(((thisMonthTickets - lastMonthTickets) / lastMonthTickets) * 100)
            : (thisMonthTickets > 0 ? 100 : 0);

        // Best selling show this year
        const thisYearSales = sales.filter(s => {
            const d = new Date(s.saleDate);
            return d.getFullYear() === currentYear && s.status !== 'Cancelled';
        });
        const showStats = {};
        thisYearSales.forEach(s => {
            if (!showStats[s.showId]) showStats[s.showId] = 0;
            showStats[s.showId] += Number(s.quantity);
        });
        let bestShow = null;
        let bestShowTickets = 0;
        Object.entries(showStats).forEach(([showId, tickets]) => {
            if (tickets > bestShowTickets) {
                bestShowTickets = tickets;
                bestShow = shows.find(s => s.id === showId);
            }
        });

        // Upcoming shows (all future shows)
        const upcomingShows = shows
            .filter(s => {
                const showDate = new Date(s.date);
                return showDate >= now;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Shows with return deadlines approaching
        const showsWithDeadlines = shows
            .map(show => {
                const sold = sales
                    .filter(s => s.showId === show.id && s.status !== 'Cancelled')
                    .reduce((acc, s) => acc + Number(s.quantity), 0);
                const deadline = getReturnDeadlineInfo(show.date, sold, show.maxTickets);
                return { show, sold, deadline };
            })
            .filter(({ deadline }) => deadline !== null)
            .sort((a, b) => a.deadline.daysUntilDeadline - b.deadline.daysUntilDeadline)
            .slice(0, 5);

        // Unpaid reservations
        const unpaidSales = sales.filter(s => s.status === 'Reserved');
        const unpaidAmount = unpaidSales.reduce((acc, s) => acc + Number(s.totalAmount || 0), 0);
        const unpaidTickets = unpaidSales.reduce((acc, s) => acc + Number(s.quantity || 0), 0);

        // Top customers (all time)
        const customerStats = {};
        sales.filter(s => s.status !== 'Cancelled').forEach(s => {
            if (!customerStats[s.personId]) customerStats[s.personId] = { tickets: 0, spent: 0 };
            customerStats[s.personId].tickets += Number(s.quantity);
            customerStats[s.personId].spent += Number(s.totalAmount || 0);
        });
        const topCustomers = Object.entries(customerStats)
            .map(([personId, stats]) => ({
                person: people.find(p => p.id === personId),
                ...stats
            }))
            .filter(c => c.person)
            .sort((a, b) => b.tickets - a.tickets)
            .slice(0, 5);

        return {
            totalRevenue,
            totalTickets,
            thisMonthRevenue,
            thisMonthTickets,
            lastMonthRevenue,
            lastMonthTickets,
            revenueTrend,
            ticketTrend,
            bestShow,
            bestShowTickets,
            upcomingShows,
            showsWithDeadlines,
            unpaidAmount,
            unpaidTickets,
            topCustomers
        };
    }, [sales, shows, people, currentMonth, currentYear, lastMonth, lastMonthYear]);

    // Recent sales with details
    const recentSales = useMemo(() => {
        return [...sales]
            .filter(s => s.status !== 'Cancelled')
            .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
            .slice(0, 8)
            .map(sale => ({
                ...sale,
                person: people.find(p => p.id === sale.personId),
                show: shows.find(s => s.id === sale.showId)
            }));
    }, [sales, people, shows]);

    const formatCurrency = (val) => `$${Number(val).toLocaleString()}`;
    const formatShortDate = (dateStr) => {
        const d = new Date(dateStr);
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) return 'Today';
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div>
            <header style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2.5rem', margin: '0 0 8px 0' }}>Dashboard</h1>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                    Here's what's happening with your theater business
                </p>
            </header>

            {/* Key Metrics Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
            }}>
                <StatCard
                    label="This Month's Revenue"
                    value={formatCurrency(metrics.thisMonthRevenue)}
                    icon={DollarSign}
                    color="16, 185, 129"
                    trend={metrics.revenueTrend}
                    subtitle={`vs ${formatCurrency(metrics.lastMonthRevenue)} last month`}
                />
                <StatCard
                    label="Tickets Sold This Month"
                    value={metrics.thisMonthTickets}
                    icon={Ticket}
                    color="99, 102, 241"
                    trend={metrics.ticketTrend}
                    subtitle={`${metrics.lastMonthTickets} last month`}
                />
                <StatCard
                    label="Unpaid Reservations"
                    value={formatCurrency(metrics.unpaidAmount)}
                    icon={AlertCircle}
                    color="245, 158, 11"
                    subtitle={`${metrics.unpaidTickets} tickets awaiting payment`}
                />
                <StatCard
                    label="Total All-Time Revenue"
                    value={formatCurrency(metrics.totalRevenue)}
                    icon={TrendingUp}
                    color="139, 92, 246"
                    subtitle={`${metrics.totalTickets.toLocaleString()} tickets sold`}
                />
            </div>

            {/* Main Content Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
            }}>
                {/* Recent Activity */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={20} />
                            Recent Sales
                        </h3>
                        <button 
                            onClick={() => navigate('/sales')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-accent)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.9rem'
                            }}
                        >
                            View All <ChevronRight size={16} />
                        </button>
                    </div>
                    
                    {recentSales.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
                            No sales yet — time to sell some tickets! 🎭
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {recentSales.map(sale => (
                                <div 
                                    key={sale.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px 16px',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--glass-border)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            background: 'var(--color-accent)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.85rem',
                                            fontWeight: 600
                                        }}>
                                            {sale.person?.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{sale.person?.name || 'Unknown'}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {sale.quantity} × {sale.show?.title || 'Unknown'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 600 }}>${sale.totalAmount}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {formatShortDate(sale.saleDate)}
                                        </div>
                                        {sale.status !== 'Paid' && (
                                            <span style={{
                                                fontSize: '0.7rem',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                background: 'var(--color-warning)',
                                                color: 'black',
                                                marginTop: '2px',
                                                display: 'inline-block'
                                            }}>
                                                {sale.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Ticket Return Deadline */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Hourglass size={20} />
                            Ticket Return Deadline
                        </h3>
                        <button 
                            onClick={() => navigate('/shows')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-accent)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.9rem'
                            }}
                        >
                            All Shows <ChevronRight size={16} />
                        </button>
                    </div>
                    
                    {metrics.showsWithDeadlines.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
                            No return deadlines approaching ✅
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {metrics.showsWithDeadlines.map(({ show, sold, deadline }) => {
                                const DeadlineIcon = deadline.Icon;
                                return (
                                    <div 
                                        key={show.id}
                                        onClick={() => navigate(`/shows/${show.id}/attendees`)}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '14px 16px',
                                            background: deadline.bgColor,
                                            borderRadius: '8px',
                                            border: `1px solid ${deadline.color}`,
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s, box-shadow 0.2s'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{show.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {deadline.remaining} unsold • Return by {deadline.formattedDeadline}
                                            </div>
                                        </div>
                                        <div style={{ 
                                            textAlign: 'right',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-end',
                                            gap: '4px'
                                        }}>
                                            <div style={{ 
                                                fontWeight: 700, 
                                                color: deadline.color,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                <DeadlineIcon size={14} />
                                                {deadline.daysUntilDeadline <= 0 
                                                    ? 'OVERDUE' 
                                                    : `${deadline.daysUntilDeadline} days`
                                                }
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {new Date(show.date).toLocaleDateString('en-US', { 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px'
            }}>
                {/* Best Show This Month */}
                {metrics.bestShow && (
                    <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <Star size={24} color="#a78bfa" />
                            <h3 style={{ margin: 0, color: '#a78bfa' }}>Top Performance This Year</h3>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px' }}>
                            {metrics.bestShow.title}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                            {new Date(metrics.bestShow.date).toLocaleDateString('en-US', { 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </div>
                        <div style={{ display: 'flex', gap: '24px' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tickets Sold</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{metrics.bestShowTickets}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Price</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>${metrics.bestShow.price}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top Customers */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <Users size={20} />
                        <h3 style={{ margin: 0 }}>Top Customers (All Time)</h3>
                    </div>
                    
                    {metrics.topCustomers.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                            No customer data yet
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {metrics.topCustomers.map((customer, index) => (
                                <div 
                                    key={customer.person.id}
                                    onClick={() => navigate(`/people/${customer.person.id}/history`)}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 12px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#b45309' : 'var(--glass-bg)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            color: index < 3 ? 'black' : 'var(--text-secondary)'
                                        }}>
                                            {index + 1}
                                        </span>
                                        <span style={{ fontWeight: 500 }}>{customer.person.name}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{customer.tickets} tickets</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            ${customer.spent.toLocaleString()}
                                        </div>
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
