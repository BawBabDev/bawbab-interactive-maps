import { __ } from '@wordpress/i18n';
import { useState, useMemo, useEffect, useRef } from '@wordpress/element';

const SearchList = ({ spatialFeatures, locations, onSelect, isOpen, onCloseMenu }) => {
    const [activeTab, setActiveTab] = useState(null);
    const menuRef = useRef(null); // Reference to the menu container

    // Handle clicking outside the menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            // If the menu is open and the click is NOT inside the menuRef
            if (isOpen && menuRef.current && !menuRef.current.contains(event.target)) {
                // Also check if the click was on the burger button itself 
                // (usually handled by the button's own toggle, but safe to ignore here)
                if (!event.target.closest('.burger-btn')) {
                    onCloseMenu();
                    setActiveTab(null); // Optional: close open accordions too
                }
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onCloseMenu]);

    const toggleTab = (e, tab) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveTab(prev => (prev === tab ? null : tab));
    };

    const categories = useMemo(() => {
        const rawGroups = { apartments: {}, cottages: {}, amenities: [] };
        const amenityCategories = ['community_center', 'personal_care', 'skilled_care', 'fitness_center', 'amenities'];

        spatialFeatures.forEach(f => {
            const name = f.properties.name;
            if (!name) return;
            const item = { ...f.properties, type: 'spatial' };
            const lowerName = name.toLowerCase();
            const isParlorOrRoom = lowerName.includes('parlor');
            const isLandUse = f.properties.layer_type === 'land_use';

            if (isParlorOrRoom || isLandUse || amenityCategories.includes(f.properties.category)) {
                rawGroups.amenities.push(item);
            } else if (f.properties.category === 'residential_apartment') {
                if (!rawGroups.apartments[name]) rawGroups.apartments[name] = [];
                rawGroups.apartments[name].push(item);
            } else if (f.properties.category === 'cottage') {
                if (!rawGroups.cottages[name]) rawGroups.cottages[name] = [];
                rawGroups.cottages[name].push(item);
            }
        });

        locations.forEach(loc => {
            if (loc.title) rawGroups.amenities.push({ ...loc, name: loc.title, type: 'marker' });
        });

        const naturalSort = (a, b) => (a.code || a.name || '').localeCompare(b.code || b.name || '', undefined, { numeric: true });
        
        const formatGroup = (obj) => Object.keys(obj).map(name => ({
            groupName: name,
            units: obj[name].sort(naturalSort)
        })).sort((a, b) => a.groupName.localeCompare(b.groupName));

        return {
            apartments: formatGroup(rawGroups.apartments),
            cottages: formatGroup(rawGroups.cottages),
            amenities: rawGroups.amenities.sort(naturalSort)
        };
    }, [spatialFeatures, locations]);

    const NavItem = ({ title, groups, type, isAmenities = false }) => {
        const isTabOpen = activeTab === type;
        const [activeGroup, setActiveGroup] = useState(null);

        const toggleGroup = (e, groupName) => {
            e.preventDefault();
            e.stopPropagation();
            setActiveGroup(prev => (prev === groupName ? null : groupName));
        };

        return (
            <div className={`nav-item-container ${isTabOpen ? 'is-expanded' : ''}`}>
                <button className="nav-tab-btn" onClick={(e) => toggleTab(e, type)}>
                    {title} <span className="chevron"></span>
                </button>
                <div className="nav-dropdown">
                    {isAmenities ? (
                        groups.map((item, idx) => (
                            <div key={idx} className="dropdown-row" onClick={() => { onSelect(item); onCloseMenu(); setActiveTab(null); }}>
                                {item.name}
                            </div>
                        ))
                    ) : (
                        groups.map((group, idx) => {
                            const isGroupOpen = activeGroup === group.groupName;
                            return (
                                <div key={idx} className={`dropdown-group-container ${isGroupOpen ? 'group-expanded' : ''}`}>
                                    <div className="dropdown-row group-header" onClick={(e) => toggleGroup(e, group.groupName)}>
                                        {group.groupName} <span className="side-chevron"></span>
                                    </div>
                                    <div className="sub-side-menu">
                                        {group.units.map((unit, uIdx) => (
                                            <div key={uIdx} className="dropdown-row" onClick={() => { onSelect(unit); onCloseMenu(); setActiveTab(null); }}>
                                                {unit.code || unit.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    };

    return (
        <div 
            ref={menuRef} 
            className={`nav-menu ${isOpen ? 'mobile-open' : ''}`}
        >
            <NavItem title={__('Apartments', 'bawbab-interactive-maps')} type="apartments" groups={categories.apartments} />
            <NavItem title={__('Cottages', 'bawbab-interactive-maps')} type="cottages" groups={categories.cottages} />
            <NavItem title={__('Amenities', 'bawbab-interactive-maps')} type="amenities" groups={categories.amenities} isAmenities />
        </div>
    );
};

export default SearchList;