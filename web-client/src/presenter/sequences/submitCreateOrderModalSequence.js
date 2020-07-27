import { clearAlertsAction } from '../actions/clearAlertsAction';
import { clearModalAction } from '../actions/clearModalAction';
import { navigateToCreateOrderAction } from '../actions/CourtIssuedOrder/navigateToCreateOrderAction';
import { setAlertErrorAction } from '../actions/setAlertErrorAction';
import { setCasePropFromStateAction } from '../actions/setCasePropFromStateAction';
import { setModalFormValuesAsPropsAction } from '../actions/setModalFormValuesAsPropsAction';
import { setValidationErrorsAction } from '../actions/setValidationErrorsAction';
import { startShowValidationAction } from '../actions/startShowValidationAction';
import { validateOrderWithoutBodyAction } from '../actions/CourtIssuedOrder/validateOrderWithoutBodyAction';

export const submitCreateOrderModalSequence = [
  clearAlertsAction,
  startShowValidationAction,
  validateOrderWithoutBodyAction,
  {
    error: [setAlertErrorAction, setValidationErrorsAction],
    success: [
      setModalFormValuesAsPropsAction,
      clearModalAction,
      setCasePropFromStateAction,
      navigateToCreateOrderAction,
    ],
  },
];
