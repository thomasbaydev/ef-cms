import { canRequestAccessAction } from '../actions/CaseAssociationRequest/canRequestAccessAction';
import { clearFormAction } from '../actions/clearFormAction';
import { clearScreenMetadataAction } from '../actions/clearScreenMetadataAction';
import { getCaseAction } from '../actions/getCaseAction';
import { getCaseAssociationAction } from '../actions/getCaseAssociationAction';
import { isLoggedInAction } from '../actions/isLoggedInAction';
import { navigateToCaseDetailAction } from '../actions/navigateToCaseDetailAction';
import { redirectToCognitoAction } from '../actions/redirectToCognitoAction';
import { runPathForUserRoleAction } from '../actions/runPathForUserRoleAction';
import { setCaseAction } from '../actions/setCaseAction';
import { setCaseAssociationAction } from '../actions/setCaseAssociationAction';
import { setCurrentPageAction } from '../actions/setCurrentPageAction';
import { setDefaultFileDocumentFormValuesAction } from '../actions/FileDocument/setDefaultFileDocumentFormValuesAction';
import { setFormPartyTrueAction } from '../actions/AdvancedSearch/setFormPartyTrueAction';
import { setRequestAccessWizardStepActionGenerator } from '../actions/setRequestAccessWizardStepActionGenerator';
import { stopShowValidationAction } from '../actions/stopShowValidationAction';

const gotoRequestAccess = [
  setCurrentPageAction('Interstitial'),
  stopShowValidationAction,
  clearFormAction,
  clearScreenMetadataAction,
  getCaseAction,
  setCaseAction,
  getCaseAssociationAction,
  setCaseAssociationAction,
  canRequestAccessAction,
  {
    proceed: [
      setDefaultFileDocumentFormValuesAction,
      runPathForUserRoleAction,
      {
        irsPractitioner: [
          setFormPartyTrueAction('partyIrsPractitioner'),
          setRequestAccessWizardStepActionGenerator('RequestAccess'),
          setCurrentPageAction('RequestAccessWizard'),
        ],
        privatePractitioner: [
          setFormPartyTrueAction('partyPrivatePractitioner'),
          setRequestAccessWizardStepActionGenerator('RequestAccess'),
          setCurrentPageAction('RequestAccessWizard'),
        ],
      },
    ],
    unauthorized: [navigateToCaseDetailAction],
  },
];

export const gotoRequestAccessSequence = [
  isLoggedInAction,
  {
    isLoggedIn: gotoRequestAccess,
    unauthorized: [redirectToCognitoAction],
  },
];
