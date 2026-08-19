import {
    RangeControl,
    SelectControl,
    Button,
    Flex,
    FlexItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const FONT_WEIGHT_OPTIONS = [
    { label: __( 'Regular', 'bawbab-interactive-maps' ), value: '400' },
    { label: __( 'Medium', 'bawbab-interactive-maps' ), value: '500' },
    { label: __( 'Semi-Bold', 'bawbab-interactive-maps' ), value: '600' },
    { label: __( 'Bold', 'bawbab-interactive-maps' ), value: '700' },
    { label: __( 'Heavy Bold', 'bawbab-interactive-maps' ), value: '800' },
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
        <div style={ { paddingBottom: '10px', borderBottom: '1px solid #eee' } }>
            <div style={ { marginBottom: '6px', fontSize: '11px', fontWeight: 700, color: '#555' } }>
                { title }
            </div>
            <Flex align="center" gap={ 1 } wrap={ false } style={ { width: '100%', overflow: 'hidden', padding: '0 2px' } }>
                { /* Fluid Range Control / Slider + Compressed Number Input */ }
                <FlexItem style={ { flex: 1, minWidth: 0 } } className="compact-range-control-item">
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

                { /* Compact Font Weight Dropdown with Matched 30px Height */ }
                <FlexItem style={ { width: '92px', flexShrink: 0 } } className="compact-weight-dropdown">
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
                            label={ __( 'Underline', 'bawbab-interactive-maps' ) }
                            style={ { height: '30px', minHeight: '30px' } }
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
                            label={ __( 'Line-Through', 'bawbab-interactive-maps' ) }
                            style={ { height: '30px', minHeight: '30px' } }
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
                            label={ __( 'Italic', 'bawbab-interactive-maps' ) }
                            style={ { height: '30px', minHeight: '30px' } }
                        />
                    </Flex>
                </FlexItem>
            </Flex>
        </div>
    );
};