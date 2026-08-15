/**
 * Dual Counter Helper Utilities
 * File location: src/utils/dualCounterHelper.js
 */

/**
 * Formats a dual_counter numeric value into structured major/minor visual representations.
 *
 * @param {number|string} rawValue - Numeric value (e.g. 1.5)
 * @param {Object} config - Configuration options
 * @param {string} [config.mode='split'] - 'split' | 'time' | 'measurement'
 * @param {string} [config.majorLabel='Full'] - Label for whole unit
 * @param {string} [config.minorLabel='Half'] - Label for fractional unit
 * @param {string} [config.majorUnit='hr'] - Unit suffix for time/measurement
 * @param {string} [config.minorUnit='min'] - Sub-unit suffix for time/measurement
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
			const majorCount = Math.floor( numericVal );
			const remainder = numericVal - majorCount;
			const minutes = Math.round( remainder * 60 );
			const hrLabel = config.majorUnit || 'hr';
			const minLabel = config.minorUnit || 'min';

			return {
				displayText: `${ majorCount } ${ hrLabel }${
					minutes > 0 ? ` ${ minutes } ${ minLabel }` : ''
				}`.trim(),
				majorValue: `${ majorCount } ${ hrLabel }`,
				minorValue: `${ minutes } ${ minLabel }`,
				majorLabel: config.majorLabel || 'Hours',
				minorLabel: config.minorLabel || 'Minutes',
			};
		}

		case 'measurement': {
			const majorCount = Math.floor( numericVal );
			const remainder = numericVal - majorCount;
			const inches = Math.round( remainder * 12 );

			return {
				displayText: `${ majorCount }' ${ inches }"`,
				majorValue: `${ majorCount }'`,
				minorValue: `${ inches }"`,
				majorLabel: config.majorLabel || 'Feet',
				minorLabel: config.minorLabel || 'Inches',
			};
		}

		case 'split':
		default: {
			// Integer part = Major items (e.g. 1.5 -> 1 Shower/Full Bath)
			const majorCount = Math.floor( numericVal );
			// Ceiling part = Minor items (e.g. 1.5 -> 2 Sinks/Bathrooms)
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