/**
 * action for fetching all the work items associated with a user account.
 *
 * @param {object} applicationContext object that contains all the context specific methods
 * @returns {Promise<{workItems: Array}>} a list of work items
 */
export const getDocumentQCServedForSectionAction = async ({
  applicationContext,
}) => {
  const user = applicationContext.getCurrentUser();
  const workItems = await applicationContext
    .getUseCases()
    .getDocumentQCServedForSection({
      applicationContext,
      section: user.section,
    });
  return { workItems };
};
