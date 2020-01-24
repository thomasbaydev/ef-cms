const createTrialSession = async ({ applicationContext }) => {
  return await applicationContext.getUseCases().createTrialSession({
    applicationContext,
    trialSession: {
      maxCases: 100,
      sessionType: 'Regular',
      startDate: '2025-03-01T00:00:00.000Z',
      term: 'Fall',
      termYear: '2025',
      trialLocation: 'Birmingham, Alabama',
    },
  });
};

const createCase = async ({ applicationContext }) => {
  const caseDetail = await applicationContext
    .getUseCases()
    .createCaseInteractor({
      applicationContext,
      petitionFileId: '1f1aa3f7-e2e3-43e6-885d-4ce341588c76',
      petitionMetadata: {
        caseType: 'Whistleblower',
        contactPrimary: {
          address1: '68 Fabien Freeway',
          address2: 'Suscipit animi solu',
          address3: 'Architecto assumenda',
          city: 'Aspernatur nostrum s',
          countryType: 'domestic',
          email: 'petitioner',
          name: 'Brett Osborne',
          phone: '+1 (537) 235-6147',
          postalCode: '89499',
          state: 'AS',
        },
        filingType: 'Myself',
        hasIrsNotice: false,
        partyType: 'Petitioner',
        preferredTrialCity: 'Birmingham, Alabama',
        procedureType: 'Regular',
      },
      stinFileId: 'b1aa4aa2-c214-424c-8870-d0049c5744d8',
    });

  const addCoversheet = document => {
    return applicationContext.getUseCases().addCoversheetInteractor({
      applicationContext,
      caseId: caseDetail.caseId,
      documentId: document.documentId,
    });
  };

  for (const document of caseDetail.documents) {
    await addCoversheet(document);
  }

  return caseDetail;
};

module.exports = { createCase, createTrialSession };
