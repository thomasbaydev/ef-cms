const {
  aggregatePartiesForService,
} = require('../../utilities/aggregatePartiesForService');
const {
  isAuthorized,
  ROLE_PERMISSIONS,
} = require('../../../authorization/authorizationClientService');
const { capitalize, pick } = require('lodash');
const { Case } = require('../../entities/cases/Case');
const { DOCKET_SECTION } = require('../../entities/WorkQueue');
const { DocketRecord } = require('../../entities/DocketRecord');
const { Document } = require('../../entities/Document');
const { formatDateString } = require('../../utilities/DateHandler');
const { Message } = require('../../entities/Message');
const { UnauthorizedError } = require('../../../errors/errors');
const { WorkItem } = require('../../entities/WorkItem');

exports.fileExternalDocumentForConsolidatedInteractor = async ({
  applicationContext,
  caseIdsForFiling,
  documentIds,
  documentMetadata,
  leadCaseId,
  //filingPartyNames? filingPartyMap?,
}) => {
  const authorizedUser = applicationContext.getCurrentUser();

  if (!isAuthorized(authorizedUser, ROLE_PERMISSIONS.FILE_EXTERNAL_DOCUMENT)) {
    throw new UnauthorizedError('Unauthorized');
  }

  const user = await applicationContext
    .getPersistenceGateway()
    .getUserById({ applicationContext, userId: authorizedUser.userId });

  const consolidatedCases = await applicationContext
    .getPersistenceGateway()
    .getCasesByLeadCaseId({
      applicationContext,
      leadCaseId,
    });

  // TODO: Return error if lead case not found?

  const casesForDocumentFiling = [];
  const caseIdsForDocumentFiling = [];

  const consolidatedCaseEntities = consolidatedCases.map(consolidatedCase => {
    const { caseId } = consolidatedCase;
    const caseEntity = new Case(consolidatedCase, { applicationContext });

    if (caseIdsForFiling.includes(consolidatedCase.caseId)) {
      // this serves the purpose of offering two different
      // look-ups to be used further down while minimizing
      // iterations over the case array
      caseIdsForDocumentFiling.push(caseId);
      casesForDocumentFiling.push(caseEntity);
    }

    return caseEntity;
  });

  const caseWithLowestDocketNumber = Case.sortByDocketNumber(
    casesForDocumentFiling,
  ).shift();

  const {
    secondaryDocument,
    secondarySupportingDocuments,
    supportingDocuments,
    ...primaryDocumentMetadata
  } = documentMetadata;

  const baseMetadata = pick(primaryDocumentMetadata, [
    'partyPrimary',
    'partySecondary',
    'partyRespondent',
    'practitioner',
    'caseId',
    'docketNumber',
  ]);

  if (secondaryDocument) {
    secondaryDocument.lodged = true;
    secondaryDocument.eventCode = 'MISL';
  }
  if (secondarySupportingDocuments) {
    secondarySupportingDocuments.forEach(item => {
      item.lodged = true;
      item.eventCode = 'MISL';
    });
  }

  const documentsToAdd = [
    [documentIds.shift(), primaryDocumentMetadata, 'primaryDocument'],
  ];

  if (supportingDocuments) {
    for (let i = 0; i < supportingDocuments.length; i++) {
      documentsToAdd.push([
        documentIds.shift(),
        supportingDocuments[i],
        'primarySupportingDocument',
      ]);
    }
  }

  documentsToAdd.push([
    documentIds.shift(),
    secondaryDocument,
    'secondaryDocument',
  ]);

  if (secondarySupportingDocuments) {
    for (let i = 0; i < secondarySupportingDocuments.length; i++) {
      documentsToAdd.push([
        documentIds.shift(),
        secondarySupportingDocuments[i],
        'supportingDocument',
      ]);
    }
  }

  const saveCasesMap = {};
  const saveWorkItems = [];
  const sendEmails = [];

  documentsToAdd.forEach(([documentId, metadata, relationship]) => {
    if (documentId && metadata) {
      // TODO: Double check what is auto-generated here,
      // as this may not be entirely necessary
      const rawDocument = new Document(
        {
          ...baseMetadata,
          ...metadata,
          documentId,
          documentType: metadata.documentType,
          relationship,
          userId: user.userId,
        },
        { applicationContext },
      ).toRawObject();

      consolidatedCaseEntities.forEach(caseEntity => {
        const isFilingDocumentForCase = caseIdsForDocumentFiling.includes(
          caseEntity.caseId,
        );

        const documentEntity = new Document(
          {
            ...rawDocument,
            ...caseEntity.getCaseContacts({
              contactPrimary: true,
              contactSecondary: true,
            }),
          },
          {
            applicationContext,
          },
        );

        if (isFilingDocumentForCase) {
          const isCaseForWorkItem =
            caseEntity.caseId === caseWithLowestDocketNumber.caseId;

          const servedParties = aggregatePartiesForService(caseEntity);

          if (isCaseForWorkItem) {
            // The case with the lowest docket number
            // in the filing gets the work item
            const workItem = new WorkItem(
              {
                assigneeId: null,
                assigneeName: null,
                caseId: caseEntity.caseId,
                caseStatus: caseEntity.status,
                caseTitle: Case.getCaseCaptionNames(
                  Case.getCaseCaption(caseEntity),
                ),
                docketNumber: caseEntity.docketNumber,
                docketNumberSuffix: caseEntity.docketNumberSuffix,
                document: {
                  ...documentEntity.toRawObject(),
                  createdAt: documentEntity.createdAt,
                },
                isQC: true,
                section: DOCKET_SECTION,
                sentBy: user.userId,
              },
              { applicationContext },
            );

            const message = new Message(
              {
                from: user.name,
                fromUserId: user.userId,
                message: `${documentEntity.documentType} filed by ${capitalize(
                  user.role,
                )} is ready for review.`,
              },
              { applicationContext },
            );

            workItem.addMessage(message);
            documentEntity.addWorkItem(workItem);

            if (metadata.isPaper) {
              workItem.setAsCompleted({
                message: 'completed',
                user,
              });

              workItem.assignToUser({
                assigneeId: user.userId,
                assigneeName: user.name,
                section: user.section,
                sentBy: user.name,
                sentBySection: user.section,
                sentByUserId: user.userId,
              });
            }

            saveWorkItems.push(
              applicationContext
                .getPersistenceGateway()
                .saveWorkItemForNonPaper({
                  applicationContext,
                  workItem: workItem.validate().toRawObject(),
                }),
            );
          }

          caseEntity.addDocumentWithoutDocketRecord(documentEntity);

          if (documentEntity.isAutoServed()) {
            documentEntity.setAsServed(servedParties.all);

            const destinations = servedParties.electronic.map(party => ({
              email: party.email,
              templateData: {
                caseCaption: caseEntity.caseCaption,
                docketNumber: caseEntity.docketNumber,
                documentName: documentEntity.documentTitle,
                loginUrl: `https://ui-${process.env.STAGE}.${process.env.EFCMS_DOMAIN}`,
                name: party.name,
                serviceDate: formatDateString(
                  documentEntity.servedAt,
                  'MMDDYYYY',
                ),
                serviceTime: formatDateString(documentEntity.servedAt, 'TIME'),
              },
            }));

            if (destinations.length > 0) {
              sendEmails.push(
                applicationContext.getDispatchers().sendBulkTemplatedEmail({
                  applicationContext,
                  defaultTemplateData: {
                    caseCaption: 'undefined',
                    docketNumber: 'undefined',
                    documentName: 'undefined',
                    loginUrl: 'undefined',
                    name: 'undefined',
                    serviceDate: 'undefined',
                    serviceTime: 'undefined',
                  },
                  destinations,
                  templateName: process.env.EMAIL_SERVED_TEMPLATE,
                }),
              );
            }
          }
        }

        const docketRecordEntity = new DocketRecord({
          description: metadata.documentTitle,
          documentId: documentEntity.documentId,
          filingDate: documentEntity.receivedAt,
        });

        caseEntity.addDocketRecord(docketRecordEntity);

        saveCasesMap[
          caseEntity.caseId
        ] = applicationContext.getPersistenceGateway().updateCase({
          applicationContext,
          caseToUpdate: caseEntity.validate().toRawObject(),
        });
      }); // consolidatedCases
    }
  }); // documentsToAdd
  const saveCases = Object.keys(saveCasesMap).map(
    caseId => saveCasesMap[caseId],
  );

  const savedCases = await Promise.all(saveCases);
  await Promise.all(saveWorkItems);
  await Promise.all(sendEmails);

  return savedCases;
};
