import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
    __experimentalText as Text,
    SelectControl,
    PanelBody,
    Flex,
    Button,
} from '@wordpress/components';
import { TypographyRowControl } from '../typographyRowControl';

const FONT_FAMILY_OPTIONS = [
    { label: __( 'System Sans-Serif (Default)', 'bawbab-interactive-maps' ), value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif'},
    { label: __( 'Arial / Helvetica', 'bawbab-interactive-maps' ), value: 'Arial, Helvetica, sans-serif' },
    { label: __( 'Georgia / Serif', 'bawbab-interactive-maps' ), value: 'Georgia, "Times New Roman", serif' },
    { label: __( 'Trebuchet MS', 'bawbab-interactive-maps' ), value: '"Trebuchet MS", "Lucida Sans Unicode", sans-serif' },
    { label: __( 'Verdana', 'bawbab-interactive-maps' ), value: 'Verdana, Geneva, sans-serif' },
    { label: __( 'Courier New / Monospace', 'bawbab-interactive-maps' ), value: '"Courier New", Courier, monospace' },
];

export const TypographyTab = ( {
    typographySettings = {},
    updateTypography,
    resetTypography,
    disabled = false,
} ) => {
    return (
        <div className="tab-content">
            { /* TOP HEADER BANNER WITH CENTERED RESET BUTTON */ }
            <div
                style={ {
                    marginBottom: '20px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid #e0e0e0',
                } }
            >
                <Text
                    variant="title.small"
                    display="block"
                    style={ { fontWeight: '700', marginBottom: '4px' } }
                >
                    { __( 'Global Typography & Font Management', 'bawbab-interactive-maps' ) }
                </Text>
                <Text
                    variant="caption"
                    display="block"
                    style={ { color: '#666', fontSize: '12px', marginBottom: '14px' } }
                >
                    { __( 'Configure typography rules across map components.', 'bawbab-interactive-maps' ) }
                </Text>

                { resetTypography && (
                    <Button
                        variant="secondary"
                        isSmall
                        icon="undo"
                        onClick={ resetTypography }
                        disabled={ disabled }
                        style={ {
                            height: '36px',
                            width: '100%',
                            justifyContent: 'center',
                            alignItems: 'center',
                            display: 'inline-flex',
                            gap: '6px',
                        } }
                    >
                        { __( 'Reset All to Defaults', 'bawbab-interactive-maps' ) }
                    </Button>
                ) }
            </div>

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
                    label={ __( 'Global Font Family', 'bawbab-interactive-maps' ) }
                    value={ typographySettings.fontFamily }
                    options={ FONT_FAMILY_OPTIONS }
                    onChange={ ( val ) => updateTypography( 'fontFamily', val ) }
                    disabled={ disabled }
                    help={ __(
                        'Applies across all public map overlays, navbar titles, side drawer content, search, and legend text.',
                        'bawbab-interactive-maps'
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
                    title={ __( '1. Map Legend Typography', 'bawbab-interactive-maps' ) }
                    initialOpen={ false }
                >
                    <Flex direction="column" gap={ 3 }>
                        <TypographyRowControl
                            title={ __( 'Legend Title Header', 'bawbab-interactive-maps' ) }
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
                            title={ __( 'Section Group Headers', 'bawbab-interactive-maps' ) }
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
                            title={ __( 'Individual Legend Entry Labels', 'bawbab-interactive-maps' ) }
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
                    title={ __( '2. Side Drawer & Content Typography', 'bawbab-interactive-maps' ) }
                    initialOpen={ false }
                >
                    <Flex direction="column" gap={ 3 }>
                        <TypographyRowControl
                            title={ __( 'Category Header Label', 'bawbab-interactive-maps' ) }
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
                            title={ __( 'Main Location Title (H2)', 'bawbab-interactive-maps' ) }
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
                            title={ __( 'Secondary Subtitle / Unit Name', 'bawbab-interactive-maps' ) }
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
                            title={ __( 'WP Content Headings (H1 - H3)', 'bawbab-interactive-maps' ) }
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
                            title={ __( 'Body Paragraphs & Bullet Points', 'bawbab-interactive-maps' ) }
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
                            title={ __( 'Blockquotes & Citations', 'bawbab-interactive-maps' ) }
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
                            title={ __( 'Unit Specs Numbers', 'bawbab-interactive-maps' ) }
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
                            title={ __( 'Unit Specs Labels', 'bawbab-interactive-maps' ) }
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
                    title={ __( '3. Map Overlay Controls Typography', 'bawbab-interactive-maps' ) }
                    initialOpen={ false }
                >
                    <Flex direction="column" gap={ 3 }>
                        <TypographyRowControl
                            title={ __( 'Layer Toggler Header Title', 'bawbab-interactive-maps' ) }
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
                            title={ __( 'Layer Item Row Labels', 'bawbab-interactive-maps' ) }
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
                            title={ __( 'Floor Switcher Button Labels', 'bawbab-interactive-maps' ) }
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

            { /* SECTION 4: SEARCH BAR & SEARCH MENU TYPOGRAPHY */ }
            <div
                style={ {
                    marginBottom: '20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden',
                } }
            >
                <PanelBody
                    title={ __( '4. Search Input & Search Menu Typography', 'bawbab-interactive-maps' ) }
                    initialOpen={ false }
                >
                    <Flex direction="column" gap={ 3 }>
                        <TypographyRowControl
                            title={ __( 'Search Menu Top-Level Tab Buttons', 'bawbab-interactive-maps' ) }
                            sizeKey="searchTabFontSize"
                            defaultSize={ 14 }
                            minSize={ 10 }
                            maxSize={ 22 }
                            weightKey="searchTabFontWeight"
                            defaultWeight="600"
                            styleKey="searchTabFontStyle"
                            decorationKey="searchTabDecoration"
                            typographySettings={ typographySettings }
                            updateTypography={ updateTypography }
                            disabled={ disabled }
                        />

                        <TypographyRowControl
                            title={ __( 'Search Menu Group Header Accordions', 'bawbab-interactive-maps' ) }
                            sizeKey="searchGroupHeaderFontSize"
                            defaultSize={ 13 }
                            minSize={ 9 }
                            maxSize={ 20 }
                            weightKey="searchGroupHeaderFontWeight"
                            defaultWeight="600"
                            styleKey="searchGroupHeaderFontStyle"
                            decorationKey="searchGroupHeaderDecoration"
                            typographySettings={ typographySettings }
                            updateTypography={ updateTypography }
                            disabled={ disabled }
                        />

                        <TypographyRowControl
                            title={ __( 'Search Menu Sub-List Row Items', 'bawbab-interactive-maps' ) }
                            sizeKey="searchItemFontSize"
                            defaultSize={ 12 }
                            minSize={ 8 }
                            maxSize={ 18 }
                            weightKey="searchItemFontWeight"
                            defaultWeight="400"
                            styleKey="searchItemFontStyle"
                            decorationKey="searchItemDecoration"
                            typographySettings={ typographySettings }
                            updateTypography={ updateTypography }
                            disabled={ disabled }
                        />

                        <TypographyRowControl
                            title={ __( 'Search Input Placeholder & Text', 'bawbab-interactive-maps' ) }
                            sizeKey="searchInputFontSize"
                            defaultSize={ 13 }
                            minSize={ 10 }
                            maxSize={ 22 }
                            weightKey="searchInputFontWeight"
                            defaultWeight="400"
                            styleKey="searchInputFontStyle"
                            decorationKey="searchInputDecoration"
                            typographySettings={ typographySettings }
                            updateTypography={ updateTypography }
                            disabled={ disabled }
                        />

                        <TypographyRowControl
                            title={ __( 'Autocomplete Result Title Text', 'bawbab-interactive-maps' ) }
                            sizeKey="searchResultTitleFontSize"
                            defaultSize={ 12 }
                            minSize={ 8 }
                            maxSize={ 18 }
                            weightKey="searchResultTitleFontWeight"
                            defaultWeight="600"
                            styleKey="searchResultTitleFontStyle"
                            decorationKey="searchResultTitleDecoration"
                            typographySettings={ typographySettings }
                            updateTypography={ updateTypography }
                            disabled={ disabled }
                        />

                        <TypographyRowControl
                            title={ __( 'Autocomplete Result Category Label', 'bawbab-interactive-maps' ) }
                            sizeKey="searchResultCatFontSize"
                            defaultSize={ 9 }
                            minSize={ 7 }
                            maxSize={ 16 }
                            weightKey="searchResultCatFontWeight"
                            defaultWeight="700"
                            styleKey="searchResultCatFontStyle"
                            decorationKey="searchResultCatDecoration"
                            typographySettings={ typographySettings }
                            updateTypography={ updateTypography }
                            disabled={ disabled }
                        />
                    </Flex>
                </PanelBody>
            </div>

            { /* SECTION 5: MAP HEADER TITLE & DESCRIPTION TYPOGRAPHY */ }
            <div
                style={ {
                    marginBottom: '20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden',
                } }
            >
                <PanelBody
                    title={ __( '5. Map Header Title & Subtitle Typography', 'bawbab-interactive-maps' ) }
                    initialOpen={ false }
                >
                    <Flex direction="column" gap={ 3 }>
                        <TypographyRowControl
                            title={ __( 'Map Header Title', 'bawbab-interactive-maps' ) }
                            sizeKey="mapTitleFontSize"
                            defaultSize={ 16 }
                            minSize={ 10 }
                            maxSize={ 32 }
                            weightKey="mapTitleFontWeight"
                            defaultWeight="700"
                            styleKey="mapTitleFontStyle"
                            decorationKey="mapTitleDecoration"
                            typographySettings={ typographySettings }
                            updateTypography={ updateTypography }
                            disabled={ disabled }
                        />

                        <TypographyRowControl
                            title={ __( 'Map Header Subtitle / Description', 'bawbab-interactive-maps' ) }
                            sizeKey="mapDescriptionFontSize"
                            defaultSize={ 11 }
                            minSize={ 8 }
                            maxSize={ 22 }
                            weightKey="mapDescriptionFontWeight"
                            defaultWeight="400"
                            styleKey="mapDescriptionFontStyle"
                            decorationKey="mapDescriptionDecoration"
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