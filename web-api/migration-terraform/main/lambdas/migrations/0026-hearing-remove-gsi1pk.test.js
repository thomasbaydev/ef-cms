const { migrateItems } = require('./0026-hearing-remove-gsi1pk.js');

describe('migrateItems', () => {
  let mockHearing;
  beforeEach(() => {
    mockHearing = {
      chambersPhoneNumber: '1111111',
      createdAt: '2018-11-21T20:49:28.192Z',
      joinPhoneNumber: '0987654321',
      judge: {
        name: 'Chief Judge',
        userId: '822366b7-e47c-413e-811f-d29113d09b06',
      },
      maxCases: 100,
      meetingId: '1234567890',
      password: 'abcdefg',
      pk: 'case|123-45',
      proceedingType: 'Remote',
      sessionType: 'Regular',
      sk: 'hearing|6d74eadc-0181-4ff5-826c-305200e8733d',
      startDate: '2025-12-01T00:00:00.000Z',
      term: 'Fall',
      termYear: '2025',
      trialLocation: 'Birmingham, Alabama',
    };
  });

  it('should return and not modify records that are NOT case hearing mapping records', async () => {
    const items = [
      {
        ...mockHearing,
        gsi1pk: 'trial-session-catalog',
        pk: 'case|123-45',
        sk: 'trial-session|6d74eadc-0181-4ff5-826c-305200e8733d',
      },
    ];

    const results = await migrateItems(items);

    expect(results).toEqual([
      {
        ...mockHearing,
        gsi1pk: 'trial-session-catalog',
        pk: 'case|123-45',
        sk: 'trial-session|6d74eadc-0181-4ff5-826c-305200e8733d',
      },
    ]);
  });

  it('should return and not modify case hearing mapping records that do not contain a gsi1pk', async () => {
    const items = [
      {
        ...mockHearing,
      },
    ];

    const results = await migrateItems(items);

    expect(results).toEqual(items);
  });

  it('should return and not modify case hearing mapping records that contain a gsi1pk other than `trial-session-catalog`', async () => {
    const items = [
      {
        ...mockHearing,
        gsi1pk: 'something-else',
      },
    ];

    const results = await migrateItems(items);

    expect(results).toEqual(items);
  });

  it('should delete the gsi1pk property on case hearing records that have a gsi1pk of `trial-session-catalog`', async () => {
    const items = [
      {
        ...mockHearing,
        gsi1pk: 'trial-session-catalog',
      },
    ];

    const results = await migrateItems(items);

    expect(results).toEqual([
      {
        ...mockHearing,
      },
    ]);
  });
});
