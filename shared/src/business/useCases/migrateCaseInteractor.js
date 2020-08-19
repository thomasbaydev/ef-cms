const {
  isAuthorized,
  ROLE_PERMISSIONS,
} = require('../../authorization/authorizationClientService');
const { Case } = require('../entities/cases/Case');
const { UnauthorizedError } = require('../../errors/errors');
const { UserCase } = require('../entities/UserCase');

/**
 *
 * @param {object} providers the providers object
 * @param {object} providers.applicationContext the application context
 * @param {object} providers.caseMetadata the case metadata
 * @returns {object} the created case
 */
exports.migrateCaseInteractor = async ({
  applicationContext,
  caseMetadata,
}) => {
  const authorizedUser = applicationContext.getCurrentUser();

  if (!isAuthorized(authorizedUser, ROLE_PERMISSIONS.MIGRATE_CASE)) {
    throw new UnauthorizedError('Unauthorized');
  }

  const user = await applicationContext
    .getPersistenceGateway()
    .getUserById({ applicationContext, userId: authorizedUser.userId });

  if (caseMetadata && caseMetadata.docketNumber) {
    const docketNumber = Case.formatDocketNumber(caseMetadata.docketNumber);

    const caseToDelete = await applicationContext
      .getPersistenceGateway()
      .getCaseByDocketNumber({
        applicationContext,
        docketNumber,
      });

    if (caseToDelete) {
      await Promise.all([
        applicationContext
          .getPersistenceGateway()
          .deleteCaseByDocketNumber({ applicationContext, docketNumber }),
        ...caseToDelete.documents.map(({ documentId }) =>
          applicationContext
            .getPersistenceGateway()
            .deleteDocumentFromS3({ applicationContext, key: documentId }),
        ),
      ]);
    }
  }

  const caseToAdd = new Case(
    {
      ...caseMetadata,
      userId: user.userId,
    },
    {
      applicationContext,
    },
  );

  for (let privatePractitioner of caseToAdd.privatePractitioners) {
    const practitioner = await applicationContext
      .getPersistenceGateway()
      .getPractitionerByBarNumber({
        applicationContext,
        barNumber: privatePractitioner.barNumber,
      });

    if (practitioner) {
      privatePractitioner.contact = practitioner.contact;
      privatePractitioner.name = practitioner.name;
      privatePractitioner.userId = practitioner.userId;

      const userCaseEntity = new UserCase(caseToAdd);

      await applicationContext.getPersistenceGateway().associateUserWithCase({
        applicationContext,
        docketNumber: caseToAdd.docketNumber,
        userCase: userCaseEntity.validate().toRawObject(),
        userId: practitioner.userId,
      });
    } else {
      privatePractitioner.userId = applicationContext.getUniqueId();
    }
  }

  for (let irsPractitioner of caseToAdd.irsPractitioners) {
    const practitioner = await applicationContext
      .getPersistenceGateway()
      .getPractitionerByBarNumber({
        applicationContext,
        barNumber: irsPractitioner.barNumber,
      });

    if (practitioner) {
      irsPractitioner.contact = practitioner.contact;
      irsPractitioner.name = practitioner.name;
      irsPractitioner.userId = practitioner.userId;

      const userCaseEntity = new UserCase(caseToAdd);

      await applicationContext.getPersistenceGateway().associateUserWithCase({
        applicationContext,
        docketNumber: caseToAdd.docketNumber,
        userCase: userCaseEntity.validate().toRawObject(),
        userId: practitioner.userId,
      });
    } else {
      irsPractitioner.userId = applicationContext.getUniqueId();
    }
  }

  const caseValidatedRaw = caseToAdd.validateForMigration().toRawObject();

  if (caseToAdd.trialSessionId) {
    const trialSessionData = applicationContext
      .getPersistenceGateway()
      .getTrialSessionById({
        applicationContext,
        trialSessionId: caseToAdd.trialSessionId,
      });
    if (!trialSessionData) {
      throw new Error(
        `Trial Session not found with id ${caseToAdd.trialSessionId}`,
      );
    }
  }

  await applicationContext.getPersistenceGateway().createCase({
    applicationContext,
    caseToCreate: caseValidatedRaw,
  });

  for (const correspondenceEntity of caseToAdd.correspondence) {
    await applicationContext.getPersistenceGateway().updateCaseCorrespondence({
      applicationContext,
      correspondence: correspondenceEntity.validate().toRawObject(),
      docketNumber: caseToAdd.docketNumber,
    });
  }

  // when part of a consolidated case, run the update use case
  // which will link the cases together in DynamoDB
  if (caseToAdd.leadDocketNumber) {
    await applicationContext.getPersistenceGateway().updateCase({
      applicationContext,
      caseToUpdate: caseValidatedRaw,
    });
  }

  return caseValidatedRaw;
};
