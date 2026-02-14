import { useRef } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { LayoutDashboard, Users, Ticket, Calendar, Download, Upload, FileText } from 'lucide-react';

export function Layout() {
    const { shows, people, sales } = useData();
    const fileInputRef = useRef(null);
    const location = useLocation();

    const handleExport = async () => {
        const data = {
            shows,
            people,
            sales,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        const jsonString = JSON.stringify(data, null, 2);

        // Format: YYYY-MM-DD_HH-mm-ss
        const now = new Date();
        const timestamp = now.toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
        const filename = `haletix_backup_${timestamp}.json`;

        try {
            // Try File System Access API (Chrome/Edge/Opera)
            if ('showSaveFilePicker' in window) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(jsonString);
                await writable.close();
                return;
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                return; // User cancelled
            }
            console.error('File System Access API failed, falling back to download link:', err);
        }

        // Fallback or if API not supported
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Basic validation
                if (data.shows && Array.isArray(data.shows)) {
                    localStorage.setItem('haletix_shows', JSON.stringify(data.shows));
                }
                if (data.people && Array.isArray(data.people)) {
                    localStorage.setItem('haletix_people', JSON.stringify(data.people));
                }
                if (data.sales && Array.isArray(data.sales)) {
                    localStorage.setItem('haletix_sales', JSON.stringify(data.sales));
                }

                alert('Data imported successfully! The page will now reload.');
                window.location.reload();
            } catch (error) {
                console.error('Import failed:', error);
                alert('Failed to import data. Invalid JSON file.');
            }
        };
        reader.readAsText(file);
    };

    const navItems = [
        { id: '', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'shows', label: 'Shows', icon: Calendar },
        { id: 'people', label: 'People', icon: Users },
        { id: 'sales', label: 'Sales', icon: Ticket },
        { id: 'reports', label: 'Reports', icon: FileText },
    ];

    // Check if we're on a detail page to highlight parent nav
    const isActivePath = (path) => {
        if (path === '') {
            return location.pathname === '/' || location.pathname === '/dashboard';
        }
        return location.pathname.startsWith(`/${path}`);
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside
                className="glass-panel"
                style={{
                    width: '280px',
                    margin: '20px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'sticky',
                    top: '20px',
                    height: 'calc(100vh - 40px)'
                }}
            >
                <div style={{ marginBottom: '40px', paddingLeft: '12px' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>HaleTix</h2>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Theater Manager</span>
                </div>

                <nav style={{ flex: 1 }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = isActivePath(item.id);

                            return (
                                <li key={item.id} style={{ marginBottom: '8px' }}>
                                    <NavLink
                                        to={`/${item.id}`}
                                        end={item.id === ''}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px 16px',
                                            borderRadius: 'var(--radius-md)',
                                            background: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                                            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                            textAlign: 'left',
                                            border: isActive ? '1px solid var(--glass-border)' : '1px solid transparent',
                                            fontWeight: isActive ? 600 : 400,
                                            textDecoration: 'none'
                                        }}
                                    >
                                        <Icon size={20} />
                                        {item.label}
                                    </NavLink>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                    <button
                        onClick={handleExport}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '10px',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--glass-border)',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                        className="hover-bright"
                    >
                        <Download size={16} />
                        Export Data
                    </button>

                    <input
                        type="file"
                        accept=".json"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleImport}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '10px',
                            marginTop: '8px',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--glass-border)',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                        className="hover-bright"
                    >
                        <Upload size={16} />
                        Import Data
                    </button>

                    <div style={{
                        marginTop: '8px',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        textAlign: 'center'
                    }}>
                        Saved to Local Storage
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '20px 40px 20px 0' }}>
                <Outlet />
            </main>
        </div>
    );
}
