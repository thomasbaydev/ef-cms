const {
  reactTemplateGenerator,
} = require('../../utilities/generateHTMLTemplateForPDF/reactTemplateGenerator');
const { Case } = require('../../entities/cases/Case');
const { CASE_STATUS_TYPES } = require('../../entities/EntityConstants');
const { cloneDeep } = require('lodash');

exports.sendServedPartiesEmails = async ({
  applicationContext,
  caseEntity,
  docketEntryId,
  servedParties,
}) => {
  const { caseCaption, docketNumber, docketNumberWithSuffix } = caseEntity;
  const partiesToServe = cloneDeep(servedParties);

  const docketEntryEntity = caseEntity.getDocketEntryById({ docketEntryId });

  if (docketEntryEntity.index === undefined) {
    throw new Error('Cannot serve a docket entry without an index.');
  }

  const {
    documentTitle,
    documentType,
    eventCode,
    filedBy,
    index: docketEntryNumber,
    servedAt,
  } = docketEntryEntity;

  const currentDate = applicationContext
    .getUtilities()
    .formatNow('MMMM D, YYYY');

  //serve every document on IRS superuser if case has been served to the IRS
  if (caseEntity.status !== CASE_STATUS_TYPES.new) {
    partiesToServe.electronic.push({
      email: applicationContext.getIrsSuperuserEmail(),
      name: 'IRS',
    });
  }

  const destinations = partiesToServe.electronic.map(party => ({
    email: party.email,
    templateData: {
      emailContent: reactTemplateGenerator({
        componentName: 'DocumentService',
        data: {
          caseDetail: {
            caseTitle: Case.getCaseTitle(caseCaption),
            docketNumber,
            docketNumberWithSuffix,
          },
          currentDate,
          docketEntryNumber,
          documentDetail: {
            docketEntryId,
            documentTitle: documentTitle || documentType,
            eventCode,
            filedBy,
            servedAtFormatted: applicationContext
              .getUtilities()
              .formatDateString(servedAt, 'DATE_TIME_TZ'),
          },
          name: party.name,
          taxCourtLoginUrl: `https://app.${process.env.EFCMS_DOMAIN}`,
        },
      }),
    },
  }));

  if (destinations.length > 0) {
    await applicationContext.getDispatchers().sendBulkTemplatedEmail({
      applicationContext,
      defaultTemplateData: {
        docketNumber: docketNumberWithSuffix,
        emailContent: '',
      },
      destinations,
      templateName: process.env.EMAIL_DOCUMENT_SERVED_TEMPLATE,
    });
  }
};
