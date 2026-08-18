import {
    Button,
    SelectControl,
    Flex,
    FlexItem,
    Dashicon,
    ExternalLink,
    __experimentalText as Text,
} from '@wordpress/components';
import { useState, useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

import { useSpatialDataImporter } from '../../hooks/useSpatialDataImporter';
import { useSpatialDataExporter } from '../../hooks/useSpatialDataExporter';
import { GeoJSONImportWizardModal } from '../importWizard';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

/**
 * SpatialDataUploader Component
 *
 * GIS administration dashboard panel allowing layer selection,
 * column-mapping wizard launches, GeoJSON exports, and layer truncations.
 *
 * @param {Object} props
 * @param {Function} props.onUploadSuccess Callback fired immediately upon a successful layer sync.
 */
export const SpatialDataUploader = ( { onUploadSuccess } ) => {
    const [ importType, setImportType ] = useState( 'parcels' );
    const [ pendingFile, setPendingFile ] = useState( null );
    const [ isWizardOpen, setIsWizardOpen ] = useState( false );

    // Dedicated Importer & Exporter Hooks
    const { inspectGeoJSON, importGeoJSON, deleteLayer, isUploading, message } =
        useSpatialDataImporter();
    const { exportGeoJSON, isExporting, exportError } = useSpatialDataExporter();

    // Standard WordPress Notices Dispatchers
    const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

    // Track processed message strings to prevent re-render loops
    const lastProcessedTextRef = useRef( null );
    const lastExportErrorTextRef = useRef( null );

    const handleFileSelect = ( e ) => {
        const file = e.target.files[ 0 ];
        if ( file ) {
            setPendingFile( file );
        }
    };

    const handleOpenWizard = () => {
        if ( pendingFile ) {
            setIsWizardOpen( true );
        }
    };

    const handleExportLayer = async () => {
        const result = await exportGeoJSON( importType );
        if ( result.success ) {
            createSuccessNotice(
                sprintf( __( 'Exported "%s" layer successfully.', TEXT_DOMAIN ), importType )
            );
        } else if ( result.error ) {
            createErrorNotice( result.error );
        }
    };

    const handleClearLayer = () => {
        lastProcessedTextRef.current = null;
        deleteLayer( importType );
    };

    const clearFile = () => {
        setPendingFile( null );
        const input = document.getElementById( 'geojson-import-input' );
        if ( input ) input.value = '';
    };

    // Safely forward importer messages to WP notice store ONCE per unique message
    useEffect( () => {
        if ( message?.text && message.text !== lastProcessedTextRef.current ) {
            lastProcessedTextRef.current = message.text;

            if ( message.type === 'success' ) {
                createSuccessNotice( message.text );
                setPendingFile( null );
                if ( typeof onUploadSuccess === 'function' ) {
                    onUploadSuccess();
                }
            } else if ( message.type === 'error' ) {
                createErrorNotice( message.text );
            }
        }
    }, [ message, createSuccessNotice, createErrorNotice, onUploadSuccess ] );

    // Safely forward export errors to WP notice store ONCE per unique error
    useEffect( () => {
        if ( exportError && exportError !== lastExportErrorTextRef.current ) {
            lastExportErrorTextRef.current = exportError;
            createErrorNotice( exportError );
        }
    }, [ exportError, createErrorNotice ] );

    return (
        <div className="tab-content">
            <Text
                variant="title.small"
                display="block"
                style={ { fontWeight: '700', marginBottom: '4px' } }
            >
                { __( 'GIS Layer Manager', TEXT_DOMAIN ) }
            </Text>
            <Text
                variant="caption"
                display="block"
                style={ { color: '#666', marginBottom: '20px' } }
            >
                { __(
                    'Sync spatial geometries, export database layers to GeoJSON, and configure custom column attributes.',
                    TEXT_DOMAIN
                ) }
            </Text>

            <div style={ { marginTop: '20px' } }>
                <input
                    type="file"
                    accept=".geojson"
                    id="geojson-import-input"
                    style={ { display: 'none' } }
                    onChange={ handleFileSelect }
                />

                <SelectControl
                    label={
                        <Flex
                            align="center"
                            justify="flex-start"
                            expanded={ false }
                            height="12px"
                        >
                            { __( 'Target Layer', TEXT_DOMAIN ) }
                            <span className="pulsating-dot-inline" />
                        </Flex>
                    }
                    value={ importType }
                    options={ [
                        { label: 'Parcels', value: 'parcels' },
                        { label: 'Buildings', value: 'buildings' },
                        { label: 'Paths (Display Only)', value: 'paths' },
                        { label: 'Land Use', value: 'land_use' },
                        {
                            label: 'Navigation - Entries & Doors (Points)',
                            value: 'entries',
                        },
                        {
                            label: 'Navigation - Routable Network (Lines)',
                            value: 'network',
                        },
                    ] }
                    onChange={ ( val ) => setImportType( val ) }
                />

                <div style={ { marginTop: '15px' } }>
                    { pendingFile && (
                        <div
                            style={ {
                                marginBottom: '15px',
                                padding: '10px',
                                background: '#f0f6fb',
                                borderRadius: '4px',
                                border: '1px solid #c3d4e3',
                            } }
                        >
                            <Flex align="center" justify="space-between">
                                <Flex align="center" gap={ 2 }>
                                    <Dashicon
                                        icon="media-document"
                                        size={ 16 }
                                    />
                                    <Text style={ { color: '#2271b1' } }>
                                        <strong>{ pendingFile.name }</strong>
                                    </Text>
                                </Flex>
                                <Button
                                    isDestructive
                                    onClick={ clearFile }
                                    icon="no-alt"
                                    showTooltip
                                    label={ __( 'Remove file', TEXT_DOMAIN ) }
                                />
                            </Flex>
                        </div>
                    ) }

                    {/* TWO-ROW ACTION LAYOUT: UNIFORM SECONDARY STYLING FOR FILE SELECT & EXPORT */}
                    <div style={ { display: 'flex', flexDirection: 'column', gap: '10px' } }>
                        <Flex align="center" justify="space-between" gap={ 2 }>
                            <FlexItem style={ { flex: 1 } }>
                                <Button
                                    variant="secondary"
                                    onClick={ () =>
                                        document
                                            .getElementById(
                                                'geojson-import-input'
                                            )
                                            .click()
                                    }
                                    style={ {
                                        width: '100%',
                                        justifyContent: 'center',
                                        height: '36px',
                                    } }
                                >
                                    { pendingFile
                                        ? __( 'Change File', TEXT_DOMAIN )
                                        : __( 'Select GeoJSON', TEXT_DOMAIN ) }
                                </Button>
                            </FlexItem>

                            <FlexItem style={ { flex: 1 } }>
                                <Button
                                    variant="primary"
                                    disabled={ ! pendingFile || isUploading }
                                    isBusy={ isUploading }
                                    onClick={ handleOpenWizard }
                                    style={ {
                                        width: '100%',
                                        justifyContent: 'center',
                                        height: '36px',
                                    } }
                                >
                                    { __( 'Configure & Import', TEXT_DOMAIN ) }
                                </Button>
                            </FlexItem>
                        </Flex>

                        <Button
                            variant="secondary"
                            icon="download"
                            isBusy={ isExporting }
                            disabled={ isExporting || isUploading }
                            onClick={ handleExportLayer }
                            style={ {
                                width: '100%',
                                justifyContent: 'center',
                                height: '36px',
                            } }
                        >
                            { sprintf( __( 'Export "%s" Layer to GeoJSON', TEXT_DOMAIN ), importType ) }
                        </Button>

                        <Flex
                            wrap="wrap"
                            gap={ 2 }
                            style={ {
                                margin: '5px 0px',
                                justifyContent: 'flex-end',
                            } }
                        >
                            <ExternalLink
                                href="https://drive.google.com/file/d/10MCwKA_8h_gtj9pKiG1m6G4Z7nryRLxY/view?usp=sharing"
                                style={ { color: '#2271b1' } }
                            >
                                { __( 'Sample Import Data', TEXT_DOMAIN ) }
                            </ExternalLink>
                        </Flex>
                    </div>
                </div>

                { /* Import Wizard Modal Trigger */ }
                { isWizardOpen && (
                    <GeoJSONImportWizardModal
                        file={ pendingFile }
                        layerType={ importType }
                        onClose={ () => setIsWizardOpen( false ) }
                        onInspect={ inspectGeoJSON }
                        onExecuteImport={ importGeoJSON }
                    />
                ) }

                { /* Danger Zone: Wiping Layer */ }
                <div
                    style={ {
                        marginTop: '20px',
                        padding: '20px',
                        border: '2px dashed #d63638',
                        borderRadius: '8px',
                        background: '#fff8f8',
                    } }
                >
                    <Flex
                        align="center"
                        gap={ 2 }
                        style={ { marginBottom: '10px' } }
                    >
                        <Dashicon
                            icon="warning"
                            style={ { color: '#d63638' } }
                        />
                        <Text
                            variant="title.small"
                            style={ { color: '#d63638', fontWeight: '600' } }
                        >
                            { __( 'Danger Zone', TEXT_DOMAIN ) }
                        </Text>
                    </Flex>

                    <Flex style={ { marginBottom: '15px' } }>
                        <Text
                            variant="caption"
                            display="block"
                            style={ { color: '#555' } }
                        >
                            { sprintf(
                                __(
                                    'This will permanently delete all features and properties associated with the "%s" layer.',
                                    TEXT_DOMAIN
                                ),
                                importType
                            ) }
                        </Text>
                    </Flex>

                    <Button
                        isDestructive
                        variant="primary"
                        disabled={ isUploading || isExporting }
                        onClick={ handleClearLayer }
                        style={ { width: '100%', justifyContent: 'center', height: '36px' } }
                    >
                        <Dashicon icon="trash" />
                        { sprintf(
                            __( 'Wipe "%s" Layer', TEXT_DOMAIN ),
                            importType
                        ) }
                    </Button>
                </div>
            </div>
        </div>
    );
};