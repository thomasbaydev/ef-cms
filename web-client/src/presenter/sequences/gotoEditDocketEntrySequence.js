import { clearFormAction } from '../actions/clearFormAction';
import { clearScansAction } from '../actions/clearScansAction';
import { clearScreenMetadataAction } from '../actions/clearScreenMetadataAction';
import { deconstructDatesToFormAction } from '../actions/EditDocketRecord/deconstructDatesToFormAction';
import { getCaseAction } from '../actions/getCaseAction';
import { getShouldMarkReadAction } from '../actions/getShouldMarkReadAction';
import { isLoggedInAction } from '../actions/isLoggedInAction';
import { redirectToCognitoAction } from '../actions/redirectToCognitoAction';
import { setCaseAction } from '../actions/setCaseAction';
import { setCurrentPageAction } from '../actions/setCurrentPageAction';
import { setDocketEntryFormForDocketEditAction } from '../actions/EditDocketRecord/setDocketEntryFormForDocketEditAction';
import { setDocketEntryIdAction } from '../actions/setDocketEntryIdAction';
import { setQCWorkItemIdToMarkAsReadIfNeededAction } from '../actions/EditDocketRecord/setQCWorkItemIdToMarkAsReadIfNeededAction';
import { setTabAction } from '../actions/setTabAction';
import { setWorkItemAsReadAction } from '../actions/setWorkItemAsReadAction';
import { stopShowValidationAction } from '../actions/stopShowValidationAction';
import { updateDocketEntryWizardDataAction } from '../actions/DocketEntry/updateDocketEntryWizardDataAction';

export const gotoEditDocketEntry = [
  setCurrentPageAction('Interstitial'),
  stopShowValidationAction,
  clearScansAction,
  clearFormAction,
  clearScreenMetadataAction,
  getCaseAction,
  setCaseAction,
  setDocketEntryFormForDocketEditAction,
  deconstructDatesToFormAction,
  updateDocketEntryWizardDataAction,
  setDocketEntryIdAction,
  setQCWorkItemIdToMarkAsReadIfNeededAction,
  setTabAction('Document Info'),
  setCurrentPageAction('EditDocketEntry'),
  getShouldMarkReadAction,
  {
    markRead: [setWorkItemAsReadAction],
    noAction: [],
  },
];

export const gotoEditDocketEntrySequence = [
  isLoggedInAction,
  {
    isLoggedIn: gotoEditDocketEntry,
    unauthorized: [redirectToCognitoAction],
  },
];
