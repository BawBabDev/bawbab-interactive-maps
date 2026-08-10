import { __ } from '@wordpress/i18n';
import { useState, useMemo, useEffect, useRef } from '@wordpress/element';
import { DEFAULT_CATEGORY_CONFIG } from '../constants/mapConstants';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

/**
 * SearchList Component
 * 
 * Dynamic navigation menu rendering feature hierarchies based on the configurable 
 * Category Configuration settings. Accommodates grouped multi-unit accordions 
 * as well as flat facility/amenity lists and location pins.
 *
 * @param {Object} props
 * @param {Array} props.spatialFeatures GeoJSON features list
 * @param {Array} props.locations Custom marker locations list
 * @param {Function} props.onSelect Selection callback when a user clicks an item
 * @param {boolean} props.isOpen Mobile menu open state
 * @param {Function} props.onCloseMenu Callback to dismiss mobile menu
 */
const SearchList = ({ spatialFeatures = [], locations = [], onSelect, isOpen, onCloseMenu }) => {
    const [activeTab, setActiveTab] = useState(null);
    const menuRef = useRef(null);

    // Dismiss dropdown when clicking outside menu container
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && menuRef.current && !menuRef.current.contains(event.target)) {
                if (!event.target.closest('.burger-btn')) {
                    onCloseMenu();
                    setActiveTab(null);
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

    const toggleTab = (e, tabId) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveTab(prev => (prev === tabId ? null : tabId));
    };

    /**
     * Process spatial features and locations into dynamic category tab buckets
     */
    const categoryData = useMemo(() => {
        // Resolve active category settings or fallback to default preset
        const categoryConfig = window.bwbimapsSettings?.categoryConfig || DEFAULT_CATEGORY_CONFIG;
        const tabs = categoryConfig.tabs || DEFAULT_CATEGORY_CONFIG.tabs;

        // Initialize empty tab structures
        const tabBuckets = {};
        tabs.forEach(tab => {
            tabBuckets[tab.id] = {
                id: tab.id,
                title: tab.title,
                displayType: tab.displayType || 'flat',
                categories: tab.categories || [],
                groupedItems: {}, // Keyed by parent group name (for Name + Code features)
                flatItems: []     // Array of flat items (for Name-only features or pins)
            };
        });

        // 1. Process Spatial GeoJSON Features
        spatialFeatures.forEach(f => {
            const props = f.properties || {};

            // Exclude non-interactive features (patios, background parcels, etc.) and features without a label
            if (props.is_interactive === false || (!props.name && !props.code)) {
                return;
            }

            const featureItem = { ...props, type: 'spatial', geometry: f.geometry };
            const category = props.category || '';

            // Find matching tab or fallback to 'amenities' (or first available tab)
            let targetTab = tabs.find(t => (t.categories || []).includes(category));
            let targetTabId = targetTab ? targetTab.id : (tabBuckets['amenities'] ? 'amenities' : tabs[0]?.id);

            if (!targetTabId || !tabBuckets[targetTabId]) return;

            const bucket = tabBuckets[targetTabId];

            // Distinguish between Grouped Accordion items (has BOTH Name and Code) and Flat items
            if (props.name && props.code && bucket.displayType === 'grouped') {
                const groupName = props.name;
                if (!bucket.groupedItems[groupName]) {
                    bucket.groupedItems[groupName] = [];
                }
                bucket.groupedItems[groupName].push(featureItem);
            } else {
                // Name-only features (e.g. Community Center) or flat display layout
                bucket.flatItems.push(featureItem);
            }
        });

        // 2. Process Custom Location Pin Markers (always added to flat items of the 'amenities' or fallback tab)
        const fallbackFlatTabId = tabBuckets['amenities'] ? 'amenities' : tabs[tabs.length - 1]?.id;
        if (fallbackFlatTabId && tabBuckets[fallbackFlatTabId]) {
            locations.forEach(loc => {
                if (loc.title && loc.showMarker !== false) {
                    tabBuckets[fallbackFlatTabId].flatItems.push({
                        ...loc,
                        name: loc.title,
                        type: 'marker'
                    });
                }
            });
        }

        // 3. Format and Sort Grouped Accordion Structures
        const naturalSort = (a, b) => (a.code || a.name || '').localeCompare(b.code || b.name || '', undefined, { numeric: true });

        const formattedTabs = tabs.map(tab => {
            const bucket = tabBuckets[tab.id];
            if (!bucket) return null;

            const formattedGroups = Object.keys(bucket.groupedItems).map(groupName => ({
                groupName,
                units: bucket.groupedItems[groupName].sort(naturalSort)
            })).sort((a, b) => a.groupName.localeCompare(b.groupName));

            return {
                id: bucket.id,
                title: bucket.title,
                displayType: bucket.displayType,
                groups: formattedGroups,
                flatItems: bucket.flatItems.sort(naturalSort)
            };
        }).filter(Boolean);

        return formattedTabs;
    }, [spatialFeatures, locations]);

    /**
     * Sub-Component: Renders an individual dynamic navigation tab and its dropdown
     */
    const NavItem = ({ tab }) => {
        const isTabOpen = activeTab === tab.id;
        const [activeGroup, setActiveGroup] = useState(null);

        const toggleGroup = (e, groupName) => {
            e.preventDefault();
            e.stopPropagation();
            setActiveGroup(prev => (prev === groupName ? null : groupName));
        };

        const hasGroupedItems = tab.groups && tab.groups.length > 0;
        const hasFlatItems = tab.flatItems && tab.flatItems.length > 0;

        if (!hasGroupedItems && !hasFlatItems) return null;

        return (
            <div className={`nav-item-container ${isTabOpen ? 'is-expanded' : ''}`}>
                <button className="nav-tab-btn" onClick={(e) => toggleTab(e, tab.id)}>
                    {__(tab.title, TEXT_DOMAIN)} <span className="chevron"></span>
                </button>
                <div className="nav-dropdown">
                    {/* Render Grouped Accordion Rows */}
                    {hasGroupedItems && tab.groups.map((group, idx) => {
                        const isGroupOpen = activeGroup === group.groupName;
                        return (
                            <div key={`group-${idx}`} className={`dropdown-group-container ${isGroupOpen ? 'group-expanded' : ''}`}>
                                <div className="dropdown-row group-header" onClick={(e) => toggleGroup(e, group.groupName)}>
                                    {group.groupName} <span className="side-chevron"></span>
                                </div>
                                <div className="sub-side-menu">
                                    {group.units.map((unit, uIdx) => (
                                        <div 
                                            key={`unit-${uIdx}`} 
                                            className="dropdown-row" 
                                            onClick={() => { onSelect(unit); onCloseMenu(); setActiveTab(null); }}
                                        >
                                            {unit.code || unit.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Render Flat List Rows */}
                    {hasFlatItems && tab.flatItems.map((item, idx) => (
                        <div 
                            key={`flat-${idx}`} 
                            className="dropdown-row" 
                            onClick={() => { onSelect(item); onCloseMenu(); setActiveTab(null); }}
                        >
                            {item.name || item.title}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div 
            ref={menuRef} 
            className={`nav-menu ${isOpen ? 'mobile-open' : ''}`}
        >
            {categoryData.map(tab => (
                <NavItem key={tab.id} tab={tab} />
            ))}
        </div>
    );
};

export default SearchList;