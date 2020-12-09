const {
  isAuthorized,
  ROLE_PERMISSIONS,
} = require('../../../authorization/authorizationClientService');
const { Case } = require('../../entities/cases/Case');
const { TrialSession } = require('../../entities/trialSessions/TrialSession');
const { UnauthorizedError } = require('../../../errors/errors');

/**
 * setForHearingInteractor
 *
 * @param {object} providers the providers object
 * @param {object} providers.applicationContext the application context
 * @param {string} providers.calendarNotes notes for why the trial session/hearing was added
 * @param {string} providers.trialSessionId the id of the trial session
 * @param {string} providers.docketNumber the docket number of the case
 * @returns {Promise} the promise of the addCaseToTrialSessionInteractor call
 */
exports.setForHearingInteractor = async ({
  applicationContext,
  calendarNotes,
  docketNumber,
  trialSessionId,
}) => {
  const user = applicationContext.getCurrentUser();

  if (!isAuthorized(user, ROLE_PERMISSIONS.SET_FOR_HEARING)) {
    throw new UnauthorizedError('Unauthorized');
  }

  const trialSession = await applicationContext
    .getPersistenceGateway()
    .getTrialSessionById({
      applicationContext,
      trialSessionId,
    });

  const caseDetails = await applicationContext
    .getPersistenceGateway()
    .getCaseByDocketNumber({
      applicationContext,
      docketNumber,
    });

  const caseEntity = new Case(caseDetails, { applicationContext });

  const trialSessionEntity = new TrialSession(trialSession, {
    applicationContext,
  });

  if (!caseEntity.isCalendared()) {
    throw new Error('The Case must be calendared to add a hearing');
  }

  trialSessionEntity
    .deleteCaseFromCalendar({ docketNumber: caseEntity.docketNumber }) // we delete because it might have been manually removed
    .manuallyAddCaseToCalendar({ calendarNotes, caseEntity });

  await applicationContext.getPersistenceGateway().addHearingToCase({
    applicationContext,
    docketNumber,
    trialSession: trialSessionEntity.validate().toRawObject(),
  });

  // retrieve the case again since we've added the mapped hearing record :)
  const updatedCase = await applicationContext
    .getPersistenceGateway()
    .getCaseByDocketNumber({
      applicationContext,
      docketNumber,
    });

  return updatedCase;
};
