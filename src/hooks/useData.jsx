import React, { createContext, useContext, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLocalStorage } from '../hooks/useLocalStorage';

const DataContext = createContext(null);

export function DataProvider({ children }) {
    const [shows, setShows] = useLocalStorage('haletix_shows', []);
    const [people, setPeople] = useLocalStorage('haletix_people', []);
    const [sales, setSales] = useLocalStorage('haletix_sales', []);
    const [waitlist, setWaitlist] = useLocalStorage('haletix_waitlist', []);

    // --- Shows Actions ---
    const addShow = (show) => {
        const newShow = { ...show, id: uuidv4(), createdAt: new Date().toISOString() };
        setShows((prev) => [...prev, newShow]);
        return newShow;
    };

    const updateShow = (id, updates) => {
        setShows((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    };

    const deleteShow = (id) => {
        // Also remove associated sales? Or keep for record? keeping for record is safer, but maybe flag deleted.
        // For now, simple delete. Use with caution.
        setShows((prev) => prev.filter((s) => s.id !== id));
    };

    // --- People Actions ---
    const addPerson = (person) => {
        const newPerson = { ...person, id: uuidv4(), createdAt: new Date().toISOString() };
        setPeople((prev) => [...prev, newPerson]);
        return newPerson;
    };

    const updatePerson = (id, updates) => {
        setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    };

    const deletePerson = (id) => {
        setPeople((prev) => prev.filter((p) => p.id !== id));
    };

    // --- Sales Actions ---
    const addSale = (sale) => {
        const newSale = {
            ...sale,
            id: uuidv4(),
            saleDate: new Date().toISOString(),
            status: sale.status || 'Reserved'
        };
        setSales((prev) => [...prev, newSale]);
        return newSale;
    };

    const updateSale = (id, updates) => {
        setSales((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    };

    const deleteSale = (id) => {
        setSales((prev) => prev.filter((s) => s.id !== id));
    };

    // --- Waitlist Actions ---
    const addToWaitlist = (showId, personId, quantity = 1, notes = '') => {
        const entry = {
            id: uuidv4(),
            showId,
            personId,
            quantity: Number(quantity),
            notes,
            status: 'Waiting', // Waiting, Notified, Converted, Cancelled
            addedAt: new Date().toISOString(),
            notifiedAt: null,
            convertedAt: null
        };
        setWaitlist((prev) => [...prev, entry]);
        return entry;
    };

    const updateWaitlistEntry = (id, updates) => {
        setWaitlist((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
    };

    const deleteWaitlistEntry = (id) => {
        setWaitlist((prev) => prev.filter((w) => w.id !== id));
    };

    // Convert waitlist entry to sale
    const convertWaitlistToSale = (waitlistEntryId) => {
        const entry = waitlist.find(w => w.id === waitlistEntryId);
        if (!entry) return null;
        
        const show = shows.find(s => s.id === entry.showId);
        if (!show) return null;

        // Create the sale
        const newSale = addSale({
            showId: entry.showId,
            personId: entry.personId,
            quantity: entry.quantity,
            status: 'Reserved',
            paymentMethod: 'Cash',
            totalAmount: show.price * entry.quantity
        });

        // Mark waitlist entry as converted
        updateWaitlistEntry(waitlistEntryId, { 
            status: 'Converted', 
            convertedAt: new Date().toISOString() 
        });

        return newSale;
    };

    const getWaitlistForShow = (showId) => {
        return waitlist
            .filter(w => w.showId === showId && w.status !== 'Converted' && w.status !== 'Cancelled')
            .map(w => ({
                ...w,
                person: people.find(p => p.id === w.personId)
            }))
            .sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));
    };

    const getShowWaitlistStats = (showId) => {
        const showWaitlist = waitlist.filter(w => w.showId === showId);
        return {
            waiting: showWaitlist.filter(w => w.status === 'Waiting').length,
            notified: showWaitlist.filter(w => w.status === 'Notified').length,
            converted: showWaitlist.filter(w => w.status === 'Converted').length,
            totalTicketsWanted: showWaitlist
                .filter(w => w.status === 'Waiting')
                .reduce((acc, w) => acc + Number(w.quantity), 0)
        };
    };

    // --- Utilities ---
    const getShowStats = (showId) => {
        const showSales = sales.filter((s) => s.showId === showId && s.status !== 'Cancelled');
        const soldCount = showSales.reduce((acc, curr) => acc + Number(curr.quantity), 0);
        const revenue = showSales.reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0);

        return { soldCount, revenue };
    };

    const value = useMemo(() => ({
        shows,
        people,
        sales,
        waitlist,
        addShow,
        updateShow,
        deleteShow,
        addPerson,
        updatePerson,
        deletePerson,
        addSale,
        updateSale,
        deleteSale,
        addToWaitlist,
        updateWaitlistEntry,
        deleteWaitlistEntry,
        convertWaitlistToSale,
        getWaitlistForShow,
        getShowWaitlistStats,
        getShowStats
    }), [shows, people, sales, waitlist]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
