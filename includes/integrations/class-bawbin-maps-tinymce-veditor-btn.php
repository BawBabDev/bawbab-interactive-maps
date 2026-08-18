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
        add_action( 'admin_init', array( __CLASS__, 'bawbin_maps_setup_tinymce_editor' ) );
        add_action( 'admin_head', array( __CLASS__, 'bawbin_maps_tinymce_button_styles' ) );
    }

    public static function bawbin_maps_setup_tinymce_editor() {
        if ( ! current_user_can( 'edit_posts' ) && ! current_user_can( 'edit_pages' ) ) {
            return;
        }
        if ( get_user_option( 'rich_editing' ) === 'true' ) {
            add_filter( 'mce_external_plugins', array( __CLASS__, 'bawbin_maps_add_tinymce_plugin' ) );
            add_filter( 'mce_buttons', array( __CLASS__, 'bawbin_maps_register_tinymce_buttons' ) );
        }
    }

    public static function bawbin_maps_add_tinymce_plugin( $plugin_array ) {
        // Step up 2 levels from /includes/integrations/ to the plugin root directory
        $root_dir_path = dirname( __DIR__, 2 ) . '/';
        $root_dir_url  = plugin_dir_url( dirname( __DIR__, 2 ) . '/bawbab-interactive-maps.php' );
        
        $js_path = $root_dir_path . 'assets/bawbin-maps-tinymce-buttons.js';
        
        if ( file_exists( $js_path ) ) {
            $plugin_array['map_buttons'] = $root_dir_url . 'assets/bawbin-maps-tinymce-buttons.js';
        }
        return $plugin_array;
    }

    public static function bawbin_maps_register_tinymce_buttons( $buttons ) {
        array_push( $buttons, 'insert_map', 'map_visibility' );
        return $buttons;
    }

    public static function bawbin_maps_tinymce_button_styles( $hook ) {
        // Only load on post/page editing screens to keep the dashboard lightweight
        if ( 'post.php' !== $hook && 'post-new.php' !== $hook ) {
            return;
        }

        // Get the plugin base directory URL (stepping up two levels from /includes/integrations/)
        $root_dir_url  = plugin_dir_url( dirname( __DIR__, 2 ) . '/bawbab-interactive-maps.php' );
        $css_file_url  = $root_dir_url . 'assets/bawbin-maps-tinymce-btnstyles.css';

        // Enqueue the external stylesheet safely
        wp_enqueue_style('bawbin-maps-tinymce-btnstyles', $css_file_url,  array( 'dashicons' ), '1.0.0');
    }
}

// Activate TinyMCE hooks inside WordPress immediately
 BAWBIN_Maps_TinyMCE_Veditor_Button::init();