import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { useCallback } from '@wordpress/element';

export const useNotify = () => {
	const { createNotice } = useDispatch( noticesStore );

	const notify = useCallback(
		( type, message, options = {} ) => {
			createNotice(
				type, // 'success', 'error', 'info', or 'warning'
				message,
				{
					isDismissible: true,
					type: 'default', // Change to 'snackbar' for small popups
					...options,
				}
			);
		},
		[ createNotice ]
	);

	return { notify };
};
