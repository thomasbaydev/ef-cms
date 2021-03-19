const {
  isAuthorized,
  ROLE_PERMISSIONS,
} = require('../../../authorization/authorizationClientService');
const { TrialSession } = require('../../entities/trialSessions/TrialSession');
const { UnauthorizedError } = require('../../../errors/errors');

/**
 * saveCalendarNoteInteractor
 *
 * @param {object} applicationContext the application context
 * @param {object} providers the providers object
 * @param {string} providers.calendarNote the note to update
 * @param {string} providers.docketNumber the docket number of the case to update calendar note
 * @param {string} providers.trialSessionId the id of the trial session containing the case with the note
 * @returns {object} trial session entity
 */
exports.saveCalendarNoteInteractor = async (
  applicationContext,
  { calendarNote, docketNumber, trialSessionId },
) => {
  const user = applicationContext.getCurrentUser();
  if (!isAuthorized(user, ROLE_PERMISSIONS.ADD_CASE_TO_TRIAL_SESSION)) {
    throw new UnauthorizedError('Unauthorized');
  }

  const trialSession = await applicationContext
    .getPersistenceGateway()
    .getTrialSessionById({
      applicationContext,
      trialSessionId,
    });

  trialSession.caseOrder.forEach(_caseOrder => {
    if (_caseOrder.docketNumber === docketNumber) {
      _caseOrder.calendarNotes = calendarNote;
    }
  });

  const rawTrialSessionEntity = new TrialSession(trialSession, {
    applicationContext,
  })
    .validate()
    .toRawObject();

  await applicationContext.getPersistenceGateway().updateTrialSession({
    applicationContext,
    trialSessionToUpdate: rawTrialSessionEntity,
  });

  const caseDetail = await applicationContext
    .getPersistenceGateway()
    .getCaseByDocketNumber({
      applicationContext,
      docketNumber,
    });

  if (
    caseDetail.trialSessionId !== trialSessionId &&
    caseDetail.hearings?.length
  ) {
    const hearing = caseDetail.hearings.find(
      caseHearing => caseHearing.trialSessionId === trialSessionId,
    );

    if (hearing) {
      applicationContext.getPersistenceGateway().updateCaseHearing({
        applicationContext,
        docketNumber,
        hearingToUpdate: rawTrialSessionEntity,
      });
    }
  }

  return rawTrialSessionEntity;
};
