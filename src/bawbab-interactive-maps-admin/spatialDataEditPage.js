import { __ } from '@wordpress/i18n';
import { 
    Panel, Flex, FlexItem, NoticeList, Button, Spinner, SearchControl, 
    SelectControl, PanelBody, CheckboxControl, Dashicon 
} from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect, useMemo, useRef } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import DataEditor from './components/DataEditor'; 
import BawBabIMaps from '../bawbab-interactive-maps-block/components/maps';

const EditPage = () => {
    const [features, setFeatures] = useState([]);
    const [searchQuery, setSearchQuery] = useState(''); 
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeFeature, setActiveFeature] = useState(null);
    const [resetCounter, setResetCounter] = useState(0);
    const [drafts, setDrafts] = useState({});
    
    // --- MAP CONFIGURATION STATES ---
    const [googleApiKey, setGoogleApiKey] = useState('');
    const [googleMapId, setGoogleMapId] = useState('');
    const [mapType, setMapType] = useState('hybrid');
    const [mapLogo, setMapLogo] = useState('');
    const [navBackground, setNavBackground] = useState('');
    const [colorTheme, setColorTheme] = useState('blue');
    
    const [openedGroup, setOpenedGroup] = useState(null);

    const sidebarListRef = useRef(null);

    const [filterCategory, setFilterCategory] = useState('all');
    const [filterFireplace, setFilterFireplace] = useState(false);
    const [filterSunroom, setFilterSunroom] = useState(false);

    const { removeNotice } = useDispatch( noticesStore );
    const notices = useSelect( ( select ) => select( noticesStore ).getNotices(), [] );

    const fetchFeatures = async () => {
        setIsLoading(true);
        console.log("🛠️ [EditPage] Fetching fresh spatial features from /get-spatial-data...");
        try {
            const response = await fetch('/wp-json/bwb-imaps-federated-api/v1/get-spatial-data');
            const data = await response.json();
            const filtered = data.features?.filter(f => {
                return f.properties.layer_type === 'buildings' || f.properties.layer_type === 'land_use';
            }) || [];
            
            console.log(`🛠️ [EditPage] Fetched ${filtered.length} features successfully.`);
            setFeatures(filtered);

            setActiveFeature(prevActive => {
                if (!prevActive) return null;
                const updated = filtered.find(f => 
                    f.properties.fid === prevActive.properties.fid && 
                    f.properties.layer_type === prevActive.properties.layer_type
                );
                console.log("🛠️ [EditPage] Re-synced activeFeature from server:", updated?.properties);
                return updated || prevActive;
            });
        } catch (err) {
            console.error("❌ [EditPage] Error fetching spatial data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const displayItems = useMemo(() => {
        const filtered = features.filter(f => {
            const p = f.properties;
            const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                                (p.code || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCat = filterCategory === 'all' || p.category === filterCategory;
            const matchesFireplace = !filterFireplace || !!p.fireplace;
            const matchesSunroom = !filterSunroom || !!p.sunroom;
            return matchesSearch && matchesCat && matchesFireplace && matchesSunroom;
        });

        const groups = {};
        const cottages = [];
        const amenities = [];
        const unnamed = [];

        filtered.forEach(f => {
            const p = f.properties;
            if (p.category === 'cottage' && p.name) {
                cottages.push(f);
            } else if (p.name && p.code) {
                if (!groups[p.name]) groups[p.name] = [];
                groups[p.name].push(f);
            } else if (p.name && !p.code) {
                 amenities.push(f);
            } else {
                unnamed.push(f);
            }
        });

        const result = [];

        if (cottages.length > 0) {
            result.push({
                type: 'group',
                title: __('Cottages', 'foulkeways'),
                items: cottages.sort((a, b) => {
                    const nameA = a.properties.name || '';
                    const nameB = b.properties.name || '';
                    if (nameA !== nameB) return nameA.localeCompare(nameB);
                    return (a.properties.code || '').localeCompare(b.properties.code || '', undefined, {numeric: true});
                })
            });
        }

        Object.keys(groups).sort().forEach(name => {
            result.push({
                type: 'group',
                title: name,
                items: groups[name].sort((a, b) => a.properties.code.localeCompare(b.properties.code, undefined, {numeric: true}))
            });
        });

        if (amenities.length > 0) {
            result.push({ type: 'group', title: __('Amenities', 'foulkeways'), items: amenities.sort((a, b) => a.properties.name.localeCompare(b.properties.name)) });
        }

        if (unnamed.length > 0) {
            result.push({
                type: 'group',
                title: __('Unnamed Features', 'foulkeways'),
                items: unnamed.sort((a, b) => {
                    const labelA = `${a.properties.layer_type}-${a.properties.fid}`;
                    const labelB = `${b.properties.layer_type}-${b.properties.fid}`;
                    return labelA.localeCompare(labelB);
                })
            });
        }
        return result;
    }, [features, searchQuery, filterCategory, filterFireplace, filterSunroom]);

    const updateDraft = (layerType, fid, data) => {
        const compositeKey = `${layerType}::${fid}`;
        console.log(`🛠️ [EditPage] updateDraft called for [${compositeKey}] with changes:`, data);
        setDrafts(prev => {
            const updated = { ...prev, [compositeKey]: { ...(prev[compositeKey] || {}), ...data } };
            console.log("🛠️ [EditPage] Current cumulative drafts state:", updated);
            return updated;
        });
    };

    const handleCancel = () => {
        console.log("🛠️ [EditPage] Discarding all pending drafts.");
        setDrafts({});
        setResetCounter(prev => prev + 1);
    };

    const saveAllDrafts = async () => {
        const draftKeys = Object.keys(drafts);
        console.log("🛠️ [EditPage] saveAllDrafts triggered. Draft keys pending save:", draftKeys);
        
        if (draftKeys.length === 0) {
            console.warn("⚠️ [EditPage] No drafts found to save.");
            return;
        }

        setIsSaving(true);
        
        try {
            const savePromises = draftKeys.map(async compositeKey => {
                const draftData = drafts[compositeKey];
                const [layerType, fid] = compositeKey.split('::');
                const feature = features.find(f => String(f.properties.fid) === String(fid) && f.properties.layer_type === layerType);
                
                if (!feature) {
                    console.error(`❌ [EditPage] Could not find matching feature in memory for key: ${compositeKey}`);
                    return;
                }

                const helperBool = (key) => {
                    if (draftData[key] !== undefined) return draftData[key] ? 1 : 0;
                    return feature.properties[key] ? 1 : 0;
                };

                const payload = {
                    fid: fid,
                    layer_type: layerType,
                    ...draftData,
                    fireplace: helperBool('fireplace'),
                    sunroom: helperBool('sunroom'),
                    append_description: helperBool('append_description'),
                    hide_page_video: helperBool('hide_page_video'),
                    hide_page_floorplan: helperBool('hide_page_floorplan'),
                    custom_video_url: draftData.custom_video_url !== undefined ? draftData.custom_video_url : (feature.properties.custom_video_url || ''),
                    custom_floorplan_url: draftData.custom_floorplan_url !== undefined ? draftData.custom_floorplan_url : (feature.properties.custom_floorplan_url || ''),
                };

                console.log(`📡 [EditPage] Sending POST to /update-spatial-meta for [${compositeKey}]`, payload);

                const response = await fetch('/wp-json/foulkeways/v1/update-spatial-meta', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': window.wpApiSettings?.nonce || '' 
                    },
                    body: JSON.stringify(payload)
                });

                const resJson = await response.json();
                console.log(`📥 [EditPage] Server response for [${compositeKey}] (HTTP ${response.status}):`, resJson);
                return resJson;
            });

            const results = await Promise.all(savePromises);
            console.log("✅ [EditPage] All save promises resolved:", results);
            
            setDrafts({});
            setResetCounter(prev => prev + 1);
            await fetchFeatures();
        } catch (err) {
            console.error("❌ [EditPage] Global Save Exception:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const renderFeatureItem = (f) => {
        const isActive = activeFeature?.properties.fid === f.properties.fid && activeFeature?.properties.layer_type === f.properties.layer_type;
        let itemLabel = f.properties.code ? `${__('Unit', 'foulkeways')} ${f.properties.code}` : f.properties.name;
        if (!itemLabel) itemLabel = `${f.properties.layer_type} #${f.properties.fid}`;
        
        return (
            <div 
                id={`item-${f.properties.layer_type}-${f.properties.fid}`}
                key={`${f.properties.layer_type}-${f.properties.fid}`} 
                onClick={() => {
                    console.log("🛠️ [EditPage] Selected feature:", f.properties);
                    setActiveFeature(f);
                }}
                style={{ 
                    padding: '10px 12px', 
                    cursor: 'pointer', 
                    borderRadius: '4px',
                    marginBottom: '4px',
                    background: isActive ? '#f0f6fb' : '#fff',
                    borderTop: '1px solid',
                    borderRight: '1px solid',
                    borderBottom: '1px solid',
                    borderColor: isActive ? '#2271b1' : '#e0e0e0',
                    borderLeft: `4px solid ${isActive ? '#2271b1' : '#f0f0f0'}`,
                    transition: 'all 0.2s ease'
                }}
            >
                <div style={{ fontWeight: isActive ? '600' : '400', fontSize: '13px', color: '#1d2327' }}>
                    {itemLabel}
                </div>
                {(!f.properties.code || !f.properties.name) && (
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                        {formatLabel(f.properties.category || f.properties.layer_type)}
                    </div>
                )}
            </div>
        );
    };

    // --- LOAD MAP SETTINGS ON MOUNT ---
    useEffect(() => {
        const settings = window.foulkewaysSettings;
        if (settings?.googleApiKey && settings?.googleMapId) {
            setGoogleApiKey(settings.googleApiKey);
            setGoogleMapId(settings.googleMapId);
            setMapType(settings.mapType || 'hybrid');
            setMapLogo(settings.mapLogo || '');
            setNavBackground(settings.navBackground || '');
            setColorTheme(settings.colorTheme || 'blue');
        } else {
            apiFetch({ path: '/wp/v2/settings' })
                .then((response) => {
                    const data = response.foulkeways_map_data;
                    if (data) {
                        const key = data.googleApiKey || '';
                        const id = data.googleMapId || '';
                        const type = data.mapType || 'hybrid';
                        const logo = data.mapLogo || '';
                        const bg = data.navBackground || '';
                        const theme = data.colorTheme || 'blue';
                        
                        setGoogleApiKey(key);
                        setGoogleMapId(id);
                        setMapType(type);
                        setMapLogo(logo);
                        setNavBackground(bg);
                        setColorTheme(theme);

                        if (!window.foulkewaysSettings) window.foulkewaysSettings = {};
                        window.foulkewaysSettings = {
                            ...window.foulkewaysSettings,
                            googleApiKey: key,
                            googleMapId: id,
                            mapType: type,
                            mapLogo: logo,
                            navBackground: bg,
                            colorTheme: theme
                        };
                    }
                })
                .catch((err) => console.error('Error loading Map Settings in Edit Tool:', err));
        }
    }, []);

    useEffect(() => { fetchFeatures(); }, []);

    useEffect(() => {
        if (!activeFeature || !displayItems.length) return;

        let targetGroupId = null;
        displayItems.forEach((group, idx) => {
            const hasFeature = group.items.some(i => 
                i.properties.fid === activeFeature.properties.fid && 
                i.properties.layer_type === activeFeature.properties.layer_type
            );
            if (hasFeature) {
                targetGroupId = `group-${idx}`;
            }
        });

        if (targetGroupId) {
            setOpenedGroup(targetGroupId);

            setTimeout(() => {
                const activeId = `item-${activeFeature.properties.layer_type}-${activeFeature.properties.fid}`;
                const element = document.getElementById(activeId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        }
    }, [activeFeature, displayItems]);

    const formatLabel = (str) => {
        if (!str) return '';
        return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const categories = useMemo(() => {
        const cats = new Set(features.map(f => f.properties.category).filter(Boolean));
        return [
            { label: __('All Categories', 'foulkeways'), value: 'all' },
            ...Array.from(cats).map(cat => ({ label: formatLabel(cat), value: cat }))
        ];
    }, [features]);

    const activeCompositeKey = activeFeature ? `${activeFeature.properties.layer_type}::${activeFeature.properties.fid}` : '';

    return (
        <div className="wrap" style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
            <NoticeList notices={notices} onRemove={removeNotice} style={{ marginBottom: '20px', flexShrink: 0 }}/>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
                <h1 className="wp-heading-inline" style={{ margin: 0 }}>{ __('Edit Map Features', 'foulkeways') }</h1>
            </div>

            <div style={{ flex: 1, minHeight: 0, background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', display: 'flex', overflow: 'hidden' }}>
                <div style={{ flex: '0 0 350px', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ padding: '15px', borderBottom: '1px solid #f0f0f0', background: '#f9f9f9', flexShrink: 0 }}>
                        <SearchControl value={ searchQuery } onChange={ setSearchQuery } placeholder={__('Search units...', 'foulkeways')} />
                        <div style={{ marginTop: '10px' }}>
                            <SelectControl label={__('Category', 'foulkeways')} value={filterCategory} options={categories} onChange={(val) => setFilterCategory(val)} __nextHasNoMarginBottom />
                            <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <CheckboxControl label={__('Has Fireplace', 'foulkeways')} checked={filterFireplace} onChange={setFilterFireplace} />
                                <CheckboxControl label={__('Has Sunroom', 'foulkeways')} checked={filterSunroom} onChange={setFilterSunroom} />
                            </div>
                        </div>
                    </div>

                    <div ref={sidebarListRef} style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                        {isLoading ? (
                            <Flex justify="center" style={{ padding: '20px' }}><Spinner /></Flex>
                        ) : (
                            displayItems.map((group, idx) => {
                                const groupId = `group-${idx}`;
                                
                                return (
                                    <PanelBody 
                                        title={`${group.title} (${group.items.length})`} 
                                        key={groupId}
                                        opened={openedGroup === groupId}
                                        onToggle={() => {
                                            setOpenedGroup(prev => prev === groupId ? null : groupId);
                                        }}
                                    >
                                        {group.items.map((f) => renderFeatureItem(f))}
                                    </PanelBody>
                                );
                            })
                        )}
                    </div>
                </div>

                <div style={{ flex: 1, height: '100%', overflowY: 'auto', background: '#fdfdfd', display: 'flex', flexDirection: 'column' }}>
                    {activeFeature ? (
                        <div style={{ padding: '40px 20px', maxWidth: '800px', width: '100%', margin: '0 auto', alignItems: 'center'}}>
                            <DataEditor 
                                key={`${activeFeature.properties.layer_type}-${activeFeature.properties.fid}-${resetCounter}`} 
                                building={activeFeature} 
                                draft={drafts[activeCompositeKey] || {}}
                                updateDraft={(data) => updateDraft(activeFeature.properties.layer_type, activeFeature.properties.fid, data)}
                                onUpdate={saveAllDrafts}
                                onCancel={handleCancel}
                                isSaving={isSaving}
                                hasChanges={Object.keys(drafts).length > 0}
                            />

                            <div style={{ marginTop: '40px', borderTop: '20px solid #f0f0f0', paddingTop: '30px', marginLeft: '-20px', marginRight: '-20px', paddingLeft: '20px', paddingRight: '20px' }}>
                                <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Dashicon icon="location-alt" />
                                    {__('Location Preview', 'foulkeways')}
                                </h2>
                                <div style={{ height: '450px', border: '1px solid #ddd', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                    <BawBabIMaps 
                                        height="450px"
                                        editMode={true}
                                        selectedLocationProp={activeFeature}
                                        isDrawerOpenProp={true} 
                                        onFeatureSelect={(feature) => setActiveFeature(feature)}
                                        apiKeyProp={googleApiKey}
                                        mapIdProp={googleMapId}
                                        mapTypeProp={mapType}
                                        mapLogo={mapLogo}
                                        navBackground={navBackground}
                                        colorTheme={colorTheme}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#949494', background: '#fcfcfc' }}>
                            <div style={{ background: '#fff', padding: '40px', borderRadius: '50%', marginBottom: '20px', border: '1px solid #e0e0e0', boxShadow: 'inset 0 0 15px rgba(0,0,0,0.02)' }}>
                                <Dashicon icon="edit" size={60} />
                            </div>
                            <h2 style={{ color: '#1d2327', fontWeight: '500', marginBottom: '8px' }}>{__('No Feature Selected', 'foulkeways')}</h2>
                            <p style={{ maxWidth: '300px', textAlign: 'center', margin: 0, fontSize: '13px' }}>
                                {__('Select a unit or amenity from the left sidebar or directly on the map to begin editing its details.', 'foulkeways')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditPage;