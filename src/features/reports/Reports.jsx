import { useState, useMemo } from 'react';
import { useData } from '../../hooks/useData';
import { Calendar, DollarSign, Ticket, TrendingUp, Download, Printer, ChevronLeft, ChevronRight } from 'lucide-react';

export function Reports() {
    const { sales, shows, people } = useData();
    
    // Default to current month
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-11
    const [viewMode, setViewMode] = useState('month'); // 'month' or 'year'

    // Calculate date range
    const { startDate, endDate, periodLabel } = useMemo(() => {
        if (viewMode === 'month') {
            const start = new Date(selectedYear, selectedMonth, 1);
            const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
            const label = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            return { startDate: start, endDate: end, periodLabel: label };
        } else {
            const start = new Date(selectedYear, 0, 1);
            const end = new Date(selectedYear, 11, 31, 23, 59, 59);
            const label = selectedYear.toString();
            return { startDate: start, endDate: end, periodLabel: label };
        }
    }, [selectedYear, selectedMonth, viewMode]);

    // Filter sales by date range
    const periodSales = useMemo(() => {
        return sales.filter(sale => {
            const saleDate = new Date(sale.saleDate);
            return saleDate >= startDate && saleDate <= endDate && sale.status !== 'Cancelled';
        }).map(sale => {
            const show = shows.find(s => s.id === sale.showId);
            return {
                ...sale,
                showTitle: show?.title || 'Unknown Show',
                showDate: show?.date || sale.saleDate
            };
        }).sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));
    }, [sales, shows, startDate, endDate]);

    // Calculate metrics
    const metrics = useMemo(() => {
        const totalTickets = periodSales.reduce((acc, s) => acc + Number(s.quantity), 0);
        const totalRevenue = periodSales.reduce((acc, s) => acc + Number(s.totalAmount || 0), 0);
        const uniqueShows = new Set(periodSales.map(s => s.showId)).size;
        const avgPrice = totalTickets > 0 ? (totalRevenue / totalTickets).toFixed(2) : '0.00';
        
        // Top shows
        const showStats = {};
        periodSales.forEach(sale => {
            if (!showStats[sale.showId]) {
                showStats[sale.showId] = {
                    title: sale.showTitle,
                    date: sale.showDate,
                    tickets: 0,
                    revenue: 0
                };
            }
            showStats[sale.showId].tickets += Number(sale.quantity);
            showStats[sale.showId].revenue += Number(sale.totalAmount || 0);
        });
        
        const topShows = Object.values(showStats).sort((a, b) => b.tickets - a.tickets).slice(0, 5);
        
        return { totalTickets, totalRevenue, uniqueShows, avgPrice, topShows };
    }, [periodSales]);

    // Navigation helpers
    const goToPrevious = () => {
        if (viewMode === 'month') {
            if (selectedMonth === 0) {
                setSelectedMonth(11);
                setSelectedYear(y => y - 1);
            } else {
                setSelectedMonth(m => m - 1);
            }
        } else {
            setSelectedYear(y => y - 1);
        }
    };

    const goToNext = () => {
        if (viewMode === 'month') {
            if (selectedMonth === 11) {
                setSelectedMonth(0);
                setSelectedYear(y => y + 1);
            } else {
                setSelectedMonth(m => m + 1);
            }
        } else {
            setSelectedYear(y => y + 1);
        }
    };

    const goToCurrent = () => {
        const now = new Date();
        setSelectedYear(now.getFullYear());
        setSelectedMonth(now.getMonth());
    };

    // Print report
    const handlePrint = () => {
        window.print();
    };

    // Export to CSV (for spreadsheet analysis)
    const handleExport = () => {
        // CSV Header
        const headers = ['Date', 'Customer', 'Show', 'Show Date', 'Quantity', 'Status', 'Payment Method', 'Total Amount', 'Ticket ID'];
        
        // CSV Rows
        const rows = periodSales.map(sale => {
            const person = people.find(p => p.id === sale.personId);
            const show = shows.find(s => s.id === sale.showId);
            return [
                new Date(sale.saleDate).toLocaleDateString('en-US'),
                person?.name || 'Unknown',
                show?.title || 'Unknown',
                show?.date ? new Date(show.date).toLocaleDateString('en-US') : '',
                sale.quantity,
                sale.status,
                sale.paymentMethod || 'Cash',
                sale.totalAmount || 0,
                sale.id || ''
            ];
        });
        
        // Summary rows at the bottom
        rows.push([]); // Empty row
        rows.push(['SUMMARY', '', '', '', '', '', '', '', '']);
        rows.push(['Period:', periodLabel, '', '', '', '', '', '', '']);
        rows.push(['Total Tickets:', metrics.totalTickets, '', '', '', '', '', '', '']);
        rows.push(['Total Revenue:', `$${metrics.totalRevenue}`, '', '', '', '', '', '', '']);
        rows.push(['Shows Attended:', metrics.uniqueShows, '', '', '', '', '', '', '']);
        rows.push(['Avg. Price:', `$${metrics.avgPrice}`, '', '', '', '', '', '', '']);
        rows.push(['Report Generated:', new Date().toLocaleDateString('en-US'), '', '', '', '', '', '', '']);
        
        // Convert to CSV string
        const escapeCSV = (value) => {
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        };
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(escapeCSV).join(','))
        ].join('\n');
        
        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `haletix-report-${periodLabel.replace(/\s+/g, '-').toLowerCase()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <div>
            {/* Header - non-printable controls */}
            <div className="no-print" style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h2 style={{ fontSize: '2rem', margin: '0 0 8px 0' }}>Reports</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Sales analysis and negotiation leverage 📊</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={handlePrint}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 20px',
                                background: 'var(--color-accent)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            <Printer size={18} />
                            Print Report
                        </button>
                        <button
                            onClick={handleExport}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 20px',
                                background: 'rgba(255,255,255,0.1)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            <Download size={18} />
                            Export
                        </button>
                    </div>
                </div>

                {/* Controls */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* View Mode Toggle */}
                    <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px' }}>
                        <button
                            onClick={() => setViewMode('month')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: 'none',
                                background: viewMode === 'month' ? 'var(--color-accent)' : 'transparent',
                                color: viewMode === 'month' ? 'white' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontWeight: viewMode === 'month' ? 600 : 400
                            }}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setViewMode('year')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: 'none',
                                background: viewMode === 'year' ? 'var(--color-accent)' : 'transparent',
                                color: viewMode === 'year' ? 'white' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontWeight: viewMode === 'year' ? 600 : 400
                            }}
                        >
                            Yearly
                        </button>
                    </div>

                    {/* Navigation */}
                    <button
                        onClick={goToPrevious}
                        style={{
                            padding: '8px',
                            background: 'transparent',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '6px',
                            color: 'var(--text-primary)',
                            cursor: 'pointer'
                        }}
                    >
                        <ChevronLeft size={20} />
                    </button>

                    {/* Month Selector (only in month view) */}
                    {viewMode === 'month' && (
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            style={{
                                padding: '8px 12px',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '6px',
                                color: 'white',
                                fontSize: '1rem'
                            }}
                        >
                            {months.map((m, i) => (
                                <option key={i} value={i}>{m}</option>
                            ))}
                        </select>
                    )}

                    {/* Year Selector */}
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        style={{
                            padding: '8px 12px',
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '1rem'
                        }}
                    >
                        {Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i).map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>

                    <button
                        onClick={goToNext}
                        style={{
                            padding: '8px',
                            background: 'transparent',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '6px',
                            color: 'var(--text-primary)',
                            cursor: 'pointer'
                        }}
                    >
                        <ChevronRight size={20} />
                    </button>

                    <button
                        onClick={goToCurrent}
                        style={{
                            marginLeft: 'auto',
                            padding: '8px 16px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '6px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer'
                        }}
                    >
                        Current {viewMode === 'month' ? 'Month' : 'Year'}
                    </button>
                </div>
            </div>

            {/* Report Content - Printable */}
            <div id="report-content">
                {/* Period Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid var(--glass-border)', paddingBottom: '20px' }}>
                    <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0' }}>HaleTix Sales Report</h1>
                    <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {periodLabel}
                    </p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '8px 0 0 0' }}>
                        Generated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>

                {/* Key Metrics */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px',
                    marginBottom: '40px'
                }}>
                    <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '8px' }}>
                            {metrics.totalTickets.toLocaleString()}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <Ticket size={18} />
                            Total Tickets Sold
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-success)', marginBottom: '8px' }}>
                            ${metrics.totalRevenue.toLocaleString()}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <DollarSign size={18} />
                            Total Revenue
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '8px' }}>
                            {metrics.uniqueShows}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <Calendar size={18} />
                            Shows Attended
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-warning)', marginBottom: '8px' }}>
                            ${metrics.avgPrice}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <TrendingUp size={18} />
                            Avg. Ticket Price
                        </div>
                    </div>
                </div>

                {/* Top Shows */}
                {metrics.topShows.length > 0 && (
                    <div style={{ marginBottom: '40px' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrendingUp size={24} />
                            Top Shows by Ticket Volume
                        </h3>
                        <div className="glass-panel" style={{ overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <th style={{ padding: '16px', textAlign: 'left' }}>Show</th>
                                        <th style={{ padding: '16px', textAlign: 'left' }}>Date</th>
                                        <th style={{ padding: '16px', textAlign: 'center' }}>Tickets</th>
                                        <th style={{ padding: '16px', textAlign: 'right' }}>Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {metrics.topShows.map((show, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                            <td style={{ padding: '16px' }}>
                                                <strong>#{index + 1}</strong> {show.title}
                                            </td>
                                            <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                                                {new Date(show.date).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center', fontWeight: 600 }}>
                                                {show.tickets}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right' }}>
                                                ${show.revenue.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Transaction Details */}
                <div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Ticket size={24} />
                        Transaction Details ({periodSales.length} orders)
                    </h3>
                    
                    {periodSales.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <p>No sales recorded for this period.</p>
                        </div>
                    ) : (
                        <div className="glass-panel" style={{ overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Date</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Customer</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Show</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'center' }}>Qty</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {periodSales.map((sale) => (
                                        <tr key={sale.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                            <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>
                                                {new Date(sale.saleDate).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                {people.find(p => p.id === sale.personId)?.name || 'Unknown'}
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                {sale.showTitle}
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                {sale.quantity}
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    background: sale.status === 'Paid' ? 'var(--color-success)' : 'var(--color-warning)',
                                                    color: 'black'
                                                }}>
                                                    {sale.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                ${sale.totalAmount || 0}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <p>HaleTix Theater Management • {periodLabel} Report</p>
                    <p style={{ marginTop: '4px' }}>Generated for negotiation leverage and record keeping</p>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .glass-panel {
                        background: white !important;
                        border: 1px solid #ddd !important;
                        color: black !important;
                    }
                    #report-content {
                        padding: 20px;
                    }
                }
            `}</style>
        </div>
    );
}
