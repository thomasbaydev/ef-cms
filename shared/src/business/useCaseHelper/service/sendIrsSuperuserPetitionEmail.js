const {
  Case,
  getContactPrimary,
  getContactSecondary,
} = require('../../entities/cases/Case');
const {
  reactTemplateGenerator,
} = require('../../utilities/generateHTMLTemplateForPDF/reactTemplateGenerator');

exports.sendIrsSuperuserPetitionEmail = async ({
  applicationContext,
  caseEntity,
  docketEntryId,
}) => {
  const docketEntryEntity = caseEntity.getDocketEntryById({ docketEntryId });

  if (docketEntryEntity.index === undefined) {
    throw new Error('Cannot serve a docket entry without an index.');
  }

  const caseDetail = applicationContext
    .getUtilities()
    .setServiceIndicatorsForCase(caseEntity);
  const {
    caseCaption,
    docketNumber,
    docketNumberWithSuffix,
    mailingDate,
    preferredTrialCity,
    privatePractitioners,
  } = caseDetail;

  const contactPrimary = getContactPrimary(caseDetail);
  const contactSecondary = getContactSecondary(caseDetail);

  const { documentType, eventCode, filingDate, servedAt } = docketEntryEntity;

  privatePractitioners.forEach(practitioner => {
    const representingFormatted = [];
    const representingPrimary = practitioner.getRepresentingPrimary(caseEntity);
    const representingSecondary = practitioner.getRepresentingSecondary(
      caseEntity,
    );

    if (representingPrimary) {
      representingFormatted.push(contactPrimary.name);
    }

    if (representingSecondary && contactSecondary) {
      representingFormatted.push(contactSecondary.name);
    }

    practitioner.representingFormatted = representingFormatted.join(', ');
  });

  const currentDate = applicationContext
    .getUtilities()
    .formatNow('MMMM D, YYYY');

  const filingDateFormatted = applicationContext
    .getUtilities()
    .formatDateString(filingDate, 'MM/DD/YY');

  const formattedMailingDate =
    mailingDate || `Electronically Filed ${filingDateFormatted}`;

  const templateHtml = reactTemplateGenerator({
    componentName: 'PetitionService',
    data: {
      caseDetail: {
        caseTitle: Case.getCaseTitle(caseCaption),
        docketNumber,
        docketNumberWithSuffix,
        trialLocation: preferredTrialCity || 'No requested place of trial',
      },
      contactPrimary,
      contactSecondary,
      currentDate,
      docketEntryNumber: docketEntryEntity.index,
      documentDetail: {
        docketEntryId,
        documentTitle: documentType,
        eventCode,
        filingDate: filingDateFormatted,
        formattedMailingDate,
        servedAtFormatted: applicationContext
          .getUtilities()
          .formatDateString(servedAt, 'DATE_TIME_TZ'),
      },
      practitioners: privatePractitioners,
      taxCourtLoginUrl: `https://app.${process.env.EFCMS_DOMAIN}`,
    },
  });

  const destination = {
    email: applicationContext.getIrsSuperuserEmail(),
    templateData: {
      docketNumber: docketNumberWithSuffix,
      emailContent: templateHtml,
    },
  };

  await applicationContext.getDispatchers().sendBulkTemplatedEmail({
    applicationContext,
    defaultTemplateData: {
      docketNumber: '',
      emailContent: 'A petition has been served.',
    },
    destinations: [destination],
    templateName: process.env.EMAIL_SERVED_PETITION_TEMPLATE,
  });

  applicationContext.logger.info('served a document to the irs', {
    destination,
    docketEntryId,
    docketNumber,
    eventCode,
  });
};
