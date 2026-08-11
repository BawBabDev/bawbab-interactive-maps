<?php
/**
 * Localization framework setup for JS variables.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

add_action( 'wp_enqueue_scripts', function() {
    $script_handle = 'bawbab-interactive-maps';
    $map_settings  = get_option( 'bawbab_imaps_options_data' );
    
    if ( $map_settings ) {
        wp_add_inline_script(
            $script_handle,
            'window.bwbimapsSettings = ' . wp_json_encode( $map_settings ) . ';',
            'before'// Injects it right before your script executes
        );
    }
});