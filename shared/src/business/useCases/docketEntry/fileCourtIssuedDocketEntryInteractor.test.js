const {
  applicationContext,
} = require('../../test/createTestApplicationContext');
const {
  CASE_TYPES_MAP,
  CONTACT_TYPES,
  COUNTRY_TYPES,
  DOCKET_SECTION,
  PARTY_TYPES,
  ROLES,
  TRANSCRIPT_EVENT_CODE,
} = require('../../entities/EntityConstants');
const {
  fileCourtIssuedDocketEntryInteractor,
} = require('./fileCourtIssuedDocketEntryInteractor');

describe('fileCourtIssuedDocketEntryInteractor', () => {
  let caseRecord;
  const mockUserId = applicationContext.getUniqueId();

  beforeEach(() => {
    applicationContext.getPersistenceGateway().getUserById.mockReturnValue({
      name: 'Emmett Lathrop "Doc" Brown, Ph.D.',
      role: ROLES.docketClerk,
      section: DOCKET_SECTION,
      userId: 'c54ba5a9-b37b-479d-9201-067ec6e335bb',
    });

    caseRecord = {
      caseCaption: 'Caption',
      caseType: CASE_TYPES_MAP.deficiency,
      createdAt: '',
      docketEntries: [
        {
          docketEntryId: 'c54ba5a9-b37b-479d-9201-067ec6e335bb',
          docketNumber: '45678-18',
          documentTitle: 'Answer',
          documentType: 'Answer',
          eventCode: 'A',
          filedBy: 'Test Petitioner',
          userId: mockUserId,
        },
        {
          docketEntryId: 'c54ba5a9-b37b-479d-9201-067ec6e335bb',
          docketNumber: '45678-18',
          documentTitle: 'Answer',
          documentType: 'Answer',
          eventCode: 'A',
          filedBy: 'Test Petitioner',
          userId: mockUserId,
        },
        {
          docketEntryId: 'c54ba5a9-b37b-479d-9201-067ec6e335bb',
          docketNumber: '45678-18',
          documentTitle: 'Answer',
          documentType: 'Answer',
          eventCode: 'A',
          filedBy: 'Test Petitioner',
          userId: mockUserId,
        },
        {
          docketEntryId: 'c54ba5a9-b37b-479d-9201-067ec6e335ba',
          docketNumber: '45678-18',
          documentTitle: 'Order',
          documentType: 'Order',
          eventCode: 'O',
          signedAt: '2019-03-01T21:40:46.415Z',
          signedByUserId: mockUserId,
          signedJudgeName: 'Dredd',
          userId: mockUserId,
        },
        {
          docketEntryId: 'c54ba5a9-b37b-479d-9201-067ec6e335bc',
          docketNumber: '45678-18',
          documentTitle: 'Order to Show Cause',
          documentType: 'Order to Show Cause',
          eventCode: 'OSC',
          signedAt: '2019-03-01T21:40:46.415Z',
          signedByUserId: mockUserId,
          signedJudgeName: 'Dredd',
          userId: mockUserId,
        },
        {
          docketEntryId: '7f61161c-ede8-43ba-8fab-69e15d057012',
          docketNumber: '45678-18',
          documentTitle: 'Transcript of [anything] on [date]',
          documentType: 'Transcript',
          eventCode: TRANSCRIPT_EVENT_CODE,
          userId: mockUserId,
        },
      ],
      docketNumber: '45678-18',
      filingType: 'Myself',
      partyType: PARTY_TYPES.petitioner,
      petitioners: [
        {
          address1: '123 Main St',
          city: 'Somewhere',
          contactType: CONTACT_TYPES.primary,
          countryType: COUNTRY_TYPES.DOMESTIC,
          email: 'fieri@example.com',
          name: 'Guy Fieri',
          phone: '1234567890',
          postalCode: '12345',
          state: 'CA',
        },
      ],
      preferredTrialCity: 'Fresno, California',
      procedureType: 'Regular',
      role: ROLES.petitioner,
      userId: '8100e22a-c7f2-4574-b4f6-eb092fca9f35',
    };

    applicationContext
      .getPersistenceGateway()
      .getCaseByDocketNumber.mockReturnValue(caseRecord);
  });

  it('should throw an error if not authorized', async () => {
    applicationContext.getCurrentUser.mockReturnValue({});

    await expect(
      fileCourtIssuedDocketEntryInteractor(applicationContext, {
        documentMeta: {
          docketEntryId: 'c54ba5a9-b37b-479d-9201-067ec6e335bc',
          docketNumber: caseRecord.docketNumber,
          documentType: 'Memorandum in Support',
        },
      }),
    ).rejects.toThrow('Unauthorized');
  });

  it('should throw an error if the document is not found on the case', async () => {
    applicationContext.getCurrentUser.mockReturnValue({
      name: 'Emmett Lathrop "Doc" Brown, Ph.D.',
      role: ROLES.docketClerk,
      userId: 'c54ba5a9-b37b-479d-9201-067ec6e335bb',
    });

    await expect(
      fileCourtIssuedDocketEntryInteractor(applicationContext, {
        documentMeta: {
          docketEntryId: 'c54ba5a9-b37b-479d-9201-067ec6e335bd',
          docketNumber: caseRecord.docketNumber,
          documentType: 'Order',
        },
      }),
    ).rejects.toThrow('Docket entry not found');
  });

  it('should call countPagesInDocument, updateCase, createUserInboxRecord, and createSectionInboxRecord', async () => {
    applicationContext.getCurrentUser.mockReturnValue({
      name: 'Emmett Lathrop "Doc" Brown, Ph.D.',
      role: ROLES.docketClerk,
      section: DOCKET_SECTION,
      userId: 'c54ba5a9-b37b-479d-9201-067ec6e335bb',
    });

    await fileCourtIssuedDocketEntryInteractor(applicationContext, {
      documentMeta: {
        docketEntryId: 'c54ba5a9-b37b-479d-9201-067ec6e335ba',
        docketNumber: caseRecord.docketNumber,
        documentTitle: 'Order',
        documentType: 'Order',
        eventCode: 'O',
        generatedDocumentTitle: 'Generated Order Document Title',
      },
    });

    expect(
      applicationContext.getPersistenceGateway().updateCase,
    ).toHaveBeenCalled();
    expect(
      applicationContext.getPersistenceGateway().createUserInboxRecord,
    ).toHaveBeenCalled();
    expect(
      applicationContext.getPersistenceGateway().createSectionInboxRecord,
    ).toHaveBeenCalled();
  });

  it('should call updateCase with the docket entry set as pending if the document is a tracked document', async () => {
    applicationContext.getCurrentUser.mockReturnValue({
      name: 'Emmett Lathrop "Doc" Brown, Ph.D.',
      role: ROLES.docketClerk,
      section: DOCKET_SECTION,
      userId: 'c54ba5a9-b37b-479d-9201-067ec6e335bb',
    });

    await fileCourtIssuedDocketEntryInteractor(applicationContext, {
      documentMeta: {
        docketEntryId: 'c54ba5a9-b37b-479d-9201-067ec6e335bc',
        docketNumber: caseRecord.docketNumber,
        documentTitle: 'Order to Show Cause',
        documentType: 'Order to Show Cause',
        eventCode: 'OSC',
        filingDate: '2011-03-01T21:40:46.415Z',
        generatedDocumentTitle: 'Generated Order Document Title',
      },
    });

    expect(
      applicationContext.getPersistenceGateway().updateCase,
    ).toHaveBeenCalled();
    const {
      caseToUpdate,
    } = applicationContext.getPersistenceGateway().updateCase.mock.calls[0][0];
    const docketEntryInCaseToUpdate = caseToUpdate.docketEntries.find(
      d => d.docketEntryId === 'c54ba5a9-b37b-479d-9201-067ec6e335bc',
    );
    expect(docketEntryInCaseToUpdate).toMatchObject({
      docketEntryId: 'c54ba5a9-b37b-479d-9201-067ec6e335bc',
      filingDate: '2011-03-01T21:40:46.415Z',
      pending: true,
    });
  });

  it('should set isDraft to false on a document when creating a court issued docket entry', async () => {
    await fileCourtIssuedDocketEntryInteractor(applicationContext, {
      documentMeta: {
        date: '2019-03-01T21:40:46.415Z',
        docketEntryId: '7f61161c-ede8-43ba-8fab-69e15d057012',
        docketNumber: caseRecord.docketNumber,
        documentTitle: 'Transcript of [anything] on [date]',
        documentType: 'Transcript',
        eventCode: TRANSCRIPT_EVENT_CODE,
        freeText: 'Dogs',
        generatedDocumentTitle: 'Transcript of Dogs on 03-01-19',
        isDraft: true,
      },
    });

    const lastDocumentIndex =
      applicationContext.getPersistenceGateway().updateCase.mock.calls[0][0]
        .caseToUpdate.docketEntries.length - 1;

    const newlyFiledDocument = applicationContext.getPersistenceGateway()
      .updateCase.mock.calls[0][0].caseToUpdate.docketEntries[
      lastDocumentIndex
    ];

    expect(newlyFiledDocument).toMatchObject({
      isDraft: false,
    });
  });

  it('should delete the draftOrderState from the docketEntry', async () => {
    const docketEntryToUpdate = caseRecord.docketEntries[5];
    await fileCourtIssuedDocketEntryInteractor(applicationContext, {
      documentMeta: {
        docketEntryId: docketEntryToUpdate.docketEntryId,
        docketNumber: caseRecord.docketNumber,
        documentTitle: docketEntryToUpdate.documentTitle,
        documentType: docketEntryToUpdate.documentType,
        draftOrderState: {
          documentContents: 'Some content',
          richText: 'some content',
        },
        eventCode: docketEntryToUpdate.eventCode,
      },
    });

    const updatedDocketEntry = applicationContext
      .getUseCaseHelpers()
      .updateCaseAndAssociations.mock.calls[0][0].caseToUpdate.docketEntries.find(
        d => d.docketEntryId === docketEntryToUpdate.docketEntryId,
      );

    expect(updatedDocketEntry).toMatchObject({ draftOrderState: null });
  });

  it('should use original case caption to create case title when creating work item', async () => {
    await fileCourtIssuedDocketEntryInteractor(applicationContext, {
      documentMeta: {
        date: '2019-03-01T21:40:46.415Z',
        docketEntryId: 'c54ba5a9-b37b-479d-9201-067ec6e335ba',
        docketNumber: caseRecord.docketNumber,
        documentTitle: 'Order',
        documentType: 'Order',
        eventCode: 'O',
        freeText: 'Dogs',
        generatedDocumentTitle: 'Transcript of Dogs on 03-01-19',
        serviceStamp: 'Served',
      },
    });

    expect(
      applicationContext.getPersistenceGateway().createUserInboxRecord.mock
        .calls[0][0].workItem,
    ).toMatchObject({
      caseTitle: caseRecord.caseCaption,
    });
  });
});
