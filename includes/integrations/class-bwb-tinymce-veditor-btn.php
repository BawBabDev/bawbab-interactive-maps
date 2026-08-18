<?php
/**
 * Isolated Class Manager for TinyMCE Layout Customizations
 * File location: /includes/integrations/class-bwb-tinymce-veditor-btn.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class BWB_TinyMCE_Veditor_Button {

    public static function init() {
        add_action( 'admin_init', array( __CLASS__, 'setup_tinymce_editor' ) );
        add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_tinymce_button_styles' ) );
    }

    public static function setup_tinymce_editor() {
        if ( ! current_user_can( 'edit_posts' ) && ! current_user_can( 'edit_pages' ) ) {
            return;
        }
        if ( get_user_option( 'rich_editing' ) === 'true' ) {
            add_filter( 'mce_external_plugins', array( __CLASS__, 'add_tinymce_plugin' ) );
            add_filter( 'mce_buttons', array( __CLASS__, 'register_tinymce_buttons' ) );
        }
    }

    public static function add_tinymce_plugin( $plugin_array ) {
        // Step up 2 levels from /includes/integrations/ to the plugin root directory
        $root_dir_path = dirname( __DIR__, 2 ) . '/';
        $root_dir_url  = plugin_dir_url( dirname( __DIR__, 2 ) . '/bawbab-interactive-maps.php' );
        
        $js_path = $root_dir_path . 'assets/tinymce-buttons.js';
        
        if ( file_exists( $js_path ) ) {
            $plugin_array['map_buttons'] = $root_dir_url . 'assets/tinymce-buttons.js';
        }
        return $plugin_array;
    }

    public static function register_tinymce_buttons( $buttons ) {
        array_push( $buttons, 'insert_map', 'map_visibility' );
        return $buttons;
    }

    public static function enqueue_tinymce_button_styles( $hook ) {
        // Only load on post and page editing screens
        if ( 'post.php' !== $hook && 'post-new.php' !== $hook ) {
            return;
        }

        // 1. Ensure WordPress built-in Dashicons font stylesheet is enqueued
        wp_enqueue_style( 'dashicons' );

        // 2. Attach inline custom TinyMCE button styles safely to the dashicons handle
        $custom_css = "
            .mce-btn .mce-ico.mce-i-dashicons-location-alt,
            .mce-btn .mce-ico.mce-i-dashicons-visibility {
                font-family: dashicons !important; 
                font-style: normal !important; 
                font-weight: 400 !important; 
                font-size: 18px !important; 
                line-height: 1 !important; 
                vertical-align: middle !important; 
                -webkit-font-smoothing: antialiased;
            }
            .mce-btn .mce-ico.mce-i-dashicons-location-alt:before { content: '\\f231' !important; }
            .mce-btn .mce-ico.mce-i-dashicons-visibility:before { content: '\\f177' !important; }
            .mce-menubtn button span.mce-txt, 
            .mce-menubtn button i.mce-ico { vertical-align: middle !important; display: inline-block !important; }
            .mce-menubtn i.mce-caret { display: inline-block !important; vertical-align: middle !important; margin-top: -2px !important; margin-left: 4px !important; border-top-color: #50575e !important; }
        ";

        wp_add_inline_style( 'dashicons', $custom_css );
    }
}

// Activate TinyMCE hooks inside WordPress immediately
BWB_TinyMCE_Veditor_Button::init();