import { getShowNotServedForDocument } from './getShowNotServedForDocument';
import { state } from 'cerebral';

export const documentViewerHelper = (get, applicationContext) => {
  const {
    COURT_ISSUED_EVENT_CODES,
    PROPOSED_STIPULATED_DECISION_EVENT_CODE,
    STIPULATED_DECISION_EVENT_CODE,
    UNSERVABLE_EVENT_CODES,
  } = applicationContext.getConstants();
  const caseDetail = get(state.caseDetail);

  const formattedCaseDetail = applicationContext
    .getUtilities()
    .getFormattedCaseDetail({
      applicationContext,
      caseDetail,
    });

  const permissions = get(state.permissions);

  const viewerDocumentToDisplay = get(state.viewerDocumentToDisplay);

  const formattedDocumentToDisplay =
    viewerDocumentToDisplay &&
    formattedCaseDetail.formattedDocketEntries.find(
      entry =>
        entry && entry.docketEntryId === viewerDocumentToDisplay.docketEntryId,
    );
  if (!formattedDocumentToDisplay) {
    return {};
  }

  const filedLabel = formattedDocumentToDisplay.filedBy
    ? `Filed ${formattedDocumentToDisplay.createdAtFormatted} by ${formattedDocumentToDisplay.filedBy}`
    : '';

  const { servedAtFormatted } = formattedDocumentToDisplay;
  const servedLabel = servedAtFormatted ? `Served ${servedAtFormatted}` : '';

  const showNotServed = getShowNotServedForDocument({
    UNSERVABLE_EVENT_CODES,
    caseDetail,
    docketEntryId: formattedDocumentToDisplay.docketEntryId,
    draftDocuments: formattedCaseDetail.draftDocuments,
  });

  const isCourtIssuedDocument = COURT_ISSUED_EVENT_CODES.map(
    ({ eventCode }) => eventCode,
  ).includes(formattedDocumentToDisplay.eventCode);

  const showServeCourtIssuedDocumentButton =
    showNotServed && isCourtIssuedDocument && permissions.SERVE_DOCUMENT;

  const showServePaperFiledDocumentButton =
    showNotServed &&
    !isCourtIssuedDocument &&
    !formattedDocumentToDisplay.isPetition &&
    permissions.SERVE_DOCUMENT;

  const showServePetitionButton =
    showNotServed &&
    formattedDocumentToDisplay.isPetition &&
    permissions.SERVE_PETITION;

  const showSignStipulatedDecisionButton =
    formattedDocumentToDisplay.eventCode ===
      PROPOSED_STIPULATED_DECISION_EVENT_CODE &&
    applicationContext.getUtilities().isServed(formattedDocumentToDisplay) &&
    !formattedCaseDetail.docketEntries.find(
      d => d.eventCode === STIPULATED_DECISION_EVENT_CODE && !d.archived,
    );

  let showStricken;

  if (viewerDocumentToDisplay.isStricken !== undefined) {
    showStricken = viewerDocumentToDisplay.isStricken;
  } else {
    const entry = formattedCaseDetail.formattedDocketEntries.find(
      docketEntry =>
        docketEntry.docketEntryId === viewerDocumentToDisplay.docketEntryId,
    );
    showStricken = entry.isStricken;
  }

  const showCompleteQcButton =
    permissions.EDIT_DOCKET_ENTRY && formattedDocumentToDisplay.qcNeeded;

  return {
    completeQcLink: `/case-detail/${caseDetail.docketNumber}/documents/${viewerDocumentToDisplay.docketEntryId}/edit`,
    description: formattedDocumentToDisplay.descriptionDisplay,
    documentViewerLink: `/case-detail/${caseDetail.docketNumber}/document-view?docketEntryId=${viewerDocumentToDisplay.docketEntryId}`,
    filedLabel,
    reviewAndServePetitionLink: `/case-detail/${caseDetail.docketNumber}/petition-qc/document-view/${viewerDocumentToDisplay.docketEntryId}`,
    servedLabel,
    showCompleteQcButton,
    showNotServed,
    showSealedInBlackstone: formattedDocumentToDisplay.isLegacySealed,
    showServeCourtIssuedDocumentButton,
    showServePaperFiledDocumentButton,
    showServePetitionButton,
    showSignStipulatedDecisionButton,
    showStricken,
    signStipulatedDecisionLink: `/case-detail/${caseDetail.docketNumber}/edit-order/${viewerDocumentToDisplay.docketEntryId}/sign`,
  };
};
