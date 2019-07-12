const {
  createCourtIssuedOrderPdfFromHtmlInteractor,
} = require('./createCourtIssuedOrderPdfFromHtmlInteractor');

const PDF_MOCK_BUFFER = 'Hello World';
const pageMock = {
  addStyleTag: () => {},
  evaluateHandle: () => {},
  pdf: () => {
    return PDF_MOCK_BUFFER;
  },
  screenshot: () => {},
  setContent: () => {},
};

const browserMock = {
  close: () => {},
  newPage: () => pageMock,
};

const chromiumMock = {
  font: () => {},
  puppeteer: {
    launch: () => browserMock,
  },
};
describe('createCourtIssuedOrderPdfFromHtmlInteractor', () => {
  it('returns the pdf buffer produced by chromium', async () => {
    const result = await createCourtIssuedOrderPdfFromHtmlInteractor({
      applicationContext: {
        getChromium: () => chromiumMock,
        logger: { error: () => {}, info: () => {} },
      },
      htmlString: 'Hello World from the use case',
    });

    expect(result).toEqual(PDF_MOCK_BUFFER);
  });
});
