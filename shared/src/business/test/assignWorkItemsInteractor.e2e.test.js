const sinon = require('sinon');
const {
  assignWorkItemsInteractor,
} = require('../useCases/workitems/assignWorkItemsInteractor');
const {
  createTestApplicationContext,
} = require('./createTestApplicationContext');
const {
  getDocumentQCInboxForUserInteractor,
} = require('../useCases/workitems/getDocumentQCInboxForUserInteractor');
const { createCaseInteractor } = require('../useCases/createCaseInteractor');
const { getCaseInteractor } = require('../useCases/getCaseInteractor');
const { ContactFactory } = require('../entities/contacts/ContactFactory');
const { User } = require('../entities/User');
const { Case } = require('../entities/Case');

const CREATED_DATE = '2019-03-01T22:54:06.000Z';

describe('assignWorkItemsInteractor integration test', () => {
  let applicationContext;

  beforeEach(() => {
    sinon.stub(window.Date.prototype, 'toISOString').returns(CREATED_DATE);
    applicationContext = createTestApplicationContext({
      user: {
        name: 'Rick Petitioner',
        role: 'petitioner',
        userId: 'a805d1ab-18d0-43ec-bafb-654e83405416',
      },
    });
  });

  afterEach(() => {
    window.Date.prototype.toISOString.restore();
  });

  it('should create the expected case into the database', async () => {
    const { caseId } = await createCaseInteractor({
      applicationContext,
      petitionFileId: '92eac064-9ca5-4c56-80a0-c5852c752277',
      petitionMetadata: {
        caseType: 'Innocent Spouse',
        contactPrimary: {
          address1: '19 First Freeway',
          address2: 'Ad cumque quidem lau',
          address3: 'Anim est dolor animi',
          city: 'Rerum eaque cupidata',
          countryType: 'domestic',
          email: 'taxpayer@example.com',
          name: 'Rick Petitioner',
          phone: '+1 (599) 681-5435',
          postalCode: '89614',
          state: 'AP',
        },
        contactSecondary: {},
        filingType: 'Myself',
        hasIrsNotice: false,
        partyType: ContactFactory.PARTY_TYPES.petitioner,
        preferredTrialCity: 'Aberdeen, South Dakota',
        procedureType: 'Small',
      },
      stinFileId: '72de0fac-f63c-464f-ac71-0f54fd248484',
    });

    applicationContext.getCurrentUser = () => {
      return new User({
        name: 'Test Petitionsclerk',
        role: 'petitionsclerk',
        userId: '3805d1ab-18d0-43ec-bafb-654e83405416',
      });
    };

    const createdCase = await getCaseInteractor({
      applicationContext,
      caseId,
    });

    const workItem = createdCase.documents.find(
      d => d.documentType === 'Petition',
    ).workItems[0];

    let inbox = await getDocumentQCInboxForUserInteractor({
      applicationContext,
      userId: applicationContext.getCurrentUser().userId,
    });
    expect(inbox).toEqual([]);

    await assignWorkItemsInteractor({
      applicationContext,
      assigneeId: '3805d1ab-18d0-43ec-bafb-654e83405416',
      assigneeName: 'Test Petitionsclerk',
      workItemId: workItem.workItemId,
    });
    inbox = await getDocumentQCInboxForUserInteractor({
      applicationContext,
      userId: applicationContext.getCurrentUser().userId,
    });
    expect(inbox).toMatchObject([
      {
        assigneeId: '3805d1ab-18d0-43ec-bafb-654e83405416',
        assigneeName: 'Test Petitionsclerk',
        caseStatus: Case.STATUS_TYPES.new,
        docketNumber: '101-19',
        docketNumberSuffix: 'S',
        document: {
          documentType: 'Petition',
          filedBy: 'Petr. Rick Petitioner',
          userId: 'a805d1ab-18d0-43ec-bafb-654e83405416',
        },
        isInitializeCase: true,
        messages: [
          {
            from: 'Alex Petitionsclerk',
            fromUserId: 'a805d1ab-18d0-43ec-bafb-654e83405416',
            message: 'Petition filed by Rick Petitioner is ready for review.',
          },
          {
            from: 'Test Petitionsclerk',
            fromUserId: '3805d1ab-18d0-43ec-bafb-654e83405416',
            message: 'Petition filed by Rick Petitioner is ready for review.',
            to: 'Test Petitionsclerk',
            toUserId: '3805d1ab-18d0-43ec-bafb-654e83405416',
          },
        ],
        section: 'petitions',
        sentBy: 'Test Petitionsclerk',
        sentBySection: 'petitions',
        sentByUserId: '3805d1ab-18d0-43ec-bafb-654e83405416',
      },
    ]);

    const caseAfterAssign = await getCaseInteractor({
      applicationContext,
      caseId,
    });
    expect(
      caseAfterAssign.documents.find(d => d.documentType === 'Petition'),
    ).toMatchObject({
      documentType: 'Petition',
      workItems: [
        {
          assigneeId: '3805d1ab-18d0-43ec-bafb-654e83405416',
          assigneeName: 'Test Petitionsclerk',
          document: {
            documentType: 'Petition',
            filedBy: 'Petr. Rick Petitioner',
          },
          messages: [
            {
              createdAt: '2019-03-01T22:54:06.000Z',
              from: 'Alex Petitionsclerk',
              fromUserId: 'a805d1ab-18d0-43ec-bafb-654e83405416',
              message: 'Petition filed by Rick Petitioner is ready for review.',
            },
            {
              from: 'Test Petitionsclerk',
              fromUserId: '3805d1ab-18d0-43ec-bafb-654e83405416',
              message: 'Petition filed by Rick Petitioner is ready for review.',
              to: 'Test Petitionsclerk',
              toUserId: '3805d1ab-18d0-43ec-bafb-654e83405416',
            },
          ],
        },
      ],
    });
  });
});
