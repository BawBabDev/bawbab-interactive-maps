import { Button, SelectControl, Flex, FlexItem, Dashicon, __experimentalText as Text,ExternalLink } from '@wordpress/components';
import { useState, useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useSpatialDataImporter } from '../hooks/useSpatialDataImporter';
import { useNotify } from './Notices';

/**
 * Uploader Component
 * 
 * Renders the GIS administration dashboard interface allowing synchronization of
 * display geometries and routing topological datasets.
 * 
 * @param {Object} props
 * @param {Function} props.onUploadSuccess Callback fired immediately upon a successful layer sync.
 */
export const SpatialDataUploader = ({ onUploadSuccess }) => {
    const [importType, setImportType] = useState('parcels');
    const [selectedFile, setSelectedFile] = useState(null);
    const { importGeoJSON, deleteLayer, isUploading, message, setMessage } = useSpatialDataImporter();
    const { notify } = useNotify();
    const [pendingFile, setPendingFile] = useState(null);

    const lastProcessedMessageRef = useRef(null);

    /**
     * handleFileSelect
     * Buffers the uploaded document into react state ready for explicit manual transmission.
     */
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            //console.log("📂 File Selected:", file.name, "Type:", file.type);
            setPendingFile(file); 
            setSelectedFile(file);
        }
    };

    /**
     * handleManualUpload
     * Dispatches the network payload request towards our specific PHP custom table routes.
     */
    const handleManualUpload = () => {
        if (pendingFile) {
            //console.log(`🚀 Starting Upload: Layer="${importType}", File="${pendingFile.name}"`);
            lastProcessedMessageRef.current = null;
            importGeoJSON([pendingFile], importType); 
        }
    };

    /**
     * handleClearLayer
     * Triggers specific layer truncations matching selected routing or structural constraints.
     */
    const handleClearLayer = () => {
        //console.warn(`🗑️ Requesting Wipe for Layer: ${importType}`);
        lastProcessedMessageRef.current = null;
        deleteLayer(importType);
    };

    /**
     * clearFile
     * Clears internal state buffers and resets file form inputs.
     */
    const clearFile = () => {
        setPendingFile(null);
        setSelectedFile(null);
        const input = document.getElementById('geojson-import-input');
        if (input) input.value = '';
    };

    // Monitor REST API processing status notifications
    useEffect(() => {
        if (message && message !== lastProcessedMessageRef.current) {
            //console.log("📩 Message from Importer:", message);
            lastProcessedMessageRef.current = message;
            notify(message.type, message.text, { id: 'spatial-import' });

            if (message.type === 'success') {
                // Safeguard against missing array parsing allocations
                if (message.text.includes(' 0 ')) {
                    console.warn("⚠️ Import reported 0 features. Check PHP logs.");
                    return;
                }

                setPendingFile(null);
                setSelectedFile(null);
                
                // FIXED: Trigger background success hook directly without interrupting visual panel layouts with deep window reloads
                if (onUploadSuccess) onUploadSuccess();

                const isNavLayer = importType === 'entries' || importType === 'network';
                if (!isNavLayer) {
                    console.log("✅ Visual map layer elements synchronized safely. Interface map updating via reactive hooks.");
                } else {
                    console.log("✅ Navigation graph structural update written seamlessly to custom DB schema.");
                }
            }
        }
    }, [message, notify, onUploadSuccess, importType]);

    return (
        <div className="tab-content">
            <Text variant="title.small" display="block" style={{ marginBottom: '5px' }}>
                {__('GIS Layer Manager', 'foulkeways-interactive-map')}
            </Text>
            <Text variant="caption" display="block" style={{ color: '#666', marginBottom: '20px' }}>
                {__('Sync spatial geometries while preserving custom descriptions and page links.', 'bawbab-interactive-maps')}
            </Text>

            <div style={{ marginTop: '20px' }}>
                <input 
                    type="file" 
                    accept=".geojson" 
                    id="geojson-import-input" 
                    style={{ display: 'none' }} 
                    onChange={handleFileSelect} 
                />
                
                <SelectControl 
                    label={
                        <Flex align="center" justify="flex-start" expanded={false} height="12px">
                            {__('Target Layer', 'foulkeways-interactive-map')}
                            <span className="pulsating-dot-inline" />
                        </Flex>
                    } 
                    value={importType}
                    options={[
                        { label: 'Parcels', value: 'parcels' },
                        { label: 'Buildings', value: 'buildings' },
                        { label: 'Paths (Display Only)', value: 'paths' },
                        { label: 'Land Use', value: 'land_use' },
                        // WIP: Navigation Topologies
                        //{ label: 'Navigation - Entries & Doors (Points)', value: 'entries' },
                        //{ label: 'Navigation - Routable Network (Lines)', value: 'network' },
                    ]}
                    onChange={(val) => {
                        // console.log("🎯 Layer Type changed to:", val);
                        setImportType(val);
                    }}
                />

                <div style={{ marginTop: '15px'}}>
                    {pendingFile && (
                        <div style={{ marginBottom: '15px', padding: '10px', background: '#f0f6fb', borderRadius: '4px', border: '1px solid #c3d4e3' }}>
                            <Flex align="center" justify="space-between">
                                <Flex align="center" gap={2}>
                                    <Dashicon icon="media-document" size={16} />
                                    <Text style={{ color: '#d63638' }}><strong>{pendingFile.name}</strong></Text>
                                </Flex>
                                <Button 
                                    isDestructive  
                                    onClick={clearFile} 
                                    icon="no-alt" 
                                    showTooltip
                                    label={__('Remove file', 'bawbab-interactive-maps')}
                                />
                            </Flex>
                        </div>
                    )}

                    <Flex align="center" justify="space-between" gap={4}>
                        <FlexItem style={{ flex: 1 }}>
                            <Button 
                                variant="secondary" 
                                onClick={() => document.getElementById('geojson-import-input').click()}
                                style={{ width: '100%', justifyContenht: 'center' }}
                            >
                                {pendingFile ? __('Change File', 'foulkeways-interactive-map') : __('Select GeoJSON', 'bawbab-interactive-maps')}
                            </Button>
                        </FlexItem>
                        <FlexItem style={{ flex: 1 }}>
                            <Button 
                                variant="primary" 
                                disabled={!pendingFile || isUploading} 
                                isBusy={isUploading} 
                                onClick={handleManualUpload}
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                {isUploading ? __('Syncing...', 'foulkeways-interactive-map') : __('Update Layer', 'bawbab-interactive-maps')}
                            </Button>
                        </FlexItem>
                    </Flex>
                </div>
                <Flex wrap="wrap" gap={2} style={{ margin: '10px 0px', justifyContent: 'flex-end' }}>
                    <ExternalLink href="#" style={{ color: '#3858e9' }}>
                        {__('Sample Data file', 'bawbab-interactive-maps')}
                    </ExternalLink>
                </Flex>

                {/* DANGER ZONE: Clear Layer Functionality */}
                <div style={{ 
                    marginTop: '40px', 
                    padding: '20px', 
                    border: '2px dashed #d63638', 
                    borderRadius: '8px', 
                    background: '#fff8f8' 
                }}>
                    <Flex align="center" gap={2} style={{ marginBottom: '10px' }}>
                        <Dashicon icon="warning" style={{ color: '#d63638' }} />
                        <Text variant="title.small" style={{ color: '#d63638', fontWeight: '600' }}>
                            {__('Danger Zone', 'foulkeways-interactive-map')}
                        </Text>
                    </Flex>
                    
                    <Flex style={{ marginBottom: '15px' }}>
                        <Text variant="caption" display="block" style={{ color: '#555' }}>
                            {sprintf(__('This will permanently delete all features and properties associated with the "%s" layer.', 'bawbab-interactive-maps'), importType)}
                        </Text>
                    </Flex>

                    <Button 
                        isDestructive 
                        variant="primary" 
                        disabled={isUploading}
                        onClick={handleClearLayer}
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        <Dashicon icon="trash" />
                        {sprintf(__('Wipe "%s" Layer', 'bawbab-interactive-maps'), importType)}
                    </Button>
                </div>
            </div>
        </div>
    );
};
