<?php
/**
 * Isolated Class Manager for TinyMCE Layout Customizations
 * File location: /includes/integrations/class-bawbin-maps-tinymce-veditor-btn.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class BAWBIN_Maps_TinyMCE_Veditor_Button {

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

        $root_dir_path = dirname( __DIR__, 2 ) . '/';
        $root_dir_url  = plugin_dir_url( dirname( __DIR__, 2 ) . '/bawbab-interactive-maps.php' );
        $css_path      = $root_dir_path . 'assets/tinymce-buttons.css';

        if ( file_exists( $css_path ) ) {
            wp_enqueue_style(
                'bawbin-maps-tinymce-buttons',
                $root_dir_url . 'assets/tinymce-buttons.css',
                array( 'dashicons' ), // Explicitly depends on WordPress Dashicons
                filemtime( $css_path )
            );
        }
    }
}

// Activate TinyMCE hooks inside WordPress immediately
BAWBIN_Maps_TinyMCE_Veditor_Button::init();