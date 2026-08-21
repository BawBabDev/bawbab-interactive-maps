( function () {
    tinymce.PluginManager.add( 'map_buttons', function ( editor ) {
        // 1. Map Insert Button (Location Pin)
        editor.addButton( 'insert_map', {
            title: 'Insert Map',
            icon: 'dashicons-location-alt',
            onclick: function () {
                editor.insertContent( '[bawbin_maps_interactive_map height="650px"]' );
            },
        } );

        // 2. Map Visibility Dropdown Menu
        editor.addButton( 'map_visibility', {
            type: 'menubutton',
            text: 'Map Visibility',
            icon: 'dashicons-visibility',
            menu: [
                {
                    text: 'Include Section on Map',
                    onclick: function () {
                        var selectedText = editor.selection.getContent();
                        if ( selectedText ) {
                            editor.selection.setContent(
                                '[bawbin_maps_include]' +
                                    selectedText +
                                    '[/bawbin_maps_include]'
                            );
                        } else {
                            editor.insertContent(
                                '[bawbin_maps_include]Your content here...[/bawbin_maps_include]'
                            );
                        }
                    },
                },
                {
                    text: 'Exclude Section from Map',
                    onclick: function () {
                        var selectedText = editor.selection.getContent();
                        if ( selectedText ) {
                            editor.selection.setContent(
                                '[bawbin_maps_exclude]' +
                                    selectedText +
                                    '[/bawbin_maps_exclude]'
                            );
                        } else {
                            editor.insertContent(
                                '[bawbin_maps_exclude]Content hidden from map...[/bawbin_maps_exclude]'
                            );
                        }
                    },
                },
            ],
        } );
    } );
} )();