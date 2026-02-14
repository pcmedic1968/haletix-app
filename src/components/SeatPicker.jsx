import { useState, useMemo, useRef } from 'react';
import { X, Armchair, User } from 'lucide-react';

// Theater seat picker with option for straight aligned aisle
// When alignAisle=true, all row aisles line up vertically (centered on widest row)
export function SeatPicker({ 
    rowConfig = [],
    alignAisle = false,
    disabledSeats = [],
    selectedSeats = [], 
    onSeatToggle,
    maxSelection = 10,
    section = 'South',
    getSeatInfo = null  // Function: (row, seat) => { customerName, status } or null
}) {
    const [hoveredSeat, setHoveredSeat] = useState(null);
    const [activeTooltip, setActiveTooltip] = useState(null);

    // Build normalized rows with optional aisle alignment
    const { rows, maxLeftSeats, maxRightSeats } = useMemo(() => {
        if (!rowConfig || !Array.isArray(rowConfig)) return { rows: [], maxLeftSeats: 0, maxRightSeats: 0 };
        
        // Find max seats on each side for alignment
        const leftCounts = rowConfig.map(r => r.leftSeats || Math.ceil(r.seats / 2));
        const rightCounts = rowConfig.map((r, i) => (r.seats || 0) - leftCounts[i]);
        const maxLeft = Math.max(...leftCounts);
        const maxRight = Math.max(...rightCounts);
        
        const normalizedRows = rowConfig.map((row, idx) => {
            const totalSeats = row.seats || 0;
            const leftSeats = row.leftSeats || Math.ceil(totalSeats / 2);
            const rightSeats = totalSeats - leftSeats;
            
            // Left block: highest numbers first (closest to aisle)
            const leftBlock = Array.from({length: leftSeats}, (_, i) => totalSeats - i);
            
            // Right block: lower numbers
            const rightBlock = Array.from({length: rightSeats}, (_, i) => rightSeats - i);
            
            // Calculate offsets for aisle alignment
            // If alignAisle, pad shorter sides so aisles line up
            const leftPad = alignAisle ? (maxLeft - leftSeats) * 37 : 0; // 32px + 5px gap
            const rightPad = alignAisle ? (maxRight - rightSeats) * 37 : 0;
            
            return {
                name: row.name,
                totalSeats,
                leftSeats,
                rightSeats,
                leftBlock,
                rightBlock,
                leftPad,
                rightPad,
            };
        });
        
        return { rows: normalizedRows, maxLeftSeats: maxLeft, maxRightSeats: maxRight };
    }, [rowConfig, alignAisle]);

    const getSeatStatus = (rowName, seatNum) => {
        if (disabledSeats.some(s => s.row === rowName && s.seat === seatNum)) return 'disabled';
        if (selectedSeats.some(s => s.row === rowName && s.seat === seatNum)) return 'selected';
        return 'available';
    };

    const handleSeatClick = (rowName, seatNum) => {
        const isDisabled = disabledSeats.some(s => s.row === rowName && s.seat === seatNum);
        if (isDisabled) return;

        const isSelected = selectedSeats.some(s => s.row === rowName && s.seat === seatNum);
        
        if (isSelected) {
            onSeatToggle(selectedSeats.filter(s => !(s.row === rowName && s.seat === seatNum)));
        } else {
            if (selectedSeats.length < maxSelection) {
                onSeatToggle([...selectedSeats, { row: rowName, seat: seatNum, section }]);
            }
        }
    };

    const statusColors = {
        available: 'rgba(99, 102, 241, 0.3)',
        selected: 'var(--color-accent)',
        disabled: 'rgba(255, 255, 255, 0.15)'
    };

    const statusBorders = {
        available: '1px solid rgba(99, 102, 241, 0.5)',
        selected: '2px solid #a5b4fc',
        disabled: '1px solid rgba(255, 255, 255, 0.2)'
    };

    // Calculate totals
    const totalSeats = rows.reduce((acc, r) => acc + r.totalSeats, 0);
    const soldCount = disabledSeats.length;
    const availableCount = totalSeats - soldCount;

    return (
        <div style={{ padding: '24px', position: 'relative' }}>
            {/* Stage Indicator */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                    display: 'inline-block',
                    padding: '12px 100px',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                    borderRadius: '50% 50% 0 0 / 30% 30% 0 0',
                    border: '2px solid var(--glass-border)',
                    borderBottom: 'none'
                }}>
                    <span style={{ fontSize: '0.9rem', letterSpacing: '4px', color: 'var(--text-secondary)' }}>STAGE</span>
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '20px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.3)', border: '1px solid rgba(99, 102, 241, 0.5)' }} />
                    <span>Available ({availableCount})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'var(--color-accent)', border: '2px solid #a5b4fc' }} />
                    <span>Selected ({selectedSeats.length}{maxSelection > 0 ? `/${maxSelection}` : ''})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255, 255, 255, 0.2)' }} />
                    <span>Sold ({soldCount})</span>
                </div>
            </div>

            {/* Seat Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                {rows.map((row) => {
                    return (
                        <div key={row.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* Row Label Left */}
                            <div style={{ width: '28px', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                {row.name}
                            </div>
                            
                            {/* Seats Container */}
                            <div style={{ display: 'flex', position: 'relative' }}>
                                {/* Left Block - with padding for alignment */}
                                <div style={{ display: 'flex', gap: '5px', paddingLeft: `${row.leftPad}px` }}>
                                    {row.leftBlock.map((seatNum) => {
                                        const status = getSeatStatus(row.name, seatNum);
                                        const isHovered = hoveredSeat?.row === row.name && hoveredSeat?.seat === seatNum;
                                        const seatInfo = getSeatInfo ? getSeatInfo(row.name, seatNum) : null;
                                        return (
                                            <SeatButton
                                                key={`${row.name}-${seatNum}`}
                                                rowName={row.name}
                                                seatNum={seatNum}
                                                status={status}
                                                isHovered={isHovered}
                                                seatInfo={seatInfo}
                                                onClick={handleSeatClick}
                                                onHover={setHoveredSeat}
                                                onTooltip={setActiveTooltip}
                                                activeTooltip={activeTooltip}
                                                statusColors={statusColors}
                                                statusBorders={statusBorders}
                                            />
                                        );
                                    })}
                                </div>
                                
                                {/* Aisle Gap - Fixed position for alignment */}
                                <div style={{ 
                                    width: '32px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: alignAisle ? 'var(--color-accent)' : 'var(--text-muted)',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold'
                                }}>
                                    ┃
                                </div>
                                
                                {/* Right Block */}
                                <div style={{ display: 'flex', gap: '5px', paddingRight: `${row.rightPad}px` }}>
                                    {row.rightBlock.map((seatNum) => {
                                        const status = getSeatStatus(row.name, seatNum);
                                        const isHovered = hoveredSeat?.row === row.name && hoveredSeat?.seat === seatNum;
                                        const seatInfo = getSeatInfo ? getSeatInfo(row.name, seatNum) : null;
                                        return (
                                            <SeatButton
                                                key={`${row.name}-${seatNum}`}
                                                rowName={row.name}
                                                seatNum={seatNum}
                                                status={status}
                                                isHovered={isHovered}
                                                seatInfo={seatInfo}
                                                onClick={handleSeatClick}
                                                onHover={setHoveredSeat}
                                                onTooltip={setActiveTooltip}
                                                activeTooltip={activeTooltip}
                                                statusColors={statusColors}
                                                statusBorders={statusBorders}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                            
                            {/* Row Label Right */}
                            <div style={{ width: '28px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                {row.name}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Selected Seats Display */}
            {selectedSeats.length > 0 && (
                <div style={{ marginTop: '24px', padding: '14px 16px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontWeight: 600 }}>Selected ({selectedSeats.length})</span>
                        <button onClick={() => onSeatToggle([])} style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.85rem' }}>
                            Clear all
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {selectedSeats.map((seat, idx) => (
                            <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'var(--color-accent)', borderRadius: '12px', fontSize: '0.8rem', color: 'white' }}>
                                {typeof seat.row === 'string' ? `${seat.row}${seat.seat}` : `R${seat.row}S${seat.seat}`}
                                <button onClick={() => handleSeatClick(seat.row, seat.seat)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 0, display: 'flex', marginLeft: '2px' }}>
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Individual seat button with inline tooltip relative to seat position
function SeatButton({ 
    rowName, 
    seatNum, 
    status, 
    isHovered, 
    seatInfo,
    onClick,
    onHover,
    onTooltip,
    activeTooltip,
    statusColors,
    statusBorders
}) {
    const buttonRef = useRef(null);
    const [showTooltip, setShowTooltip] = useState(false);

    const handleMouseEnter = () => {
        onHover({ row: rowName, seat: seatNum });
        if (seatInfo) {
            setShowTooltip(true);
            onTooltip({ row: rowName, seat: seatNum, ...seatInfo });
        }
    };

    const handleMouseLeave = () => {
        onHover(null);
        setShowTooltip(false);
        onTooltip(null);
    };

    return (
        <div style={{ position: 'relative' }}>
            <button
                ref={buttonRef}
                onClick={() => onClick(rowName, seatNum)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                disabled={status === 'disabled' && !seatInfo}
                style={{
                    width: '32px',
                    height: '28px',
                    borderRadius: '4px 4px 2px 2px',
                    background: statusColors[status],
                    border: statusBorders[status],
                    cursor: status === 'disabled' ? (seatInfo ? 'help' : 'not-allowed') : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    color: status === 'selected' ? 'white' : 'var(--text-primary)',
                    fontWeight: status === 'selected' ? 600 : 400,
                    transform: isHovered && status !== 'disabled' ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.12s',
                    position: 'relative'
                }}
                title={seatInfo ? `${seatInfo.customerName}` : `${rowName}${seatNum}`}
            >
                {status === 'selected' ? <Armchair size={14} /> : seatNum}
            </button>
            
            {/* Tooltip inline with seat button */}
            {showTooltip && seatInfo && (
                <div style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 8px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(20, 20, 30, 0.95)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    zIndex: 1000,
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    minWidth: '140px'
                }}>
                    <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-muted)',
                        marginBottom: '2px'
                    }}>
                        Seat {rowName}{seatNum}
                    </div>
                    <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'white'
                    }}>
                        <User size={14} color="var(--color-accent)" />
                        {seatInfo.customerName}
                    </div>
                    {/* Arrow */}
                    <div style={{
                        position: 'absolute',
                        bottom: -6,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '6px solid rgba(20, 20, 30, 0.95)'
                    }} />
                </div>
            )}
        </div>
    );
}
