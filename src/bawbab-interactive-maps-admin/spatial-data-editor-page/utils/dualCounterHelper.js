/**
 * Dual Counter Helper Utilities
 * File location: src/utils/dualCounterHelper.js
 */

const TIME_UNIT_PRESETS = {
    hours_minutes: { major: 'hr', minor: 'min', majorFull: 'Hours', minorFull: 'Minutes', minorRatio: 60 },
    minutes_seconds: { major: 'min', minor: 'sec', majorFull: 'Minutes', minorFull: 'Seconds', minorRatio: 60 },
    days_hours: { major: 'd', minor: 'hr', majorFull: 'Days', minorFull: 'Hours', minorRatio: 24 },
};

const MEASUREMENT_UNIT_PRESETS = {
    feet_inches: { major: 'ft', minor: 'in', majorFull: 'Feet', minorFull: 'Inches', minorRatio: 12, useSymbols: true },
    miles_feet: { major: 'mi', minor: 'ft', majorFull: 'Miles', minorFull: 'Feet', minorRatio: 5280, useSymbols: false },
    km_meters: { major: 'km', minor: 'm', majorFull: 'Kilometers', minorFull: 'Meters', minorRatio: 1000, useSymbols: false },
    meters_cm: { major: 'm', minor: 'cm', majorFull: 'Meters', minorFull: 'Centimeters', minorRatio: 100, useSymbols: false },
};

/**
 * Formats a dual_counter numeric value into structured major/minor visual representations.
 *
 * @param {number|string} rawValue - Numeric value (e.g. 1.5)
 * @param {Object} config - Configuration options
 * @param {string} [config.mode='split'] - 'split' | 'time' | 'measurement'
 * @param {string} [config.mainUnit] - Selected unit key from drop-down
 * @param {string} [config.majorLabel] - Label/Unit string override
 * @param {string} [config.minorLabel] - Sub-label/Unit string override
 * @returns {Object} Structured values for major and minor parts
 */
export const formatDualCounter = ( rawValue, config = {} ) => {
    const numericVal = parseFloat( rawValue );
    if ( isNaN( numericVal ) || numericVal < 0 ) {
        return {
            displayText: '--',
            majorValue: '--',
            minorValue: '--',
            majorLabel: config.majorLabel || 'Full',
            minorLabel: config.minorLabel || 'Half',
        };
    }

    const mode = config.mode || 'split';

    switch ( mode ) {
        case 'time': {
            const unitKey = config.mainUnit || 'hours_minutes';
            const preset = TIME_UNIT_PRESETS[ unitKey ] || TIME_UNIT_PRESETS.hours_minutes;

            const majorCount = Math.floor( numericVal );
            const remainder = numericVal - majorCount;
            const minorCount = Math.round( remainder * preset.minorRatio );

            const parts = [];
            if ( majorCount > 0 || minorCount === 0 ) {
                parts.push( `${ majorCount } ${ preset.major }` );
            }
            if ( minorCount > 0 ) {
                parts.push( `${ minorCount } ${ preset.minor }` );
            }

            return {
                displayText: parts.join( ' ' ).trim(),
                majorValue: `${ majorCount } ${ preset.major }`,
                minorValue: `${ minorCount } ${ preset.minor }`,
                majorLabel: config.majorLabel || preset.majorFull,
                minorLabel: config.minorLabel || preset.minorFull,
            };
        }

        case 'measurement': {
            const unitKey = config.mainUnit || 'feet_inches';
            const preset = MEASUREMENT_UNIT_PRESETS[ unitKey ] || MEASUREMENT_UNIT_PRESETS.feet_inches;

            const majorCount = Math.floor( numericVal );
            const remainder = numericVal - majorCount;
            const minorCount = Math.round( remainder * preset.minorRatio );

            let displayStr = '';
            if ( preset.useSymbols ) {
                displayStr = `${ majorCount }' ${ minorCount }"`;
            } else {
                const parts = [];
                if ( majorCount > 0 || minorCount === 0 ) {
                    parts.push( `${ majorCount } ${ preset.major }` );
                }
                if ( minorCount > 0 ) {
                    parts.push( `${ minorCount } ${ preset.minor }` );
                }
                displayStr = parts.join( ' ' ).trim();
            }

            return {
                displayText: displayStr,
                majorValue: `${ majorCount } ${ preset.major }`,
                minorValue: `${ minorCount } ${ preset.minor }`,
                majorLabel: config.majorLabel || preset.majorFull,
                minorLabel: config.minorLabel || preset.minorFull,
            };
        }

        case 'split':
        default: {
            const majorCount = Math.floor( numericVal );
            const minorCount = Math.ceil( numericVal );

            return {
                displayText: `${ majorCount } ${ config.majorLabel || 'Full' } / ${ minorCount } ${ config.minorLabel || 'Half' }`,
                majorValue: numericVal > 0 ? `x${ majorCount }` : '--',
                minorValue: numericVal > 0 ? `x${ minorCount }` : '--',
                majorLabel: config.majorLabel || 'Full',
                minorLabel: config.minorLabel || 'Half',
            };
        }
    }
};

export const normalizeFieldType = ( type ) => {
    return type || 'text';
};