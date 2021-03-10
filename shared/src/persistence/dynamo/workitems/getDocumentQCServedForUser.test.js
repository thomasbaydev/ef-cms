const {
  applicationContext,
} = require('../../../business/test/createTestApplicationContext');
const {
  DOCKET_SECTION,
} = require('../../../business/entities/EntityConstants');
const { getDocumentQCServedForUser } = require('./getDocumentQCServedForUser');

describe('getDocumentQCServedForUser', () => {
  let queryStub;

  beforeEach(() => {
    const itemsToReturn = [
      {
        completedAt: 'today',
        completedByUserId: '1805d1ab-18d0-43ec-bafb-654e83405416',
        section: DOCKET_SECTION,
        userId: '1805d1ab-18d0-43ec-bafb-654e83405416',
      },
      {
        completedAt: 'today',
        completedByUserId: 'bob',
        section: DOCKET_SECTION,
        userId: '1805d1ab-18d0-43ec-bafb-654e83405416',
      },
      {
        completedAt: 'today',
        section: DOCKET_SECTION,
        userId: '1805d1ab-18d0-43ec-bafb-654e83405416',
      },
      {
        completedAt: null,
        section: DOCKET_SECTION,
        userId: '1805d1ab-18d0-43ec-bafb-654e83405416',
      },
    ];

    queryStub = jest
      .fn()
      .mockReturnValueOnce({
        promise: async () => ({
          Items: itemsToReturn,
          LastEvaluatedKey: 'last-evaluated-key',
        }),
      })
      .mockReturnValue({
        promise: async () => ({
          Items: itemsToReturn,
        }),
      });
  });

  it('should filter out the work items returned from persistence to only have served documents', async () => {
    applicationContext.getCurrentUser.mockReturnValue({
      section: DOCKET_SECTION,
      userId: '1805d1ab-18d0-43ec-bafb-654e83405416',
    });
    applicationContext.getDocumentClient.mockReturnValue({
      query: queryStub,
    });
    const items = await getDocumentQCServedForUser({
      applicationContext,
      userId: '1805d1ab-18d0-43ec-bafb-654e83405416',
    });
    expect(
      applicationContext.getDocumentClient().query.mock.calls[1][0],
    ).toMatchObject({
      ExclusiveStartKey: 'last-evaluated-key',
    });
    expect(
      applicationContext.getDocumentClient().query.mock.calls[0][0],
    ).toMatchObject({
      ExclusiveStartKey: null,
    });
    expect(items).toEqual(
      expect.arrayContaining([
        {
          completedAt: 'today',
          completedByUserId: '1805d1ab-18d0-43ec-bafb-654e83405416',
          section: DOCKET_SECTION,
          userId: '1805d1ab-18d0-43ec-bafb-654e83405416',
        },
      ]),
    );
  });
});
