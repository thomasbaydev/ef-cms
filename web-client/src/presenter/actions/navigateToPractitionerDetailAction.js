import { state } from 'cerebral';

/**
 * changes the route to the practitioner detail page for the given props.barNumber
 *
 * @param {object} providers the providers object
 * @param {object} providers.get the cerebral function to retrieve information from state
 * @param {object} providers.router the riot.router object that is used for changing the route
 * @param {object} providers.props the cerebral props object
 * @returns {Promise} async action
 */
export const navigateToPractitionerDetailAction = async ({
  get,
  props,
  router,
}) => {
  const user = get(state.form);
  const barNumber = props.barNumber || user.barNumber;

  if (barNumber) {
    await router.route(`/practitioner-detail/${barNumber}`);
  }
};
