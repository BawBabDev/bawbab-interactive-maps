import {
    RangeControl,
    SelectControl,
    Button,
    Flex,
    FlexItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

const FONT_WEIGHT_OPTIONS = [
    { label: __( 'Regular', TEXT_DOMAIN ), value: '400' },
    { label: __( 'Medium', TEXT_DOMAIN ), value: '500' },
    { label: __( 'Semi-Bold', TEXT_DOMAIN ), value: '600' },
    { label: __( 'Bold', TEXT_DOMAIN ), value: '700' },
    { label: __( 'Heavy Bold', TEXT_DOMAIN ), value: '800' },
];

export const TypographyRowControl = ( {
    title,
    sizeKey,
    defaultSize = 14,
    minSize = 8,
    maxSize = 36,
    weightKey,
    defaultWeight = '400',
    styleKey,
    decorationKey,
    typographySettings = {},
    updateTypography,
    disabled = false,
} ) => {
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
                <FlexItem style={ { flex: '1 1 180px', minWidth: '140px' } }>
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
                <FlexItem style={ { width: '105px', flexShrink: 0 } }>
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