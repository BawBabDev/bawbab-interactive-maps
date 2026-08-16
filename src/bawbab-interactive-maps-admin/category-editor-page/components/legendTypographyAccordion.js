import {
    PanelBody,
    RangeControl,
    SelectControl,
    Button,
    Flex,
    FlexItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

const FONT_FAMILY_OPTIONS = [
    {
        label: __( 'System Sans-Serif (Default)', TEXT_DOMAIN ),
        value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
    },
    { label: __( 'Arial / Helvetica', TEXT_DOMAIN ), value: 'Arial, Helvetica, sans-serif' },
    { label: __( 'Georgia / Serif', TEXT_DOMAIN ), value: 'Georgia, "Times New Roman", serif' },
    { label: __( 'Trebuchet MS', TEXT_DOMAIN ), value: '"Trebuchet MS", "Lucida Sans Unicode", sans-serif' },
    { label: __( 'Verdana', TEXT_DOMAIN ), value: 'Verdana, Geneva, sans-serif' },
    { label: __( 'Courier New / Monospace', TEXT_DOMAIN ), value: '"Courier New", Courier, monospace' },
];

// Descriptive weight options with styled typography labels
const FONT_WEIGHT_OPTIONS = [
    { label: __( 'Regular', TEXT_DOMAIN ), value: '400', style: { fontWeight: 400 } },
    { label: __( 'Medium', TEXT_DOMAIN ), value: '500', style: { fontWeight: 500 } },
    { label: __( 'Semi-Bold', TEXT_DOMAIN ), value: '600', style: { fontWeight: 600 } },
    { label: __( 'Bold', TEXT_DOMAIN ), value: '700', style: { fontWeight: 700 } },
    { label: __( 'Heavy Bold', TEXT_DOMAIN ), value: '800', style: { fontWeight: 800 } },
];

export const LegendTypographyAccordion = ( {
    typographySettings,
    updateTypography,
    disabled = false,
} ) => {
    // Helper to render a single-line row for size, weight, and style toggles
    const renderTypographyRow = (
        title,
        sizeKey,
        defaultSize,
        minSize,
        maxSize,
        weightKey,
        defaultWeight,
        styleKey,
        decorationKey
    ) => {
        const isItalic = typographySettings[ styleKey ] === 'italic';
        const isUnderline = typographySettings[ decorationKey ] === 'underline';
        const isLineThrough = typographySettings[ decorationKey ] === 'line-through';

        return (
            <div style={ { paddingBottom: '12px', borderBottom: '1px solid #eee' } }>
                <div style={ { marginBottom: '6px', fontSize: '11px', fontWeight: 700, color: '#555' } }>
                    { title }
                </div>
                <Flex align="center" gap={ 2 } wrap={ false }>
                    { /* Short Range Control / Slider + Number Input */ }
                    <FlexItem style={ { flex: '1 1 200px', minWidth: '160px' } }>
                        <RangeControl
                            value={ typographySettings[ sizeKey ] || defaultSize }
                            onChange={ ( val ) => updateTypography( sizeKey, val ) }
                            min={ minSize }
                            max={ maxSize }
                            step={ 1 }
                            disabled={ disabled }
                            __nextHasNoMarginBottom
                        />
                    </FlexItem>

                    { /* Compact Descriptive Weight Dropdown */ }
                    <FlexItem style={ { width: '110px', flexShrink: 0 } }>
                        <SelectControl
                            value={ typographySettings[ weightKey ] || defaultWeight }
                            options={ FONT_WEIGHT_OPTIONS }
                            onChange={ ( val ) => updateTypography( weightKey, val ) }
                            disabled={ disabled }
                            __nextHasNoMarginBottom
                        />
                    </FlexItem>

                    { /* Toggleable Icon Buttons for Underline, Strikethrough, Italic */ }
                    <FlexItem style={ { flexShrink: 0 } }>
                        <Flex align="center" gap={ 1 }>
                            <Button
                                isSmall
                                icon="editor-underline"
                                isPressed={ isUnderline }
                                onClick={ () =>
                                    updateTypography(
                                        decorationKey,
                                        isUnderline ? 'none' : 'underline'
                                    )
                                }
                                disabled={ disabled }
                                label={ __( 'Underline', TEXT_DOMAIN ) }
                            />
                            <Button
                                isSmall
                                icon="editor-strikethrough"
                                isPressed={ isLineThrough }
                                onClick={ () =>
                                    updateTypography(
                                        decorationKey,
                                        isLineThrough ? 'none' : 'line-through'
                                    )
                                }
                                disabled={ disabled }
                                label={ __( 'Line-Through', TEXT_DOMAIN ) }
                            />
                            <Button
                                isSmall
                                icon="editor-italic"
                                isPressed={ isItalic }
                                onClick={ () =>
                                    updateTypography(
                                        styleKey,
                                        isItalic ? 'normal' : 'italic'
                                    )
                                }
                                disabled={ disabled }
                                label={ __( 'Italic', TEXT_DOMAIN ) }
                            />
                        </Flex>
                    </FlexItem>
                </Flex>
            </div>
        );
    };

    return (
        <div
            style={ {
                marginBottom: '20px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                overflow: 'hidden',
                opacity: disabled ? 0.6 : 1,
            } }
        >
            <PanelBody
                title={ __( 'Advanced Legend Font Styling', TEXT_DOMAIN ) }
                initialOpen={ false }
            >
                <Flex direction="column" gap={ 3 }>
                    { /* GLOBAL FONT FAMILY SELECTOR */ }
                    <div style={ { paddingBottom: '12px', borderBottom: '1px solid #eee' } }>
                        <SelectControl
                            label={ __( 'Font Family', TEXT_DOMAIN ) }
                            value={ typographySettings.fontFamily }
                            options={ FONT_FAMILY_OPTIONS }
                            onChange={ ( val ) => updateTypography( 'fontFamily', val ) }
                            disabled={ disabled }
                            __nextHasNoMarginBottom
                        />
                    </div>

                    { /* 1. LEGEND TITLE HEADER */ }
                    { renderTypographyRow(
                        __( 'Legend Title Header', TEXT_DOMAIN ),
                        'legendHeaderFontSize',
                        13,
                        10,
                        24,
                        'legendHeaderFontWeight',
                        '800',
                        'legendHeaderFontStyle',
                        'legendHeaderDecoration'
                    ) }

                    { /* 2. SECTION GROUP HEADERS */ }
                    { renderTypographyRow(
                        __( 'Section Group Headers', TEXT_DOMAIN ),
                        'legendSectionFontSize',
                        10,
                        8,
                        18,
                        'legendSectionFontWeight',
                        '800',
                        'legendSectionFontStyle',
                        'legendSectionDecoration'
                    ) }

                    { /* 3. INDIVIDUAL LEGEND ENTRY LABELS */ }
                    { renderTypographyRow(
                        __( 'Individual Legend Entry Labels', TEXT_DOMAIN ),
                        'legendItemFontSize',
                        11,
                        8,
                        18,
                        'legendItemFontWeight',
                        '600',
                        'legendItemFontStyle',
                        'legendItemDecoration'
                    ) }
                </Flex>
            </PanelBody>
        </div>
    );
};