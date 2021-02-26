const {
  courtIssuedDocumentDecorator,
  CourtIssuedDocumentDefault,
} = require('./CourtIssuedDocumentDefault');
const {
  JoiValidationConstants,
} = require('../../../utilities/JoiValidationConstants');
const {
  joiValidationDecorator,
  validEntityDecorator,
} = require('../../../utilities/JoiValidationDecorator');
const { formatDateString } = require('../../utilities/DateHandler');
const { replaceBracketed } = require('../../utilities/replaceBracketed');
const { VALIDATION_ERROR_MESSAGES } = require('./CourtIssuedDocumentConstants');

/**
 *
 * @param {object} rawProps the raw document data
 * @constructor
 */
function CourtIssuedDocumentTypeG() {}
CourtIssuedDocumentTypeG.prototype.init = function init(rawProps) {
  courtIssuedDocumentDecorator(this, rawProps);
  this.date = rawProps.date;
  this.trialLocation = rawProps.trialLocation;
};

CourtIssuedDocumentTypeG.prototype.getDocumentTitle = function () {
  return replaceBracketed(
    this.documentTitle,
    formatDateString(this.date, 'MM-DD-YYYY'),
    this.trialLocation,
  );
};

CourtIssuedDocumentTypeG.schema = {
  ...CourtIssuedDocumentDefault.schema,
  date: JoiValidationConstants.ISO_DATE.required(),
  trialLocation: JoiValidationConstants.STRING.required(),
};

joiValidationDecorator(
  CourtIssuedDocumentTypeG,
  CourtIssuedDocumentTypeG.schema,
  VALIDATION_ERROR_MESSAGES,
);

module.exports = {
  CourtIssuedDocumentTypeG: validEntityDecorator(CourtIssuedDocumentTypeG),
};
