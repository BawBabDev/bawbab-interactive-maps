import { PanelBody, RangeControl, Flex, FlexItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

export const LegendTypographyAccordion = ( {
    typographySettings,
    updateTypography,
    disabled = false,
} ) => {
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
                    <FlexItem>
                        <RangeControl
                            label={ __( 'Legend Header Size (px)', TEXT_DOMAIN ) }
                            value={ typographySettings.legendHeaderFontSize || 13 }
                            onChange={ ( val ) => updateTypography( 'legendHeaderFontSize', val ) }
                            min={ 10 }
                            max={ 20 }
                            step={ 1 }
                            disabled={ disabled }
                        />
                    </FlexItem>

                    <FlexItem>
                        <RangeControl
                            label={ __( 'Section Title Size (px)', TEXT_DOMAIN ) }
                            value={ typographySettings.legendSectionFontSize || 10 }
                            onChange={ ( val ) => updateTypography( 'legendSectionFontSize', val ) }
                            min={ 8 }
                            max={ 16 }
                            step={ 1 }
                            disabled={ disabled }
                        />
                    </FlexItem>

                    <FlexItem>
                        <RangeControl
                            label={ __( 'Item Label Size (px)', TEXT_DOMAIN ) }
                            value={ typographySettings.legendItemFontSize || 11 }
                            onChange={ ( val ) => updateTypography( 'legendItemFontSize', val ) }
                            min={ 9 }
                            max={ 16 }
                            step={ 1 }
                            disabled={ disabled }
                        />
                    </FlexItem>
                </Flex>
            </PanelBody>
        </div>
    );
};