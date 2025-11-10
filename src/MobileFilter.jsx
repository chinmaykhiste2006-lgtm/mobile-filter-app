import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api/mobile';

const initialFilters = {
    // Dropdowns
    Brand: '',
    RAM: '', // Corrected to RAM
    Front_Camera: '',
    Back_Camera: '',
    Processor: '',
    Launched_Year: '',
    // Range inputs (min/max)
    min_Price: '', max_Price: '',
    min_Battery_Capacity: '', max_Battery_Capacity: '',
    min_Mobile_Weight: '', max_Mobile_Weight: '',
    min_Screen_Size: '', max_Screen_Size: '',
    // Search
    Model: '',
    view: 'all' // Added for view toggle: 'all' or 'favorites'
};

const styles = {
    // Main Layout Styles
    container: {
        display: 'flex',
        fontFamily: 'Roboto, sans-serif',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
    },
    sidebar: {
        padding: '25px',
        borderRight: '1px solid #dee2e6',
        width: '320px',
        minWidth: '300px',
        backgroundColor: '#ffffff',
        boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
        overflowY: 'auto',
    },
    resultsArea: {
        flexGrow: 1,
        padding: '25px',
        backgroundColor: '#f8f9fa',
        overflowX: 'auto', // Allows table scrolling for many columns
    },
    
    // Filter Component Styles
    filterGroup: {
        marginBottom: '20px',
        padding: '10px',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
    },
    label: {
        display: 'block',
        fontWeight: '600',
        marginBottom: '5px',
        color: '#495057',
        fontSize: '14px',
    },
    input: {
        width: '100%',
        padding: '8px',
        marginBottom: '10px',
        border: '1px solid #ced4da',
        borderRadius: '4px',
        boxSizing: 'border-box',
    },
    select: {
        width: '100%',
        padding: '8px',
        marginBottom: '10px',
        border: '1px solid #ced4da',
        borderRadius: '4px',
        boxSizing: 'border-box',
    },
    rangeContainer: {
        display: 'flex',
        gap: '10px',
        marginBottom: '10px',
    },
    
    // Table Styles
    table: {
        minWidth: '1300px', // Ensures enough space for all columns
        borderCollapse: 'collapse',
        marginTop: '20px',
        backgroundColor: '#ffffff',
        boxShadow: '0 0 10px rgba(0,0,0,0.05)',
        borderRadius: '8px',
        overflow: 'hidden',
    },
    th: {
        backgroundColor: '#343a40',
        color: '#ffffff',
        padding: '12px 10px',
        textAlign: 'left',
        fontSize: '14px',
        textTransform: 'uppercase',
    },
    td: {
        padding: '12px 10px',
        borderBottom: '1px solid #f2f2f2',
        fontSize: '13px',
        color: '#343a40',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '150px' // Limit width for long text fields
    },
    tr: {
        transition: 'background-color 0.3s ease',
    },
    
    // Button Style
    button: {
        backgroundColor: '#dc3545', // Red color for danger/clear
        color: 'white',
        border: 'none',
        padding: '10px 15px',
        borderRadius: '4px',
        cursor: 'pointer',
        width: '100%',
        marginTop: '20px',
        fontWeight: 'bold',
        transition: 'background-color 0.3s ease',
    },
    favoriteButton: {
        backgroundColor: '#007bff',
        marginBottom: '10px',
    },
    likeButton: (isLiked) => ({
        cursor: 'pointer',
        padding: '5px 8px',
        borderRadius: '4px',
        border: '1px solid',
        borderColor: isLiked ? '#dc3545' : '#ccc',
        backgroundColor: isLiked ? '#dc3545' : '#f8f9fa',
        color: isLiked ? 'white' : '#dc3545',
        fontWeight: 'bold',
        transition: 'all 0.2s ease',
        fontSize: '12px',
        whiteSpace: 'nowrap',
    })
};


const MobileFilter = () => {
    const [filters, setFilters] = useState(initialFilters);
    const [mobiles, setMobiles] = useState([]);
    const [filterOptions, setFilterOptions] = useState({});
    const [loading, setLoading] = useState(false);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [likedIds, setLikedIds] = useState(new Set()); // Stores IDs of liked mobiles

    // Function to fetch the list of IDs the user has liked
    const fetchLikedIds = async () => {
        try {
            // Fetch all favorites to get the list of IDs
            const response = await axios.get(`${API_BASE_URL}/favorites`);
            // Extract only the IDs from the full mobile objects
            const ids = new Set(response.data.map(m => m.id));
            setLikedIds(ids);
        } catch (error) {
            console.error('Failed to fetch liked IDs:', error);
        }
    };

    // Initial load: Fetch options and current liked IDs
    useEffect(() => {
        fetchLikedIds();

        const fetchOptions = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/options`);
                const options = response.data;
                setFilterOptions(options);
            } catch (error) {
                console.error('Error fetching filter options:', error);
            } finally {
                setOptionsLoading(false);
            }
        };
        fetchOptions();
    }, []);

    // --- Fetch Filtered Data (Debounced) ---
    useEffect(() => {
        if (optionsLoading) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                let response;
                
                if (filters.view === 'favorites') {
                    // Call the new favorites endpoint (no other filters apply here)
                    response = await axios.get(`${API_BASE_URL}/favorites`);
                } else {
                    // Standard filtering: exclude the 'view' key from the filter object
                    const { view, ...restFilters } = filters;
                    const activeFilters = Object.fromEntries(
                        Object.entries(restFilters).filter(([_, v]) => v !== '')
                    );
                    const queryParams = new URLSearchParams(activeFilters).toString();
                    response = await axios.get(`${API_BASE_URL}/filter?${queryParams}`);
                }
                
                setMobiles(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        const handler = setTimeout(() => {
            fetchData();
        }, 300); 

        return () => {
            clearTimeout(handler);
        };
    }, [filters, optionsLoading]);


    // --- Like/Unlike Handler ---
    const handleLikeToggle = async (mobileId) => {
        const isLiked = likedIds.has(mobileId);
        
        try {
            const response = await axios.post(`${API_BASE_URL}/like`, {
                mobileId,
                isLiked: !isLiked // New state is the opposite of current state
            });

            if (response.data.success) {
                // 1. Update the local set of liked IDs
                setLikedIds(prev => {
                    const newIds = new Set(prev);
                    isLiked ? newIds.delete(mobileId) : newIds.add(mobileId);
                    return newIds;
                });
                
                // 2. If the user is currently viewing 'favorites', force a table update
                if (filters.view === 'favorites') {
                    // Trigger useEffect by creating a shallow copy of filters
                    setFilters(prev => ({...prev}));
                }
            }
        } catch (error) {
            console.error('Toggle like failed:', error);
            alert("Failed to update like status. Check server connection.");
        }
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleClearFilters = () => {
        // Clear all filters but retain the current view (all or favorites)
        setFilters({ ...initialFilters, view: filters.view });
    };

    const handleViewToggle = (view) => {
        setFilters({ ...initialFilters, view });
    };

    const renderFilterInput = (key, options) => {
        const label = key.replace(/_/g, ' ');

        // Dropdown (Select) Filter
        if (Array.isArray(options)) {
            return (
                <div style={styles.filterGroup} key={key}>
                    <label style={styles.label} htmlFor={key}>{label}:</label>
                    <select id={key} name={key} value={filters[key]} onChange={handleChange} style={styles.select}>
                        <option value="">All {label}</option>
                        {options.map(option => (
                            <option key={option} value={option}>
                                {key === 'RAM' ? `${option} GB` : option}
                            </option>
                        ))}
                    </select>
                </div>
            );
        } 
        
        // Range (Min/Max) Filter
        else if (options && typeof options === 'object' && 'min' in options && 'max' in options) {
            const minKey = `min_${key}`;
            const maxKey = `max_${key}`;
            const unit = key === 'Mobile_Weight' ? 'g' : (key === 'Battery_Capacity' ? 'mAh' : (key === 'Screen_Size' ? 'in' : ''));

            return (
                <div style={styles.filterGroup} key={key}>
                    <label style={styles.label}>{label}:</label>
                    <div style={styles.rangeContainer}>
                        <input
                            type="number"
                            name={minKey}
                            value={filters[minKey]}
                            onChange={handleChange}
                            placeholder={`Min ${options.min} ${unit}`}
                            style={styles.input}
                        />
                        <input
                            type="number"
                            name={maxKey}
                            value={filters[maxKey]}
                            onChange={handleChange}
                            placeholder={`Max ${options.max} ${unit}`}
                            style={styles.input}
                        />
                    </div>
                </div>
            );
        }
        return null;
    };


    if (optionsLoading) return <div style={{ padding: '20px', fontFamily: 'Arial' }}>Loading Filter Options...</div>;

    return (
        <div style={styles.container}>
            {/* Filter Sidebar */}
            <div style={styles.sidebar}>
                <h2>Mobile Filters</h2>

                {/* New View Toggle Buttons */}
                <div style={{...styles.filterGroup, padding: '15px', display: 'flex', flexDirection: 'column'}}>
                    <button 
                        style={{ 
                            ...styles.favoriteButton, 
                            backgroundColor: filters.view === 'all' ? '#0056b3' : '#6c757d', 
                            marginBottom: '10px' 
                        }}
                        onClick={() => handleViewToggle('all')}
                    >
                        View All Mobiles
                    </button>
                    <button 
                        style={{ 
                            ...styles.favoriteButton, 
                            backgroundColor: filters.view === 'favorites' ? '#0056b3' : '#6c757d' 
                        }}
                        onClick={() => handleViewToggle('favorites')}
                    >
                        View {likedIds.size} Liked Mobiles
                    </button>
                </div>

                {/* Show filters only when viewing 'all' mobiles */}
                {filters.view === 'all' && (
                    <>
                        {/* Model Search */}
                        <div style={styles.filterGroup}>
                            <label style={styles.label} htmlFor="Model">Search Model Name:</label>
                            <input
                                type="text"
                                name="Model"
                                id="Model"
                                value={filters.Model}
                                onChange={handleChange}
                                placeholder="e.g., iPhone 16 or Galaxy"
                                style={styles.input}
                            />
                        </div>
                        
                        {/* Dynamically Render Dropdown and Range Filters */}
                        {/* Filter out 'view' and any key not found in the initial options object */}
                        {Object.entries(filterOptions).map(([key, options]) => renderFilterInput(key, options))}
                        
                        <button onClick={handleClearFilters} style={styles.button}>
                            Clear All Filters
                        </button>
                    </>
                )}
            </div>

            {/* Results Table */}
            <div style={styles.resultsArea}>
                <h1>{filters.view === 'favorites' ? 'Your Favorite Mobiles' : 'Mobile Catalog'}</h1>
                <h3>Showing {loading ? '...' : mobiles.length} Results</h3>
                
                {loading ? (
                    <div style={{ color: '#007bff', fontWeight: 'bold' }}>Loading Data...</div>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Action</th> {/* New Action Column */}
                                <th style={styles.th}>Brand</th>
                                <th style={styles.th}>Model</th>
                                <th style={styles.th}>Price (INR)</th>
                                <th style={styles.th}>RAM</th>
                                <th style={styles.th}>Processor</th>
                                <th style={styles.th}>Battery</th>
                                <th style={styles.th}>Screen</th>
                                <th style={styles.th}>Weight</th>
                                <th style={styles.th}>Front Cam</th>
                                <th style={styles.th}>Back Cam</th>
                                <th style={styles.th}>Year</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mobiles.length === 0 ? (
                                <tr>
                                    <td colSpan="12" style={{ ...styles.td, textAlign: 'center', color: '#dc3545' }}>
                                        {filters.view === 'favorites' ? 'You have no liked mobiles yet.' : 'No mobiles match your current filter criteria.'}
                                    </td>
                                </tr>
                            ) : (
                                mobiles.map(mobile => {
                                    // Check if the mobile's ID is in our set of liked IDs
                                    const isLiked = likedIds.has(mobile.id);
                                    return (
                                        <tr key={mobile.id || `${mobile.Brand}-${mobile.Model}`} style={styles.tr}>
                                            {/* New Action Cell */}
                                            <td style={styles.td}>
                                                <button 
                                                    style={styles.likeButton(isLiked)} 
                                                    onClick={() => mobile.id && handleLikeToggle(mobile.id)}
                                                    title={isLiked ? 'Unlike this mobile' : 'Add to favorites'}
                                                >
                                                    {isLiked ? '❤️ Liked' : '☆ Like'}
                                                </button>
                                            </td>
                                            
                                            <td style={styles.td}>{mobile.Brand}</td>
                                            <td style={styles.td}>{mobile.Model}</td>
                                            <td style={styles.td}>₹{mobile.Price.toLocaleString('en-IN')}</td>
                                            <td style={styles.td}>{mobile.RAM} GB</td>
                                            <td style={styles.td}>{mobile.Processor}</td>
                                            <td style={styles.td}>{mobile.Battery_Capacity} mAh</td>
                                            <td style={styles.td}>{mobile.Screen_Size} in</td>
                                            <td style={styles.td}>{mobile.Mobile_Weight} g</td>
                                            <td style={styles.td}>{mobile.Front_Camera}</td>
                                            <td style={styles.td}>{mobile.Back_Camera}</td>
                                            <td style={styles.td}>{mobile.Launched_Year}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default MobileFilter;

// Fetch liked mobiles for this user
const response = await axios.get(`${API_BASE_URL}/favorites`, { params: { userID } });

// Toggle like
await axios.post(`${API_BASE_URL}/like`, {
  mobileId,
  userID,
  isLiked: !isLiked
});
