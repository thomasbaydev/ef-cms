const {
  applicationContext,
  fakeData,
} = require('../test/createTestApplicationContext');
const {
  COUNTRY_TYPES,
  ROLES,
  SERVICE_INDICATOR_TYPES,
} = require('../entities/EntityConstants');
const { getContactPrimary } = require('../entities/cases/Case');
const { MOCK_CASE } = require('../../test/mockCase');
const { updateContactInteractor } = require('./updateContactInteractor');
const { User } = require('../entities/User');

describe('updates the contact on a case', () => {
  let mockCase;
  let mockUser;
  const mockCaseContactPrimary = MOCK_CASE.petitioners[0];

  beforeEach(() => {
    mockCase = MOCK_CASE;
    mockUser = new User({
      name: 'bob',
      role: ROLES.petitioner,
      userId: mockCaseContactPrimary.contactId,
    });

    applicationContext
      .getPersistenceGateway()
      .getCaseByDocketNumber.mockImplementation(() => mockCase);

    applicationContext
      .getUseCases()
      .generatePdfFromHtmlInteractor.mockReturnValue(fakeData);

    applicationContext
      .getDocumentGenerators()
      .changeOfAddress.mockReturnValue(fakeData);

    applicationContext.getCurrentUser.mockImplementation(() => mockUser);

    applicationContext
      .getChromiumBrowser()
      .newPage()
      .pdf.mockReturnValue(fakeData);

    applicationContext.getUtilities().getAddressPhoneDiff.mockReturnValue({
      address1: {
        newData: 'new test',
        oldData: 'test',
      },
    });

    applicationContext
      .getUtilities()
      .getDocumentTypeForAddressChange.mockReturnValue({
        eventCode: 'NCA',
        title: 'Notice of Change of Address',
      });
  });

  it('should update contactPrimary editable fields', async () => {
    const mockNumberOfPages = 999;
    applicationContext
      .getUseCaseHelpers()
      .countPagesInDocument.mockReturnValue(mockNumberOfPages);

    const caseDetail = await updateContactInteractor(applicationContext, {
      contactInfo: {
        ...mockCaseContactPrimary,
        address1: '453 Electric Ave',
        city: 'Philadelphia',
        email: 'petitioner',
        name: 'Bill Burr',
        phone: '1234567890',
        postalCode: '99999',
        state: 'PA',
      },
      docketNumber: MOCK_CASE.docketNumber,
    });

    const updatedCase =
      applicationContext.getPersistenceGateway().updateCase.mock.calls[0][0]
        .caseToUpdate;
    const changeOfAddressDocument = updatedCase.docketEntries.find(
      d => d.documentType === 'Notice of Change of Address',
    );
    expect(getContactPrimary(updatedCase)).toMatchObject({
      address1: '453 Electric Ave',
      city: 'Philadelphia',
      countryType: COUNTRY_TYPES.DOMESTIC,
      email: mockCaseContactPrimary.email,
      name: mockCaseContactPrimary.name,
      phone: '1234567890',
      postalCode: '99999',
      state: 'PA',
    });
    expect(
      applicationContext.getUseCaseHelpers().countPagesInDocument,
    ).toHaveBeenCalled();

    expect(changeOfAddressDocument).toMatchObject({
      isAutoGenerated: true,
      isFileAttached: true,
      numberOfPages: mockNumberOfPages,
    });
    expect(
      applicationContext.getDocumentGenerators().changeOfAddress,
    ).toHaveBeenCalled();
    expect(
      applicationContext.getUseCaseHelpers().sendServedPartiesEmails,
    ).toHaveBeenCalled();
    expect(caseDetail.docketEntries[4].servedAt).toBeDefined();
    expect(caseDetail.docketEntries[4].filedBy).toBeUndefined();
  });

  it('creates a work item if the contact is not represented by a privatePractitioner and there is no paper service on the case', async () => {
    applicationContext
      .getPersistenceGateway()
      .getCaseByDocketNumber.mockReturnValue({
        ...MOCK_CASE,
        petitioners: [
          {
            ...mockCaseContactPrimary,
            serviceIndicator: SERVICE_INDICATOR_TYPES.SI_ELECTRONIC,
          },
        ],
      });

    await updateContactInteractor(applicationContext, {
      contactInfo: {
        ...mockCaseContactPrimary,
        address1: '453 Electric Ave',
      },
      docketNumber: MOCK_CASE.docketNumber,
    });

    expect(
      applicationContext.getPersistenceGateway().saveWorkItem,
    ).toBeCalled();
  });

  it('creates a work item if the contact is represented by a privatePractitioner and there is paper service on the case', async () => {
    applicationContext
      .getPersistenceGateway()
      .getCaseByDocketNumber.mockReturnValue({
        ...MOCK_CASE,
        petitioners: [
          {
            ...mockCaseContactPrimary,
            serviceIndicator: SERVICE_INDICATOR_TYPES.SI_PAPER,
          },
        ],
        privatePractitioners: [
          {
            barNumber: '1111',
            name: 'Bob Practitioner',
            representing: [mockCaseContactPrimary.contactId],
            role: ROLES.privatePractitioner,
            serviceIndicator: SERVICE_INDICATOR_TYPES.SI_ELECTRONIC,
            userId: '5b992eca-8573-44ff-a33a-7796ba0f201c',
          },
        ],
      });

    await updateContactInteractor(applicationContext, {
      contactInfo: {
        ...mockCaseContactPrimary,
        address1: '453 Electric Ave',
      },
      docketNumber: MOCK_CASE.docketNumber,
    });

    expect(
      applicationContext.getPersistenceGateway().saveWorkItem,
    ).toBeCalled();
  });

  it('does not create a work item if the contact is represented by a privatePractitioner and there is no paper service on the case', async () => {
    applicationContext
      .getPersistenceGateway()
      .getCaseByDocketNumber.mockReturnValue({
        ...MOCK_CASE,
        petitioners: [
          {
            ...mockCaseContactPrimary,
            serviceIndicator: SERVICE_INDICATOR_TYPES.SI_ELECTRONIC,
          },
        ],
        privatePractitioners: [
          {
            barNumber: '1111',
            name: 'Bob Practitioner',
            representing: [mockCaseContactPrimary.contactId],
            role: ROLES.privatePractitioner,
            serviceIndicator: SERVICE_INDICATOR_TYPES.SI_ELECTRONIC,
            userId: '5b992eca-8573-44ff-a33a-7796ba0f201c',
          },
        ],
      });

    await updateContactInteractor(applicationContext, {
      contactInfo: {
        ...mockCaseContactPrimary,
        address1: '453 Electric Ave',
      },
      docketNumber: MOCK_CASE.docketNumber,
    });

    expect(
      applicationContext.getPersistenceGateway().saveWorkItem,
    ).not.toBeCalled();
  });

  it('throws an error if the case was not found', async () => {
    applicationContext
      .getPersistenceGateway()
      .getCaseByDocketNumber.mockResolvedValue(null);

    await expect(
      updateContactInteractor(applicationContext, {
        contactInfo: {},
        docketNumber: MOCK_CASE.docketNumber,
      }),
    ).rejects.toThrow('Case 101-18 was not found.');
  });

  it('throws an error if the user making the request is not associated with the case', async () => {
    mockUser = {
      ...mockUser,
      userId: 'de300c01-f6ff-4843-a72f-ee7cd2521237',
    };

    await expect(
      updateContactInteractor(applicationContext, {
        contactInfo: mockCaseContactPrimary,
        docketNumber: MOCK_CASE.docketNumber,
      }),
    ).rejects.toThrow('Unauthorized for update case contact');
  });

  it('does not update the case if the contact information does not change', async () => {
    applicationContext
      .getUtilities()
      .getDocumentTypeForAddressChange.mockReturnValue(undefined);

    await updateContactInteractor(applicationContext, {
      contactInfo: mockCaseContactPrimary,
      docketNumber: MOCK_CASE.docketNumber,
    });

    expect(
      applicationContext.getPersistenceGateway().updateCase,
    ).toHaveBeenCalled();
    expect(
      applicationContext.getDocumentGenerators().changeOfAddress,
    ).not.toHaveBeenCalled();
    expect(
      applicationContext.getUseCases().generatePdfFromHtmlInteractor,
    ).not.toHaveBeenCalled();
  });

  it('does not update the contact primary email or name', async () => {
    applicationContext
      .getUtilities()
      .getDocumentTypeForAddressChange.mockReturnValue(undefined);

    const caseDetail = await updateContactInteractor(applicationContext, {
      contactInfo: {
        ...mockCaseContactPrimary,
        address1: 'nothing',
        city: 'Somewhere',
        email: 'hello123@example.com',
        name: 'Secondary Party Name Changed',
      },
      docketNumber: MOCK_CASE.docketNumber,
    });

    const contactPrimary = getContactPrimary(caseDetail);

    expect(contactPrimary.name).not.toBe('Secondary Party Name Changed');
    expect(contactPrimary.name).toBe('Test Petitioner');
    expect(contactPrimary.email).not.toBe('hello123@example.com');
    expect(contactPrimary.email).toBe('petitioner@example.com');
  });

  it('should update the contact on the case but not generate the change of address when contact primary address is sealed', async () => {
    const mockCaseWithSealedAddress = {
      ...mockCase,
      petitioners: [
        {
          ...getContactPrimary(MOCK_CASE),
          isAddressSealed: true,
        },
      ],
    };

    applicationContext
      .getPersistenceGateway()
      .getCaseByDocketNumber.mockImplementation(
        () => mockCaseWithSealedAddress,
      );

    await updateContactInteractor(applicationContext, {
      contactInfo: {
        ...mockCaseContactPrimary,
        address1: 'nothing 1',
      },
      docketNumber: MOCK_CASE.docketNumber,
    });

    expect(
      applicationContext.getPersistenceGateway().updateCase,
    ).toHaveBeenCalled();
    expect(
      applicationContext.getPersistenceGateway().saveDocumentFromLambda,
    ).not.toHaveBeenCalled();
    expect(
      applicationContext.getDocumentGenerators().changeOfAddress,
    ).not.toHaveBeenCalled();
    expect(
      applicationContext.getUseCases().generatePdfFromHtmlInteractor,
    ).not.toHaveBeenCalled();
  });

  it('should use original case caption to create case title when creating work item', async () => {
    await updateContactInteractor(applicationContext, {
      contactInfo: {
        ...mockCaseContactPrimary,
        address1: '453 Electric Ave',
      },
      docketNumber: MOCK_CASE.docketNumber,
    });

    expect(
      applicationContext.getPersistenceGateway().saveWorkItem.mock.calls[0][0]
        .workItem,
    ).toMatchObject({
      caseTitle: 'Test Petitioner',
    });
  });
});
