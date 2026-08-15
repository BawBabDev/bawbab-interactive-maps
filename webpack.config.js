const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

module.exports = {
    ...defaultConfig,
    performance: {
        ...defaultConfig.performance,
        hints: 'warning',
        maxAssetSize: 2500000,      // ~2.5 MB (prevents warnings for your ~800 KiB bundles)
        maxEntrypointSize: 2500000, // ~2.5 MB
    },
};