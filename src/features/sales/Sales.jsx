import { useState, useMemo } from 'react';
import { useData } from '../../hooks/useData';
import { Plus, Ticket, Trash2, Printer, Edit, ChevronUp, ChevronDown, ArrowUpDown, Armchair } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { SeatPicker } from '../../components/SeatPicker';

export function Sales() {
    const context = useData();
    const sales = context?.sales || [];
    const shows = context?.shows || [];
    const people = context?.people || [];
    const addSale = context?.addSale || (() => { });
    const getShowStats = context?.getShowStats || (() => ({ soldCount: 0 }));
    const deleteSale = context?.deleteSale || (() => { });
    const updateSale = context?.updateSale || (() => { });
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showSeatPicker, setShowSeatPicker] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        showId: '',
        personId: '',
        quantity: 1,
        status: 'Reserved',
        paymentMethod: 'Cash',
        seats: [] // Array of {row, seat, section}
    });

    // Sorting state
    const [sortConfig, setSortConfig] = useState({
        key: 'saleDate',
        direction: 'desc'
    });

    // Derived state
    const selectedShow = shows.find(s => s.id === formData.showId);
    const stats = selectedShow ? getShowStats(selectedShow.id) : { soldCount: 0 };
    const availableTickets = selectedShow ? selectedShow.maxTickets - stats.soldCount : 0;

    // Generate occupied seats for seat picker
    const occupiedSeats = useMemo(() => {
        if (!selectedShow) return [];
        // Get all seats from existing sales for this show
        const showSales = sales.filter(s => s.showId === selectedShow.id && s.status !== 'Cancelled');
        const seats = [];
        showSales.forEach(sale => {
            if (sale.seats && Array.isArray(sale.seats)) {
                seats.push(...sale.seats);
            }
        });
        return seats;
    }, [sales, selectedShow]);

    // Sort handler
    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Enriched and sorted sales
    const sortedSales = useMemo(() => {
        const enriched = sales
            .filter(s => s && typeof s === 'object')
            .map(sale => {
                const person = people.find(p => p.id === sale.personId);
                const show = shows.find(s => s.id === sale.showId);
                return {
                    ...sale,
                    personName: person?.name || 'Unknown',
                    showTitle: show?.title || 'Unknown',
                    showDate: show?.date || ''
                };
            });

        return enriched.sort((a, b) => {
            let aValue, bValue;
            switch (sortConfig.key) {
                case 'saleDate':
                    aValue = new Date(a.saleDate || 0);
                    bValue = new Date(b.saleDate || 0);
                    break;
                case 'personName':
                    aValue = a.personName.toLowerCase();
                    bValue = b.personName.toLowerCase();
                    break;
                case 'showTitle':
                    aValue = a.showTitle.toLowerCase();
                    bValue = b.showTitle.toLowerCase();
                    break;
                case 'quantity':
                    aValue = Number(a.quantity) || 0;
                    bValue = Number(b.quantity) || 0;
                    break;
                case 'status':
                    aValue = a.status || '';
                    bValue = b.status || '';
                    break;
                case 'totalAmount':
                    aValue = Number(a.totalAmount) || 0;
                    bValue = Number(b.totalAmount) || 0;
                    break;
                default:
                    aValue = a[sortConfig.key];
                    bValue = b[sortConfig.key];
            }
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [sales, shows, people, sortConfig]);

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} style={{ opacity: 0.4, marginLeft: '4px' }} />;
        return sortConfig.direction === 'asc' 
            ? <ChevronUp size={16} style={{ marginLeft: '4px', color: 'var(--color-accent)' }} />
            : <ChevronDown size={16} style={{ marginLeft: '4px', color: 'var(--color-accent)' }} />;
    };

    const SortableHeader = ({ columnKey, children, style = {} }) => (
        <th 
            style={{ padding: '16px', cursor: 'pointer', userSelect: 'none', ...style }}
            onClick={() => handleSort(columnKey)}
        >
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                {children}
                <SortIcon columnKey={columnKey} />
            </span>
        </th>
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.showId || !formData.personId) return;

        if (selectedShow && formData.quantity > availableTickets && formData.status !== 'Waitlist') {
            if (!confirm(`Only ${availableTickets} tickets available. Proceed anyway?`)) return;
        }

        const totalAmount = selectedShow ? selectedShow.price * formData.quantity : 0;

        const saleData = {
            ...formData,
            quantity: Number(formData.quantity),
            totalAmount,
            seats: showSeatPicker ? formData.seats : []
        };

        if (editId) {
            updateSale(editId, saleData);
        } else {
            addSale(saleData);
        }

        setIsModalOpen(false);
        setShowSeatPicker(false);
        setEditId(null);
        setFormData({ showId: '', personId: '', quantity: 1, status: 'Reserved', paymentMethod: 'Cash', seats: [] });
    };

    const handleEdit = (sale) => {
        setEditId(sale.id);
        setFormData({
            showId: sale.showId,
            personId: sale.personId,
            quantity: sale.quantity,
            status: sale.status,
            paymentMethod: sale.paymentMethod || 'Cash',
            seats: sale.seats || []
        });
        setShowSeatPicker(sale.seats && sale.seats.length > 0);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setShowSeatPicker(false);
        setEditId(null);
        setFormData({ showId: '', personId: '', quantity: 1, status: 'Reserved', paymentMethod: 'Cash', seats: [] });
    };

    const handleShowChange = (showId) => {
        setFormData({ ...formData, showId, seats: [] });
        setShowSeatPicker(false);
    };

    const handleSeatToggle = (seats) => {
        setFormData({ ...formData, seats, quantity: seats.length });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Unknown';
        try {
            return new Date(dateStr).toLocaleDateString();
        } catch (e) {
            return 'Invalid Date';
        }
    };

    const formatSeats = (seats) => {
        if (!seats || seats.length === 0) return null;
        const section = seats[0]?.section || 'SOUTH';
        const seatList = seats.map(s => typeof s.row === 'string' ? `${s.row}${s.seat}` : `${String.fromCharCode(64 + s.row)}${s.seat}`).join(', ');
        return `${section} ${seatList}`;
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ fontSize: '2rem' }}>Sales Box Office</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Process tickets and reservations</p>
                </div>
                <button
                    onClick={() => {
                        setEditId(null);
                        setFormData({ showId: '', personId: '', quantity: 1, status: 'Reserved', paymentMethod: 'Cash', seats: [] });
                        setShowSeatPicker(false);
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
                    New Sale
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)' }}>
                            <SortableHeader columnKey="saleDate">Date</SortableHeader>
                            <SortableHeader columnKey="personName">Customer</SortableHeader>
                            <SortableHeader columnKey="showTitle">Show</SortableHeader>
                            <SortableHeader columnKey="quantity" style={{ textAlign: 'center' }}>Qty</SortableHeader>
                            <SortableHeader columnKey="status">Status</SortableHeader>
                            <SortableHeader columnKey="totalAmount" style={{ textAlign: 'right' }}>Total</SortableHeader>
                            <th style={{ padding: '16px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedSales.map(sale => (
                            <tr key={sale.id || Math.random().toString()} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <td style={{ padding: '16px' }}>{formatDate(sale.saleDate)}</td>
                                <td style={{ padding: '16px' }}>
                                    <div>{sale.personName}</div>
                                    {sale.seats && sale.seats.length > 0 && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                            <Armchair size={10} style={{ display: 'inline', marginRight: '3px' }} />
                                            {formatSeats(sale.seats)}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '16px' }}>{sale.showTitle}</td>
                                <td style={{ padding: '16px', textAlign: 'center' }}>{sale.quantity || 0}</td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{
                                        padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem',
                                        background: sale.status === 'Paid' ? 'var(--color-success)' :
                                            sale.status === 'Reserved' ? 'var(--color-warning)' : 'var(--glass-bg)',
                                        color: 'black'
                                    }}>
                                        {sale.status || 'N/A'}
                                    </span>
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right', fontWeight: 500 }}>
                                    ${sale.totalAmount || 0}
                                </td>
                                <td style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => {
                                            const win = window.open('', '', 'width=450,height=700');
                                            if (win) {
                                                const seatsInfo = sale.seats?.length > 0 
                                                    ? `<p><strong>Seats:</strong> ${formatSeats(sale.seats)}</p>` 
                                                    : '';
                                                // Get show date/time from shows data
                                                const show = shows.find(s => s.id === sale.showId);
                                                const showDateTime = show ? `
                                                    <div style="color: #666; font-size: 14px; margin-top: 4px;">
                                                        ${new Date(show.date).toLocaleDateString('en-US', { 
                                                            weekday: 'long', 
                                                            month: 'long', 
                                                            day: 'numeric', 
                                                            year: 'numeric' 
                                                        })}
                                                        ${show.time ? ` @ ${(() => {
                                                            const [h, m] = show.time.split(':');
                                                            const hour = parseInt(h, 10);
                                                            const ampm = hour >= 12 ? 'PM' : 'AM';
                                                            const h12 = hour % 12 || 12;
                                                            return `${h12}:${m} ${ampm}`;
                                                        })()}` : ''}
                                                    </div>
                                                ` : '';
                                                win.document.write(`
                                                    <!DOCTYPE html>
                                                    <html>
                                                    <head><title>HaleTix Receipt</title></head>
                                                    <body style="font-family: sans-serif; padding: 24px; background: white; color: #333;">
                                                        <div style="text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 20px;">
                                                            <h1 style="margin: 0; color: #6366f1;">HaleTix</h1>
                                                            <div style="color: #666; font-size: 12px;">Theater Ticket Receipt</div>
                                                        </div>
                                                        <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                                                            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6366f1; font-weight: 600; margin-bottom: 8px;">Show Information</div>
                                                            <div style="font-size: 16px; font-weight: 600;">${sale.showTitle}</div>
                                                            ${showDateTime}
                                                        </div>
                                                        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #6366f1; font-weight: 600; margin-bottom: 8px;">Customer</div>
                                                            <div>${sale.personName}</div>
                                                        </div>
                                                        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                                                            <div style="margin-bottom: 6px;"><strong>Date:</strong> ${new Date(sale.saleDate).toLocaleDateString()}</div>
                                                            <div style="margin-bottom: 6px;"><strong>Ticket ID:</strong> ${(sale.id || '').slice(0, 8).toUpperCase()}</div>
                                                            <div style="margin-bottom: 6px;"><strong>Quantity:</strong> ${sale.quantity} tickets</div>
                                                            <div><strong>Status:</strong> ${sale.status}</div>
                                                        </div>
                                                        ${seatsInfo}
                                                        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; text-align: center; margin-top: 16px;">
                                                            <div style="font-size: 18px; font-weight: 700; color: #10b981;">Total: $${sale.totalAmount}</div>
                                                        </div>
                                                        <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px;">
                                                            <p>Thank you!</p>
                                                        </div>
                                                        <script>window.print();</script>
                                                    </body>
                                                    </html>
                                                `);
                                                win.document.close();
                                            }
                                        }}
                                        style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}
                                        title="Print Receipt"
                                    >
                                        <Printer size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(sale)}
                                        style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}
                                        title="Edit Sale"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => { if (confirm('Delete this sale?')) deleteSale(sale.id) }}
                                        style={{ background: 'transparent', color: 'var(--color-danger)', border: 'none', cursor: 'pointer' }}
                                        title="Delete Sale"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {sortedSales.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No sales recorded.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Sale Modal */}
            <Modal isOpen={isModalOpen} onClose={handleClose} title={editId ? "Edit Sale" : "New Ticket Sale"}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Step 1: Select Customer */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Select Customer</label>
                        <select
                            style={{
                                width: '100%', padding: '12px', background: '#1e293b',
                                border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', fontSize: '1rem'
                            }}
                            value={formData.personId}
                            onChange={e => setFormData({ ...formData, personId: e.target.value })}
                            required
                        >
                            <option value="">-- Choose a Customer --</option>
                            {[...people].sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Step 2: Select Show */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Select Show</label>
                        <select
                            style={{
                                width: '100%', padding: '12px', background: '#1e293b',
                                border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', fontSize: '1rem'
                            }}
                            value={formData.showId}
                            onChange={e => handleShowChange(e.target.value)}
                            required
                        >
                            <option value="">-- Choose a Show --</option>
                            {shows.map(s => (
                                <option key={s.id} value={s.id}>{s.title} ({new Date(s.date).toLocaleDateString()})</option>
                            ))}
                        </select>
                        {selectedShow && (
                            <div style={{ 
                                marginTop: '8px',
                                fontSize: '0.85rem', 
                                color: availableTickets > 0 ? 'var(--color-success)' : 'var(--color-danger)',
                            }}>
                                {availableTickets} tickets available
                            </div>
                        )}
                    </div>

                    {/* Step 3: Quantity */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Quantity</label>
                        <input
                            type="number" min="1"
                            style={{
                                width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white'
                            }}
                            value={formData.quantity}
                            onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                            required
                        />
                    </div>

                    {/* Step 4: Status & Payment */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Status</label>
                            <select
                                style={{
                                    width: '100%', padding: '12px', background: '#1e293b',
                                    border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white'
                                }}
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="Reserved">Reserved</option>
                                <option value="Paid">Paid</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Waitlist">Waitlist</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Payment</label>
                            <select
                                style={{
                                    width: '100%', padding: '12px', background: '#1e293b',
                                    border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white'
                                }}
                                value={formData.paymentMethod}
                                onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                            >
                                <option value="Cash">Cash</option>
                                <option value="Check">Check</option>
                                <option value="Venmo">Venmo</option>
                                <option value="Credit Card">Credit Card</option>
                            </select>
                        </div>
                    </div>

                    {/* Step 5: Pick Seats (optional, only if show selected) */}
                    {selectedShow && (
                        <div style={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            <button
                                type="button"
                                onClick={() => setShowSeatPicker(!showSeatPicker)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '12px 20px',
                                    background: showSeatPicker ? 'var(--color-accent)' : 'transparent',
                                    border: '2px solid var(--color-accent)',
                                    borderRadius: '8px',
                                    color: showSeatPicker ? 'white' : 'var(--color-accent)',
                                    cursor: 'pointer',
                                    fontSize: '0.95rem',
                                    fontWeight: 600
                                }}
                            >
                                <Armchair size={20} />
                                {showSeatPicker ? 'Hide Seat Picker' : 'Pick Seats'}
                            </button>
                            
                            {showSeatPicker && (
                                <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: '8px' }}>
                                    <SeatPicker
                                        rowConfig={[
                                            { name: 'B', seats: 9, leftSeats: 5 },
                                            { name: 'C', seats: 12, leftSeats: 6 },
                                            { name: 'D', seats: 9, leftSeats: 2 }
                                        ]}
                                        alignAisle={true}
                                        disabledSeats={occupiedSeats}
                                        selectedSeats={formData.seats}
                                        onSeatToggle={handleSeatToggle}
                                        maxSelection={formData.quantity}
                                        section={selectedShow.section || 'South'}
                                        getSeatInfo={null}
                                    />
                                    <div style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.2)', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                        Selected: <strong>{formData.seats?.length || 0} / {formData.quantity}</strong> seats
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 6: Complete Sale */}
                    <button
                        type="submit"
                        style={{
                            marginTop: '10px',
                            background: 'var(--color-accent)',
                            color: 'white',
                            padding: '16px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '1rem'
                        }}
                    >
                        {editId ? "Update Sale" : "Complete Sale"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
