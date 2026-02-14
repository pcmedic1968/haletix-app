import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import { Plus, Search, User, Phone, Mail, MapPin, Edit, Trash2, FileText } from 'lucide-react';
import { Modal } from '../../components/Modal';

export function People() {
    const navigate = useNavigate();
    const { people, addPerson, deletePerson, updatePerson } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name) return;

        if (editId) {
            updatePerson(editId, formData);
        } else {
            addPerson(formData);
        }

        setIsModalOpen(false);
        setEditId(null);
        setFormData({ name: '', phone: '', email: '', address: '', notes: '' });
    };

    const handleEdit = (person, e) => {
        e.stopPropagation();
        setEditId(person.id);
        setFormData({
            name: person.name,
            phone: person.phone || '',
            email: person.email || '',
            address: person.address || '',
            notes: person.notes || ''
        });
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditId(null);
        setFormData({ name: '', phone: '', email: '', address: '', notes: '' });
    };

    // Navigate to person history page
    const goToHistory = (personId) => {
        navigate(`/people/${personId}/history`);
    };

    const filteredPeople = people.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.phone && p.phone.includes(searchTerm))
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ fontSize: '2rem' }}>People</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage your audience</p>
                </div>
                <button
                    onClick={() => {
                        setEditId(null);
                        setFormData({ name: '', phone: '', email: '', address: '', notes: '' });
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
                    Add Person
                </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
                <div style={{ position: 'relative', maxWidth: '400px' }}>
                    <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        placeholder="Search by name or phone..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 12px 12px 44px',
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-md)',
                            color: 'white',
                            fontSize: '1rem'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {filteredPeople.map(person => (
                    <div 
                        key={person.id} 
                        className="glass-panel" 
                        style={{ 
                            padding: '24px',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                        onClick={() => goToHistory(person.id)}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: 'var(--color-accent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.25rem',
                                fontWeight: 600
                            }}>
                                {person.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{person.name}</h3>
                            </div>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={(e) => handleEdit(person, e)}
                                    style={{ background: 'transparent', color: 'var(--text-primary)', padding: 4 }}
                                    title="Edit Person"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deletePerson(person.id);
                                    }}
                                    style={{ background: 'transparent', color: 'var(--color-danger)', padding: 4 }}
                                    title="Delete Person"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)' }}>
                            {person.phone && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Phone size={16} /> {person.phone}</div>}
                            {person.email && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Mail size={16} /> {person.email}</div>}
                            {person.address && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><MapPin size={16} /> {person.address}</div>}
                            {person.notes && (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'start', marginTop: '4px' }}>
                                    <FileText size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.9rem', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>{person.notes}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {filteredPeople.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                        <p>No people found.</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Person Modal */}
            <Modal isOpen={isModalOpen} onClose={handleClose} title={editId ? "Edit Contact" : "Add New Contact"}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Name</label>
                        <input
                            style={{
                                width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', fontSize: '1rem'
                            }}
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="e.g. Jane Doe"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Phone</label>
                        <input
                            type="tel"
                            style={{
                                width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white'
                            }}
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="(555) 123-4567"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Email</label>
                        <input
                            type="email"
                            style={{
                                width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white'
                            }}
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Notes</label>
                        <textarea
                            style={{
                                width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white',
                                minHeight: '80px'
                            }}
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
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
                        {editId ? "Update Contact" : "Save Contact"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
