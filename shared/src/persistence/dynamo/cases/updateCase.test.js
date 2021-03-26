const client = require('../../dynamodbClientService');
const {
  applicationContext,
} = require('../../../business/test/createTestApplicationContext');
const {
  CASE_STATUS_TYPES,
  DOCKET_NUMBER_SUFFIXES,
} = require('../../../business/entities/EntityConstants');
const { updateCase } = require('./updateCase');
jest.mock('../messages/updateMessage');
const { updateMessage } = require('../messages/updateMessage');
jest.mock('../caseDeadlines/getCaseDeadlinesByDocketNumber');
const {
  getCaseDeadlinesByDocketNumber,
} = require('../caseDeadlines/getCaseDeadlinesByDocketNumber');
jest.mock('../caseDeadlines/createCaseDeadline');
const { createCaseDeadline } = require('../caseDeadlines/createCaseDeadline');

describe('updateCase', () => {
  const mockCaseDeadline = {
    associatedJudge: 'Judge Carluzzo',
    caseDeadlineId: 'a37f712d-bb9c-4885-8d35-7b67b908a5aa',
    deadlineDate: '2019-03-01T21:42:29.073Z',
    description: 'hello world',
    docketNumber: '101-18',
  };

  let caseQueryMockData;
  let caseMappingsQueryMockData;

  let oldCase;

  beforeEach(() => {
    oldCase = {
      archivedCorrespondences: [],
      archivedDocketEntries: [],
      correspondence: [],
      docketEntries: [],
      docketNumberSuffix: null,
      hearings: [],
      inProgress: false,
      irsPractitioners: [],
      pk: 'case|101-18',
      privatePractitioners: [],
      sk: 'case|101-18',
      status: 'General Docket - Not at Issue',
    };

    caseQueryMockData = [
      {
        docketNumberSuffix: null,
        inProgress: false,
        pk: 'case|101-18',
        sk: 'case|101-18',
        status: CASE_STATUS_TYPES.generalDocket,
      },
    ];

    caseMappingsQueryMockData = [
      {
        gsi1pk: 'user-case|101-18',
        leadDocketNumber: '123-20',
        pk: 'user|123',
        sk: 'case|101-18',
        status: CASE_STATUS_TYPES.generalDocket,
      },
    ];

    applicationContext.getDocumentClient().put.mockReturnValue({
      promise: async () => null,
    });

    applicationContext.getDocumentClient().delete.mockReturnValue({
      promise: async () => null,
    });

    applicationContext
      .getDocumentClient()
      .query.mockReturnValueOnce(caseQueryMockData)
      .mockReturnValueOnce(caseMappingsQueryMockData)
      .mockReturnValue([
        {
          sk: '123',
        },
      ]);

    client.query = applicationContext.getDocumentClient().query;

    getCaseDeadlinesByDocketNumber.mockReturnValue([mockCaseDeadline]);
  });

  it('updates case', async () => {
    await updateCase({
      applicationContext,
      caseToUpdate: {
        docketNumber: '101-18',
        docketNumberSuffix: null,
        status: CASE_STATUS_TYPES.generalDocket,
        userId: 'petitioner',
      },
      oldCase,
    });

    expect(
      applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
    ).toMatchObject({
      pk: 'case|101-18',
      sk: 'case|101-18',
    });
  });

  it('should remove fields not stored on main case record in persistence', async () => {
    await updateCase({
      applicationContext,
      caseToUpdate: {
        archivedCorrespondences: [{}],
        archivedDocketEntries: [{}],
        correspondence: [{}],
        docketEntries: [{}],
        docketNumber: '101-18',
        docketNumberSuffix: null,
        hearings: [{}],
        irsPractitioners: [{}],
        privatePractitioners: [{}],
        status: CASE_STATUS_TYPES.generalDocket,
        userId: 'petitioner',
      },
      oldCase,
    });

    const caseUpdateCall = applicationContext
      .getDocumentClient()
      .put.mock.calls.find(
        x =>
          x[0].Item.pk &&
          x[0].Item.pk.startsWith('case|') &&
          x[0].Item.sk.startsWith('case|'),
      );
    expect(caseUpdateCall[0].Item).toEqual({
      docketNumber: '101-18',
      docketNumberSuffix: null,
      pk: 'case|101-18',
      sk: 'case|101-18',
      status: CASE_STATUS_TYPES.generalDocket,
      userId: 'petitioner',
    });
  });

  it('updates fields on work items', async () => {
    await updateCase({
      applicationContext,
      caseToUpdate: {
        associatedJudge: 'Judge Buch',
        caseCaption: 'Johnny Joe Jacobson, Petitioner',
        docketNumber: '101-18',
        docketNumberSuffix: DOCKET_NUMBER_SUFFIXES.WHISTLEBLOWER,
        inProgress: true,
        status: CASE_STATUS_TYPES.calendared,
        trialDate: '2019-03-01T21:40:46.415Z',
        userId: 'petitioner',
      },
      oldCase,
    });

    expect(
      applicationContext.getDocumentClient().put.mock.calls[1][0].Item,
    ).toMatchObject({
      pk: 'case|101-18',
      sk: 'case|101-18',
    });
    expect(
      applicationContext.getDocumentClient().update.mock.calls[0][0],
    ).toMatchObject({
      ExpressionAttributeValues: {
        ':caseStatus': CASE_STATUS_TYPES.calendared,
      },
    });
    expect(
      applicationContext.getDocumentClient().update.mock.calls[1][0],
    ).toMatchObject({
      ExpressionAttributeValues: {
        ':caseTitle': 'Johnny Joe Jacobson',
      },
    });
    expect(
      applicationContext.getDocumentClient().update.mock.calls[2][0],
    ).toMatchObject({
      ExpressionAttributeValues: {
        ':docketNumberSuffix': DOCKET_NUMBER_SUFFIXES.WHISTLEBLOWER,
      },
    });
    expect(
      applicationContext.getDocumentClient().update.mock.calls[3][0],
    ).toMatchObject({
      ExpressionAttributeValues: {
        ':trialDate': '2019-03-01T21:40:46.415Z',
      },
    });
    expect(
      applicationContext.getDocumentClient().update.mock.calls[4][0],
    ).toMatchObject({
      ExpressionAttributeValues: {
        ':associatedJudge': 'Judge Buch',
      },
    });
    expect(
      applicationContext.getDocumentClient().update.mock.calls[5][0],
    ).toMatchObject({
      ExpressionAttributeValues: {
        ':caseIsInProgress': true,
      },
    });
  });

  it('updates fields on case messages', async () => {
    await updateCase({
      applicationContext,
      caseToUpdate: {
        associatedJudge: 'Judge Buch',
        caseCaption: 'Johnny Joe Jacobson, Petitioner',
        docketNumber: '101-18',
        docketNumberSuffix: DOCKET_NUMBER_SUFFIXES.WHISTLEBLOWER,
        inProgress: true,
        status: CASE_STATUS_TYPES.calendared,
        trialDate: '2019-03-01T21:40:46.415Z',
        userId: 'petitioner',
      },
      oldCase,
    });

    expect(updateMessage).toHaveBeenCalled();
    expect(updateMessage.mock.calls[0][0].message).toEqual({
      caseStatus: 'Calendared',
      caseTitle: 'Johnny Joe Jacobson',
      docketNumberSuffix: 'W',
      sk: '123',
    });
  });

  it('updates associated judge on case deadlines', async () => {
    await updateCase({
      applicationContext,
      caseToUpdate: {
        associatedJudge: 'Judge Buch',
        docketNumberSuffix: null,
        status: CASE_STATUS_TYPES.generalDocket,
      },
      oldCase,
    });

    expect(createCaseDeadline).toHaveBeenCalled();
    expect(createCaseDeadline.mock.calls[0][0].caseDeadline).toMatchObject({
      ...mockCaseDeadline,
      associatedJudge: 'Judge Buch',
    });
  });

  it('updates associated judge on work items', async () => {
    await updateCase({
      applicationContext,
      caseToUpdate: {
        associatedJudge: 'Judge Buch',
        docketNumberSuffix: null,
        status: CASE_STATUS_TYPES.generalDocket,
      },
      oldCase,
    });

    expect(
      applicationContext.getDocumentClient().update.mock.calls[0][0],
    ).toMatchObject({
      ExpressionAttributeValues: {
        ':associatedJudge': 'Judge Buch',
      },
    });
  });

  it('does not update work items if work item fields are unchanged', async () => {
    await updateCase({
      applicationContext,
      caseToUpdate: {
        docketNumber: '101-18',
        docketNumberSuffix: null,
        status: CASE_STATUS_TYPES.generalDocket,
      },
      oldCase,
    });

    expect(
      applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
    ).toMatchObject({
      pk: 'case|101-18',
      sk: 'case|101-18',
    });
    expect(applicationContext.getDocumentClient().update).not.toBeCalled();
  });

  describe('user case mappings', () => {
    beforeEach(() => {
      applicationContext.getDocumentClient().query = jest
        .fn()
        .mockResolvedValueOnce(caseQueryMockData) // getting case
        .mockResolvedValueOnce([]) // work item mappings
        .mockResolvedValue(caseMappingsQueryMockData);

      client.query = applicationContext.getDocumentClient().query;
    });

    it('updates user case mapping if the status has changed', async () => {
      await updateCase({
        applicationContext,
        caseToUpdate: {
          associatedJudge: 'Judge Buch',
          docketNumber: '101-18',
          docketNumberSuffix: null,
          inProgress: true,
          status: CASE_STATUS_TYPES.calendared,
          trialDate: '2019-03-01T21:40:46.415Z',
          userId: 'petitioner',
        },
        oldCase,
      });

      expect(
        applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
      ).toMatchObject({
        gsi1pk: 'user-case|101-18',
        pk: 'user|123',
        sk: 'case|101-18',
        status: CASE_STATUS_TYPES.calendared,
      });
    });

    it('updates user case mapping if the docket number suffix has changed', async () => {
      await updateCase({
        applicationContext,
        caseToUpdate: {
          associatedJudge: 'Judge Buch',
          docketNumber: '101-18',
          docketNumberSuffix: DOCKET_NUMBER_SUFFIXES.WHISTLEBLOWER,
          inProgress: true,
          status: CASE_STATUS_TYPES.generalDocket,
          trialDate: '2019-03-01T21:40:46.415Z',
          userId: 'petitioner',
        },
        oldCase,
      });

      expect(
        applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
      ).toMatchObject({
        docketNumberSuffix: DOCKET_NUMBER_SUFFIXES.WHISTLEBLOWER,
        gsi1pk: 'user-case|101-18',
        pk: 'user|123',
        sk: 'case|101-18',
      });
    });

    it('updates user case mapping if the case caption has changed', async () => {
      await updateCase({
        applicationContext,
        caseToUpdate: {
          associatedJudge: 'Judge Buch',
          caseCaption: 'Guy Fieri, Petitioner',
          docketNumber: '101-18',
          docketNumberSuffix: null,
          inProgress: true,
          status: CASE_STATUS_TYPES.generalDocket,
          trialDate: '2019-03-01T21:40:46.415Z',
          userId: 'petitioner',
        },
        oldCase,
      });

      expect(
        applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
      ).toMatchObject({
        caseCaption: 'Guy Fieri, Petitioner',
        gsi1pk: 'user-case|101-18',
        pk: 'user|123',
        sk: 'case|101-18',
      });
    });

    it('updates user case mapping if the lead docket number (consolidation) has changed', async () => {
      await updateCase({
        applicationContext,
        caseToUpdate: {
          associatedJudge: 'Judge Buch',
          docketNumber: '101-18',
          docketNumberSuffix: null,
          inProgress: true,
          leadDocketNumber: '123-20',
          status: CASE_STATUS_TYPES.generalDocket,
          trialDate: '2019-03-01T21:40:46.415Z',
          userId: 'petitioner',
        },
        oldCase,
      });

      expect(
        applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
      ).toMatchObject({
        gsi1pk: 'user-case|101-18',
        leadDocketNumber: '123-20',
        pk: 'user|123',
        sk: 'case|101-18',
      });
    });
  });
});
