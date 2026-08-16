import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
    __experimentalText as Text,
    SelectControl,
    PanelBody,
    Flex,
} from '@wordpress/components';
import { TypographyRowControl } from '../typographyRowControl';

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

export const TypographyTab = ( {
    typographySettings = {},
    updateTypography,
    disabled = false,
} ) => {
    return (
        <div className="tab-content">
            <Text
                variant="title.small"
                display="block"
                style={ { marginBottom: '15px' } }
            >
                { __( 'Global Typography & Font Management', TEXT_DOMAIN ) }
            </Text>

            { /* GLOBAL FONT FAMILY SELECTION */ }
            <div
                style={ {
                    padding: '20px',
                    background: '#f9f9f9',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0',
                    marginBottom: '20px',
                } }
            >
                <SelectControl
                    label={ __( 'Global Font Family', TEXT_DOMAIN ) }
                    value={ typographySettings.fontFamily }
                    options={ FONT_FAMILY_OPTIONS }
                    onChange={ ( val ) => updateTypography( 'fontFamily', val ) }
                    disabled={ disabled }
                    help={ __(
                        'Applies across all public map overlays, side drawer content, search, and legend text.',
                        TEXT_DOMAIN
                    ) }
                    __nextHasNoMarginBottom
                />
            </div>

            { /* SECTION 1: MAP LEGEND TYPOGRAPHY */ }
            <div
                style={ {
                    marginBottom: '20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden',
                } }
            >
                <PanelBody
                    title={ __( '1. Map Legend Typography', TEXT_DOMAIN ) }
                    initialOpen={ true }
                >
                    <Flex direction="column" gap={ 3 }>
                        <TypographyRowControl
                            title={ __( 'Legend Title Header', TEXT_DOMAIN ) }
                            sizeKey="legendHeaderFontSize"
                            defaultSize={ 13 }
                            minSize={ 10 }
                            maxSize={ 24 }
                            weightKey="legendHeaderFontWeight"
                            defaultWeight="800"
                            styleKey="legendHeaderFontStyle"
                            decorationKey="legendHeaderDecoration"
                            typographySettings={ typographySettings }
                            updateTypography={ updateTypography }
                            disabled={ disabled }
                        />

                        <TypographyRowControl
                            title={ __( 'Section Group Headers', TEXT_DOMAIN ) }
                            sizeKey="legendSectionFontSize"
                            defaultSize={ 10 }
                            minSize={ 8 }
                            maxSize={ 18 }
                            weightKey="legendSectionFontWeight"
                            defaultWeight="800"
                            styleKey="legendSectionFontStyle"
                            decorationKey="legendSectionDecoration"
                            typographySettings={ typographySettings }
                            updateTypography={ updateTypography }
                            disabled={ disabled }
                        />

                        <TypographyRowControl
                            title={ __( 'Individual Legend Entry Labels', TEXT_DOMAIN ) }
                            sizeKey="legendItemFontSize"
                            defaultSize={ 11 }
                            minSize={ 8 }
                            maxSize={ 18 }
                            weightKey="legendItemFontWeight"
                            defaultWeight="600"
                            styleKey="legendItemFontStyle"
                            decorationKey="legendItemDecoration"
                            typographySettings={ typographySettings }
                            updateTypography={ updateTypography }
                            disabled={ disabled }
                        />
                    </Flex>
                </PanelBody>
            </div>

            { /* SECTION 2: SIDE DRAWER TYPOGRAPHY */ }
            <div
                style={ {
                    marginBottom: '20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden',
                } }
            >
                <PanelBody
                    title={ __( '2. Side Drawer & Content Typography', TEXT_DOMAIN ) }
                    initialOpen={ false }
                >
                    <Flex direction="column" gap={ 3 }>
                        <TypographyRowControl
                            title={ __( 'Category Header Label', TEXT_DOMAIN ) }
                            sizeKey="drawerCategoryFontSize"
                            defaultSize={ 11 }
                            minSize={ 8 }
                            maxSize={ 18 }
                            weightKey="drawerCategoryFontWeight"
                            defaultWeight="700"
                            styleKey="drawerCategoryFontStyle"
                            decorationKey="drawerCategoryDecoration"
                            typographySettings={ typographySettings }
                            updateTypography={ updateTypography }
                            disabled={ disabled }
                        />

                        <TypographyRowControl
                            title={ __( 'Main Location Title (H2)', TEXT_DOMAIN ) }
                            sizeKey="drawerTitleFontSize"
                            defaultSize={ 28 }
                            minSize={ 16 }
                            maxSize={ 42 }
                            weightKey="drawerTitleFontWeight"
                            defaultWeight="800"
                            styleKey="drawerTitleFontStyle"
                            decorationKey="drawerTitleDecoration"
                            typographySettings={ typographySettings }
                            updateTypography={ updateTypography }
                            disabled={ disabled }
                        />

                        <TypographyRowControl
                            title={ __( 'Secondary Subtitle / Unit Name', TEXT_DOMAIN ) }
                            sizeKey="drawerSubtitleFontSize"
                            defaultSize={ 16 }
                            minSize={ 12 }
                            maxSize={ 24 }
                            weightKey="drawerSubtitleFontWeight"
                            defaultWeight="600"
                            styleKey="drawerSubtitleFontStyle"
                            decorationKey="drawerSubtitleDecoration"
                            typographySettings={ typographySettings }
                            updateTypography={ updateTypography }
                            disabled={ disabled }
                        />

                        <TypographyRowControl
                            title={ __( 'WP Content Headings (H1 - H3)', TEXT_DOMAIN ) }
                            sizeKey="drawerHeadingFontSize"
                            defaultSize={ 20 }
                            minSize={ 14 }
                            maxSize={ 32 }
                            weightKey="drawerHeadingFontWeight"
                            defaultWeight="700"
                            styleKey="drawerHeadingFontStyle"
                            decorationKey="drawerHeadingDecoration"
                            typographySettings={ typographySettings }
                            updateTypography={ updateTypography }
                            disabled={ disabled }
                        />

                        <TypographyRowControl
                            title={ __( 'Body Paragraphs & Bullet Points', TEXT_DOMAIN ) }
                            sizeKey="drawerBodyFontSize"
                            defaultSize={ 14 }
                            minSize={ 10 }
                            maxSize={ 22 }
                            weightKey="drawerBodyFontWeight"
                            defaultWeight="400"
                            styleKey="drawerBodyFontStyle"
                            decorationKey="drawerBodyDecoration"
                            typographySettings={ typographySettings }
                            updateTypography={ updateTypography }
                            disabled={ disabled }
                        />

                        <TypographyRowControl
                            title={ __( 'Blockquotes & Citations', TEXT_DOMAIN ) }
                            sizeKey="drawerQuoteFontSize"
                            defaultSize={ 14 }
                            minSize={ 10 }
                            maxSize={ 22 }
                            weightKey="drawerQuoteFontWeight"
                            defaultWeight="400"
                            styleKey="drawerQuoteFontStyle"
                            decorationKey="drawerQuoteDecoration"
                            typographySettings={ typographySettings }
                            updateTypography={ updateTypography }
                            disabled={ disabled }
                        />

                        <TypographyRowControl
                            title={ __( 'Unit Specs Numbers', TEXT_DOMAIN ) }
                            sizeKey="drawerSpecsNumberFontSize"
                            defaultSize={ 14 }
                            minSize={ 10 }
                            maxSize={ 24 }
                            weightKey="drawerSpecsNumberFontWeight"
                            defaultWeight="800"
                            styleKey="drawerSpecsNumberFontStyle"
                            decorationKey="drawerSpecsNumberDecoration"
                            typographySettings={ typographySettings }
                            updateTypography={ updateTypography }
                            disabled={ disabled }
                        />

                        <TypographyRowControl
                            title={ __( 'Unit Specs Labels', TEXT_DOMAIN ) }
                            sizeKey="drawerSpecsLabelFontSize"
                            defaultSize={ 9 }
                            minSize={ 7 }
                            maxSize={ 16 }
                            weightKey="drawerSpecsLabelFontWeight"
                            defaultWeight="700"
                            styleKey="drawerSpecsLabelFontStyle"
                            decorationKey="drawerSpecsLabelDecoration"
                            typographySettings={ typographySettings }
                            updateTypography={ updateTypography }
                            disabled={ disabled }
                        />
                    </Flex>
                </PanelBody>
            </div>

            { /* SECTION 3: MAP OVERLAY CONTROLS TYPOGRAPHY */ }
            <div
                style={ {
                    marginBottom: '20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden',
                } }
            >
                <PanelBody
                    title={ __( '3. Map Overlay Controls Typography', TEXT_DOMAIN ) }
                    initialOpen={ false }
                >
                    <Flex direction="column" gap={ 3 }>
                        <TypographyRowControl
                            title={ __( 'Layer Toggler Header Title', TEXT_DOMAIN ) }
                            sizeKey="controlsHeaderFontSize"
                            defaultSize={ 12 }
                            minSize={ 9 }
                            maxSize={ 20 }
                            weightKey="controlsHeaderFontWeight"
                            defaultWeight="800"
                            styleKey="controlsHeaderFontStyle"
                            decorationKey="controlsHeaderDecoration"
                            typographySettings={ typographySettings }
                            updateTypography={ updateTypography }
                            disabled={ disabled }
                        />

                        <TypographyRowControl
                            title={ __( 'Layer Item Row Labels', TEXT_DOMAIN ) }
                            sizeKey="controlsItemFontSize"
                            defaultSize={ 11 }
                            minSize={ 8 }
                            maxSize={ 18 }
                            weightKey="controlsItemFontWeight"
                            defaultWeight="600"
                            styleKey="controlsItemFontStyle"
                            decorationKey="controlsItemDecoration"
                            typographySettings={ typographySettings }
                            updateTypography={ updateTypography }
                            disabled={ disabled }
                        />

                        <TypographyRowControl
                            title={ __( 'Floor Switcher Button Labels', TEXT_DOMAIN ) }
                            sizeKey="controlsFloorFontSize"
                            defaultSize={ 11 }
                            minSize={ 8 }
                            maxSize={ 18 }
                            weightKey="controlsFloorFontWeight"
                            defaultWeight="800"
                            styleKey="controlsFloorFontStyle"
                            decorationKey="controlsFloorDecoration"
                            typographySettings={ typographySettings }
                            updateTypography={ updateTypography }
                            disabled={ disabled }
                        />
                    </Flex>
                </PanelBody>
            </div>
        </div>
    );
};

export default TypographyTab;