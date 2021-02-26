const {
  CASE_STATUS_TYPES,
  CASE_TYPES_MAP,
  COUNTRY_TYPES,
  DOCKET_NUMBER_SUFFIXES,
  INITIAL_DOCUMENT_TYPES,
  PETITIONS_SECTION,
} = require('../entities/EntityConstants');
const { applicationContext } = require('../test/createTestApplicationContext');
const { createCaseInteractor } = require('../useCases/createCaseInteractor');
const { getCaseInteractor } = require('../useCases/getCaseInteractor');
const { PARTY_TYPES, ROLES } = require('../entities/EntityConstants');

describe('createCase integration test', () => {
  const CREATED_DATE = '2019-03-01T22:54:06.000Z';
  const CREATED_YEAR = '2019';
  const PETITIONER_USER_ID = '7805d1ab-18d0-43ec-bafb-654e83405416';

  const petitionerUser = {
    name: 'Test Petitioner',
    role: ROLES.petitioner,
    userId: PETITIONER_USER_ID,
  };

  beforeAll(() => {
    window.Date.prototype.toISOString = jest.fn().mockReturnValue(CREATED_DATE);
    window.Date.prototype.getFullYear = jest.fn().mockReturnValue(CREATED_YEAR);

    applicationContext.getCurrentUser.mockReturnValue(petitionerUser);
    applicationContext
      .getPersistenceGateway()
      .getUserById.mockReturnValue(petitionerUser);
  });

  it('should create the expected case into the database', async () => {
    const { docketNumber } = await createCaseInteractor({
      applicationContext,
      petitionFileId: '92eac064-9ca5-4c56-80a0-c5852c752277',
      petitionMetadata: {
        caseType: CASE_TYPES_MAP.innocentSpouse,
        contactPrimary: {
          address1: '19 First Freeway',
          address2: 'Ad cumque quidem lau',
          address3: 'Anim est dolor animi',
          city: 'Rerum eaque cupidata',
          countryType: COUNTRY_TYPES.DOMESTIC,
          email: 'petitioner@example.com',
          name: 'Rick Petitioner',
          phone: '+1 (599) 681-5435',
          postalCode: '89614',
          state: 'AL',
        },
        contactSecondary: {},
        filingType: 'Myself',
        hasIrsNotice: false,
        partyType: PARTY_TYPES.petitioner,
        preferredTrialCity: 'Aberdeen, South Dakota',
        procedureType: 'Small',
      },
      stinFileId: '72de0fac-f63c-464f-ac71-0f54fd248484',
    });

    const createdCase = await getCaseInteractor({
      applicationContext,
      docketNumber,
    });

    expect(createdCase).toMatchObject({
      caseCaption: 'Rick Petitioner, Petitioner',
      contactPrimary: {
        contactId: PETITIONER_USER_ID,
      },
      docketEntries: [
        {
          documentType: 'Petition',
          eventCode: 'P',
          filedBy: 'Petr. Rick Petitioner',
          workItem: {
            assigneeId: null,
            assigneeName: null,
            caseStatus: CASE_STATUS_TYPES.new,
            docketEntry: {
              documentType: 'Petition',
              filedBy: 'Petr. Rick Petitioner',
            },
            docketNumber: '101-19',
            docketNumberWithSuffix: '101-19S',
            isInitializeCase: true,
            section: PETITIONS_SECTION,
            sentBy: 'Test Petitioner',
            sentByUserId: PETITIONER_USER_ID,
          },
        },
        {
          documentTitle: 'Request for Place of Trial at Aberdeen, South Dakota',
          documentType:
            INITIAL_DOCUMENT_TYPES.requestForPlaceOfTrial.documentType,
          eventCode: 'RQT',
        },
        {
          documentType: INITIAL_DOCUMENT_TYPES.stin.documentType,
          eventCode: INITIAL_DOCUMENT_TYPES.stin.eventCode,
          filedBy: 'Petr. Rick Petitioner',
          userId: PETITIONER_USER_ID,
        },
      ],
      docketNumber: '101-19',
      docketNumberWithSuffix: '101-19S',
      initialCaption: 'Rick Petitioner, Petitioner',
      initialDocketNumberSuffix: DOCKET_NUMBER_SUFFIXES.SMALL,
      noticeOfAttachments: false,
      orderForAmendedPetition: false,
      orderForAmendedPetitionAndFilingFee: false,
      orderForFilingFee: true,
      orderForOds: false,
      orderForRatification: false,
      orderToShowCause: false,
      status: CASE_STATUS_TYPES.new,
    });
  });
});
