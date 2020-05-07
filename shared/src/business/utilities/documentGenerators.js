// const {
//   reactTemplateGenerator,
// } = require('./generateHTMLTemplateForPDF/reactTemplateGenerator');
const { generateHTMLTemplateForPDF } = require('./generateHTMLTemplateForPDF');
const reactTemplateGenerator = () => '<div>hi</div>';

const {
  generateChangeOfAddressTemplate,
} = require('./generateHTMLTemplateForPDF/generateChangeOfAddressTemplate');
const {
  generatePrintableDocketRecordTemplate,
} = require('./generateHTMLTemplateForPDF/generatePrintableDocketRecordTemplate');

const changeOfAddress = async ({ applicationContext, content }) => {
  const pdfContentHtml = await generateChangeOfAddressTemplate({
    applicationContext,
    content,
  });

  const { docketNumber } = content;

  const headerHtml = reactTemplateGenerator({
    componentName: 'PageMetaHeaderDocket',
    data: {
      docketNumber,
    },
  });

  const pdf = await applicationContext
    .getUseCases()
    .generatePdfFromHtmlInteractor({
      applicationContext,
      contentHtml: pdfContentHtml,
      displayHeaderFooter: true,
      docketNumber,
      headerHtml,
      overwriteHeader: true,
    });

  return pdf;
};

const docketRecord = async ({ applicationContext, data }) => {
  const pdfContentHtml = await generatePrintableDocketRecordTemplate({
    applicationContext,
    data,
  });

  const docketNumber = data.caseDetail.docketNumberWithSuffix;

  const headerHtml = reactTemplateGenerator({
    componentName: 'PageMetaHeaderDocket',
    data: {
      docketNumber,
    },
  });

  const pdf = await applicationContext
    .getUseCases()
    .generatePdfFromHtmlInteractor({
      applicationContext,
      contentHtml: pdfContentHtml,
      displayHeaderFooter: true,
      docketNumber,
      headerHtml,
      overwriteHeader: true,
    });

  return pdf;
};

const standingPretrialOrder = async ({ applicationContext, data }) => {
  const {
    caseCaptionExtension,
    caseTitle,
    docketNumberWithSuffix,
    footerDate,
    trialInfo,
  } = data;

  const reactStandingPretrialOrderTemplate = reactTemplateGenerator({
    componentName: 'StandingPretrialOrder',
    data: {
      footerDate,
      options: {
        caseCaptionExtension,
        caseTitle,
        docketNumberWithSuffix,
      },
      trialInfo,
    },
  });

  const pdfContentHtml = await generateHTMLTemplateForPDF({
    applicationContext,
    // TODO: Remove main prop when index.pug can be refactored to remove header logic
    content: { main: reactStandingPretrialOrderTemplate },
    options: {
      overwriteMain: true,
      title: 'Standing Pre-trial Order',
    },
  });

  const headerHtml = reactTemplateGenerator({
    componentName: 'PageMetaHeaderDocket',
    data: {
      docketNumber: docketNumberWithSuffix,
    },
  });

  const pdf = await applicationContext
    .getUseCases()
    .generatePdfFromHtmlInteractor({
      applicationContext,
      contentHtml: pdfContentHtml,
      displayHeaderFooter: true,
      docketNumber: docketNumberWithSuffix,
      headerHtml,
      overwriteHeader: true,
    });

  return pdf;
};

module.exports = {
  changeOfAddress,
  docketRecord,
  standingPretrialOrder,
};
