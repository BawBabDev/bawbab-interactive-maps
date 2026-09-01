<?php
/**
 * core plugin verification status 
 * File location: /includes/integrations/class-bawbin-maps-addons-helper.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$plugin_root_dir = dirname( plugin_dir_path( __FILE__ ), 2 ) . '/';

define( 'BAWBIN_MAPS_VERSION', '0.1.0' );
define( 'BAWBIN_MAPS_PATH', $plugin_root_dir );

//Public helper function file for addons to verify core status
function bawbin_maps_is_core_active() {
    return defined( 'BAWBIN_MAPS_VERSION' );
}
