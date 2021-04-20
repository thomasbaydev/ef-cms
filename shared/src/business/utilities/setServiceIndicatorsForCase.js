const { isEmpty } = require('lodash');
const { SERVICE_INDICATOR_TYPES } = require('../entities/EntityConstants');

/**
 * sets the service indicators for parties on the given case
 *
 * @param {object} caseDetail case to set service indicators on
 * @returns {object} service indicators for petitioner, privatePractitioners, and irsPractitioners
 */
const setServiceIndicatorsForCase = caseDetail => {
  const {
    contactPrimary,
    contactSecondary,
    isPaper,
    privatePractitioners,
  } = caseDetail;

  let hasPrimaryPractitioner = false;
  let hasSecondaryPractitioner = false;

  // privatePractitioners
  if (privatePractitioners && privatePractitioners.length) {
    privatePractitioners.forEach(practitioner => {
      const representingPrimary = practitioner.representing.find(
        r => r === contactPrimary.contactId,
      );
      const representingSecondary =
        contactSecondary &&
        practitioner.representing.find(r => r === contactSecondary.contactId);

      if (representingPrimary) {
        hasPrimaryPractitioner = true;
      }

      if (representingSecondary) {
        hasSecondaryPractitioner = true;
      }
    });
  }

  // contactPrimary
  if (contactPrimary && !contactPrimary.serviceIndicator) {
    if (hasPrimaryPractitioner) {
      contactPrimary.serviceIndicator = SERVICE_INDICATOR_TYPES.SI_NONE;
    } else {
      const serviceIsPaper = isPaper || !contactPrimary.email;
      contactPrimary.serviceIndicator = serviceIsPaper
        ? SERVICE_INDICATOR_TYPES.SI_PAPER
        : SERVICE_INDICATOR_TYPES.SI_ELECTRONIC;
    }
  }

  // contactSecondary
  if (!isEmpty(contactSecondary) && !contactSecondary.serviceIndicator) {
    contactSecondary.serviceIndicator = hasSecondaryPractitioner
      ? SERVICE_INDICATOR_TYPES.SI_NONE
      : SERVICE_INDICATOR_TYPES.SI_PAPER;
  }

  return caseDetail;
};

module.exports = {
  setServiceIndicatorsForCase,
};
