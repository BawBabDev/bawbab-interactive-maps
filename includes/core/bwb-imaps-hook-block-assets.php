<?php
/**
 * Frontend Public Assets Loader Hook
 * File location: /includes/bwb-imaps-block-assets.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

add_action( 'init', function() {
    // Move up two levels out of /core/ and /includes/ into the root plugin directory by passing '2' to dirname()
    $plugin_root_dir = dirname( plugin_dir_path( __FILE__ ), 2 ) . '/';
    $block_build_dir = $plugin_root_dir . 'build/bawbab-interactive-maps-block';

    // Verify block.json exists, then let WordPress automatically handle styles, scripts, and versions
    if ( file_exists( $block_build_dir . '/block.json' ) ) {
        register_block_type( $block_build_dir );
    }
});
