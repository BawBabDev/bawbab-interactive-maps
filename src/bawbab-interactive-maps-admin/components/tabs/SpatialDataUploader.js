import { Button, SelectControl, Flex, FlexItem, Dashicon, __experimentalText as Text, ExternalLink } from '@wordpress/components';
import { useState, useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useSpatialDataImporter } from '../../hooks/useSpatialDataImporter';
import { useNotify } from '../Notices';
import { GeoJSONImportWizardModal } from '../modals/GeoJSONImportWizardModal';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

/**
 * SpatialDataUploader Component
 * 
 * GIS administration dashboard panel allowing layer selection, 
 * column-mapping wizard launches, and layer truncations.
 * 
 * @param {Object} props
 * @param {Function} props.onUploadSuccess Callback fired immediately upon a successful layer sync.
 */
export const SpatialDataUploader = ({ onUploadSuccess }) => {
    const [importType, setImportType] = useState('parcels');
    const [pendingFile, setPendingFile] = useState(null);
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    const { inspectGeoJSON, importGeoJSON, deleteLayer, isUploading, message } = useSpatialDataImporter();
    const { notify } = useNotify();
    const lastProcessedMessageRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPendingFile(file);
        }
    };

    const handleOpenWizard = () => {
        if (pendingFile) {
            setIsWizardOpen(true);
        }
    };

    const handleClearLayer = () => {
        lastProcessedMessageRef.current = null;
        deleteLayer(importType);
    };

    const clearFile = () => {
        setPendingFile(null);
        const input = document.getElementById('geojson-import-input');
        if (input) input.value = '';
    };

    useEffect(() => {
        if (message && message !== lastProcessedMessageRef.current) {
            lastProcessedMessageRef.current = message;
            notify(message.type, message.text, { id: 'spatial-import' });

            if (message.type === 'success') {
                setPendingFile(null);
                if (onUploadSuccess) onUploadSuccess();
            }
        }
    }, [message, notify, onUploadSuccess]);

    return (
        <div className="tab-content">
            <Text variant="title.small" display="block" style={{ marginBottom: '5px' }}>
                {__('GIS Layer Manager', TEXT_DOMAIN)}
            </Text>
            <Text variant="caption" display="block" style={{ color: '#666', marginBottom: '20px' }}>
                {__('Sync spatial geometries with custom column mapping and automated attribute detection.', TEXT_DOMAIN)}
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
                            {__('Target Layer', TEXT_DOMAIN)}
                            <span className="pulsating-dot-inline" />
                        </Flex>
                    } 
                    value={importType}
                    options={[
                        { label: 'Parcels', value: 'parcels' },
                        { label: 'Buildings', value: 'buildings' },
                        { label: 'Paths (Display Only)', value: 'paths' },
                        { label: 'Land Use', value: 'land_use' },
                        { label: 'Navigation - Entries & Doors (Points)', value: 'entries' },
                        { label: 'Navigation - Routable Network (Lines)', value: 'network' },
                    ]}
                    onChange={(val) => setImportType(val)}
                />

                <div style={{ marginTop: '15px'}}>
                    {pendingFile && (
                        <div style={{ marginBottom: '15px', padding: '10px', background: '#f0f6fb', borderRadius: '4px', border: '1px solid #c3d4e3' }}>
                            <Flex align="center" justify="space-between">
                                <Flex align="center" gap={2}>
                                    <Dashicon icon="media-document" size={16} />
                                    <Text style={{ color: '#2271b1' }}><strong>{pendingFile.name}</strong></Text>
                                </Flex>
                                <Button 
                                    isDestructive   
                                    onClick={clearFile} 
                                    icon="no-alt" 
                                    showTooltip
                                    label={__('Remove file', TEXT_DOMAIN)}
                                />
                            </Flex>
                        </div>
                    )}

                    <Flex align="center" justify="space-between" gap={4}>
                        <FlexItem style={{ flex: 1 }}>
                            <Button 
                                variant="secondary" 
                                onClick={() => document.getElementById('geojson-import-input').click()}
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                {pendingFile ? __('Change File', TEXT_DOMAIN) : __('Select GeoJSON', TEXT_DOMAIN)}
                            </Button>
                        </FlexItem>
                        <FlexItem style={{ flex: 1 }}>
                            <Button 
                                variant="primary" 
                                disabled={!pendingFile || isUploading} 
                                isBusy={isUploading} 
                                onClick={handleOpenWizard}
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                {__('Configure & Import', TEXT_DOMAIN)}
                            </Button>
                        </FlexItem>
                    </Flex>
                </div>

                {/* Import Wizard Modal Trigger */}
                {isWizardOpen && (
                    <GeoJSONImportWizardModal
                        file={pendingFile}
                        layerType={importType}
                        onClose={() => setIsWizardOpen(false)}
                        onInspect={inspectGeoJSON}
                        onExecuteImport={importGeoJSON}
                    />
                )}

                {/* Danger Zone: Wiping Layer */}
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
                            {__('Danger Zone', TEXT_DOMAIN)}
                        </Text>
                    </Flex>
                    
                    <Flex style={{ marginBottom: '15px' }}>
                        <Text variant="caption" display="block" style={{ color: '#555' }}>
                            {sprintf(__('This will permanently delete all features and properties associated with the "%s" layer.', TEXT_DOMAIN), importType)}
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
                        {sprintf(__('Wipe "%s" Layer', TEXT_DOMAIN), importType)}
                    </Button>
                </div>
            </div>
        </div>
    );
};