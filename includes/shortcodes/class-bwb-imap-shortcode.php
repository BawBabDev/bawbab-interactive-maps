<?php
/**
 * Isolated Class Manager for Plugin Shortcodes
 * File location: /includes/class-bwb-imap-shortcode.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

class BWB_Imap_Shortcode {

    /**
     * Initializes and binds shortcode hooks to WordPress core
     */
    public static function init() {
        add_shortcode( 'map', array( __CLASS__, 'render_map_shortcode' ) );
        add_shortcode( 'interactive_map', array( __CLASS__, 'render_map_shortcode' ) );
        add_shortcode( 'map_include', array( __CLASS__, 'map_include_shortcode' ) );
        add_shortcode( 'map_exclude', array( __CLASS__, 'map_exclude_shortcode' ) );
    }

    /**
     * Renders the primary interactive map shortcode canvas wrapper
     */
    public static function render_map_shortcode( $atts ) {
        $atts = shortcode_atts( array(
            'height' => '650px',
        ), $atts, 'map' );

        wp_enqueue_script( 'map-frontend-view' );
        wp_enqueue_style( 'map-styles' );

        return sprintf(
            '<div id="interactive-map-root" class="map-container map-shortcode-container" style="width:100%%; height:%s; position:relative; z-index:1; isolation:isolate;" data-height="%s" data-zoom="16" data-tilt="0" data-map-type="hybrid"></div>',
            esc_attr( $atts['height'] ),
            esc_attr( $atts['height'] )
        );
    }

    /**
     * Handles map inclusions container markup block wrapper
     */
    public static function map_include_shortcode( $atts, $content = null ) {
        return '<div class="map-include map-sidebar-content">' . do_shortcode( $content ) . '</div>';
    }

    /**
     * Handles map exclusions container markup block wrapper
     */
    public static function map_exclude_shortcode( $atts, $content = null ) {
        return '<div class="map-exclude">' . do_shortcode( $content ) . '</div>';
    }
}

//Activate the shortcode hooks inside WordPress immediately this file is loaded
BWB_Imap_Shortcode::init();
