<?php
/**
 * Isolated Class Manager for Plugin Shortcodes
 * File location: /includes/shortcodes/class-bwb-imap-shortcode.php
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
        add_shortcode( 'bawbab_map', array( __CLASS__, 'render_map_shortcode' ) );
        add_shortcode( 'map_include', array( __CLASS__, 'map_include_shortcode' ) );
        add_shortcode( 'map_exclude', array( __CLASS__, 'map_exclude_shortcode' ) );

        add_action( 'wp_enqueue_scripts', array( __CLASS__, 'register_frontend_assets' ) );
    }

    /**
     * Registers frontend script handles so wp_enqueue_script() can resolve them
     */
    public static function register_frontend_assets() {
        $root_dir_path = dirname( __DIR__, 2 ) . '/';
        $root_dir_url  = plugin_dir_url( dirname( __DIR__, 2 ) . '/bawbab-interactive-maps.php' );

        $asset_path = $root_dir_path . 'build/bawbab-interactive-maps-block/view.asset.php';
        
        if ( file_exists( $asset_path ) ) {
            $assets       = include $asset_path;
            $dependencies = $assets['dependencies'] ?? array( 'wp-element' );
            $version      = $assets['version'] ?? '1.0.0';
        } else {
            $dependencies = array( 'wp-element' );
            $version      = '1.0.0';
        }

        // Register main frontend React view bundle
        wp_register_script(
            'bwb-map-frontend-view',
            $root_dir_url . 'build/bawbab-interactive-maps-block/view.js',
            $dependencies,
            $version,
            true
        );

        // Register stylesheet
        $possible_css_paths = array(
            'build/bawbab-interactive-maps-block/style-index.css',
            'build/bawbab-interactive-maps-block/style.css',
            'build/style-index.css',
        );

        foreach ( $possible_css_paths as $css_rel ) {
            if ( file_exists( $root_dir_path . $css_rel ) ) {
                wp_register_style(
                    'bwb-map-styles',
                    $root_dir_url . $css_rel,
                    array(),
                    $version
                );
                break;
            }
        }
    }

    /**
     * Renders the primary interactive map shortcode canvas wrapper
     */
    public static function render_map_shortcode( $atts ) {
        $atts = shortcode_atts( array(
            'height' => '650px',
        ), $atts, 'map' );

        // Ensure scripts and styles are enqueued
        wp_enqueue_script( 'bwb-map-frontend-view' );
        wp_enqueue_style( 'bwb-map-styles' );

        // Inject global map settings into window scope for the frontend viewer
        $map_settings = get_option( 'bwb_imaps_options_data', get_option( 'foulkeways_map_data', array() ) );
        if ( ! empty( $map_settings ) ) {
            wp_add_inline_script(
                'bwb-map-frontend-view',
                'window.bwbimapsSettings = ' . wp_json_encode( $map_settings ) . '; window.foulkewaysSettings = ' . wp_json_encode( $map_settings ) . ';',
                'before'
            );
        }

        return sprintf(
            '<div id="interactive-map-root" class="map-container map-shortcode-container bawbab-imaps-container bwb-interactive-map-root" style="width:100%%; height:%s; position:relative; z-index:1; isolation:isolate;" data-height="%s" data-zoom="16" data-tilt="0" data-map-type="hybrid"></div>',
            esc_attr( $atts['height'] ),
            esc_attr( $atts['height'] )
        );
    }

    /**
     * Handles map inclusions container markup block wrapper
     */
    public static function map_include_shortcode( $atts, $content = null ) {
        return '<div class="map-include map-sidebar-content">' . wp_kses_post( do_shortcode( $content ) ) . '</div>';
    }

    /**
     * Handles map exclusions container markup block wrapper
     */
    public static function map_exclude_shortcode( $atts, $content = null ) {
        return '<div class="map-exclude">' . wp_kses_post( do_shortcode( $content ) ) . '</div>';
    }
}

// Activate shortcode hooks
BWB_Imap_Shortcode::init();