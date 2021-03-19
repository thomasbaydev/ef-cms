const {
  isAuthorized,
  ROLE_PERMISSIONS,
} = require('../../../authorization/authorizationClientService');
const { Message } = require('../../entities/Message');
const { UnauthorizedError } = require('../../../errors/errors');

/**
 * getCompletedMessagesForSectionInteractor
 *
 * @param {object} applicationContext the application context
 * @param {object} providers the providers object
 * @param {string} providers.section the section to get the inbox messages
 * @returns {object} the messages in the user inbox
 */
exports.getCompletedMessagesForSectionInteractor = async (
  applicationContext,
  { section },
) => {
  const authorizedUser = applicationContext.getCurrentUser();

  if (!isAuthorized(authorizedUser, ROLE_PERMISSIONS.VIEW_MESSAGES)) {
    throw new UnauthorizedError('Unauthorized');
  }

  const messages = await applicationContext
    .getPersistenceGateway()
    .getCompletedSectionInboxMessages({
      applicationContext,
      section,
    });

  return Message.validateRawCollection(messages, {
    applicationContext,
  });
};
