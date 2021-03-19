const {
  aggregatePartiesForService,
} = require('../utilities/aggregatePartiesForService');
const {
  DOCKET_SECTION,
  DOCUMENT_PROCESSING_STATUS_OPTIONS,
} = require('../entities/EntityConstants');
const { addCoverToPdf } = require('./addCoversheetInteractor');
const { Case } = require('../entities/cases/Case');
const { DocketEntry } = require('../entities/DocketEntry');
const { getCaseCaptionMeta } = require('../utilities/getCaseCaptionMeta');
const { isEmpty } = require('lodash');
const { NotFoundError, UnauthorizedError } = require('../../errors/errors');
const { WorkItem } = require('../entities/WorkItem');

/**
 * updateSecondaryContactInteractor
 *
 * @param {object} applicationContext the application context
 * @param {object} providers the providers object
 * @param {string} providers.docketNumber the docket number of the case to update the secondary contact
 * @param {object} providers.contactInfo the contact info to update on the case
 * @returns {object} the updated case
 */
exports.updateSecondaryContactInteractor = async (
  applicationContext,
  { contactInfo, docketNumber },
) => {
  const user = applicationContext.getCurrentUser();

  const editableFields = {
    address1: contactInfo.address1,
    address2: contactInfo.address2,
    address3: contactInfo.address3,
    city: contactInfo.city,
    country: contactInfo.country,
    countryType: contactInfo.countryType,
    inCareOf: contactInfo.inCareOf,
    phone: contactInfo.phone,
    postalCode: contactInfo.postalCode,
    state: contactInfo.state,
  };

  const caseToUpdate = await applicationContext
    .getPersistenceGateway()
    .getCaseByDocketNumber({
      applicationContext,
      docketNumber,
    });

  if (!caseToUpdate) {
    throw new NotFoundError(`Case ${docketNumber} was not found.`);
  }

  const caseEntity = new Case(
    {
      ...caseToUpdate,
      contactSecondary: { ...caseToUpdate.contactSecondary, ...editableFields },
    },
    { applicationContext },
  );

  const userIsAssociated = caseEntity.isAssociatedUser({
    user,
  });

  if (!userIsAssociated) {
    throw new UnauthorizedError('Unauthorized for update case contact');
  }

  const changeOfAddressDocumentTypeToGenerate = applicationContext
    .getUtilities()
    .getDocumentTypeForAddressChange({
      newData: editableFields,
      oldData: caseToUpdate.contactSecondary,
    });

  if (
    !caseEntity.contactSecondary.isAddressSealed &&
    changeOfAddressDocumentTypeToGenerate
  ) {
    const { caseCaptionExtension, caseTitle } = getCaseCaptionMeta(caseEntity);

    const changeOfAddressPdf = await applicationContext
      .getDocumentGenerators()
      .changeOfAddress({
        applicationContext,
        content: {
          caseCaptionExtension,
          caseTitle,
          docketNumber: caseEntity.docketNumber,
          docketNumberWithSuffix: caseEntity.docketNumberWithSuffix,
          documentTitle: changeOfAddressDocumentTypeToGenerate.title,
          name: contactInfo.name,
          newData: editableFields,
          oldData: caseToUpdate.contactSecondary,
        },
      });

    const newDocketEntryId = applicationContext.getUniqueId();

    const changeOfAddressDocketEntry = new DocketEntry(
      {
        addToCoversheet: true,
        additionalInfo: `for ${caseToUpdate.contactSecondary.name}`,
        docketEntryId: newDocketEntryId,
        docketNumber: caseEntity.docketNumber,
        documentTitle: changeOfAddressDocumentTypeToGenerate.title,
        documentType: changeOfAddressDocumentTypeToGenerate.title,
        eventCode: changeOfAddressDocumentTypeToGenerate.eventCode,
        isAutoGenerated: true,
        isFileAttached: true,
        isOnDocketRecord: true,
        partySecondary: true,
        processingStatus: DOCUMENT_PROCESSING_STATUS_OPTIONS.COMPLETE,
        userId: user.userId,
        ...caseEntity.getCaseContacts({
          contactSecondary: true,
        }),
      },
      { applicationContext },
    );

    const servedParties = aggregatePartiesForService(caseEntity);

    changeOfAddressDocketEntry.setAsServed(servedParties.all);
    caseEntity.addDocketEntry(changeOfAddressDocketEntry);

    await applicationContext.getUseCaseHelpers().sendServedPartiesEmails({
      applicationContext,
      caseEntity,
      docketEntryId: changeOfAddressDocketEntry.docketEntryId,
      servedParties,
    });

    let privatePractitionersRepresentingSecondaryContact = false;
    for (const privatePractitioner of caseEntity.privatePractitioners) {
      const practitionerRepresentingSecondary = privatePractitioner.getRepresentingSecondary(
        caseEntity,
      );
      if (practitionerRepresentingSecondary) {
        privatePractitionersRepresentingSecondaryContact = true;
        break;
      }
    }

    if (!privatePractitionersRepresentingSecondaryContact) {
      const workItem = new WorkItem(
        {
          assigneeId: null,
          assigneeName: null,
          associatedJudge: caseEntity.associatedJudge,
          caseIsInProgress: caseEntity.inProgress,
          caseStatus: caseEntity.status,
          caseTitle: Case.getCaseTitle(Case.getCaseCaption(caseEntity)),
          docketEntry: {
            ...changeOfAddressDocketEntry.toRawObject(),
            createdAt: changeOfAddressDocketEntry.createdAt,
          },
          docketNumber: caseEntity.docketNumber,
          docketNumberWithSuffix: caseEntity.docketNumberWithSuffix,
          section: DOCKET_SECTION,
          sentBy: user.name,
          sentByUserId: user.userId,
        },
        { applicationContext },
      );

      changeOfAddressDocketEntry.setWorkItem(workItem);

      await applicationContext
        .getPersistenceGateway()
        .saveWorkItemAndAddToSectionInbox({
          applicationContext,
          workItem: workItem.validate().toRawObject(),
        });
    }

    const { pdfData: changeOfAddressPdfWithCover } = await addCoverToPdf({
      applicationContext,
      caseEntity,
      docketEntryEntity: changeOfAddressDocketEntry,
      pdfData: changeOfAddressPdf,
    });

    changeOfAddressDocketEntry.numberOfPages = await applicationContext
      .getUseCaseHelpers()
      .countPagesInDocument({
        applicationContext,
        documentBytes: changeOfAddressPdfWithCover,
      });

    caseEntity.updateDocketEntry(changeOfAddressDocketEntry);

    await applicationContext.getPersistenceGateway().saveDocumentFromLambda({
      applicationContext,
      document: changeOfAddressPdfWithCover,
      key: newDocketEntryId,
    });
  }

  const contactDiff = applicationContext.getUtilities().getAddressPhoneDiff({
    newData: editableFields,
    oldData: caseToUpdate.contactSecondary,
  });

  const shouldUpdateCase =
    !isEmpty(contactDiff) || changeOfAddressDocumentTypeToGenerate;

  if (shouldUpdateCase) {
    await applicationContext.getUseCaseHelpers().updateCaseAndAssociations({
      applicationContext,
      caseToUpdate: caseEntity,
    });
  }

  return caseEntity.toRawObject();
};
