import { camelCase, pickBy } from 'lodash';
import {
  compareCasesByDocketNumber,
  formatCase,
} from './formattedTrialSessionDetails';
import { state } from 'cerebral';

const compareCasesByPractitioner = (a, b) => {
  const aCount = (a.practitioners && a.practitioners.length && 1) || 0;
  const bCount = (b.practitioners && b.practitioners.length && 1) || 0;

  return aCount - bCount;
};

export const trialSessionWorkingCopyHelper = (get, applicationContext) => {
  const { TRIAL_STATUS_TYPES } = get(state.constants);
  const trialSession = get(state.trialSession) || {};
  const { filters, sort, sortOrder } = get(state.trialSessionWorkingCopy) || {};
  const caseMetadata = get(state.trialSessionWorkingCopy.caseMetadata) || {};

  const formatCaseName = myCase => {
    myCase.caseName = applicationContext.getCaseCaptionNames(
      myCase.caseCaption || '',
    );
    return myCase;
  };

  //get an array of strings of the trial statuses that are set to true
  const trueFilters = Object.keys(pickBy(filters));

  let formattedCases = (trialSession.calendaredCases || [])
    .filter(
      calendaredCase =>
        (trueFilters.includes('statusUnassigned') &&
          (!caseMetadata[calendaredCase.docketNumber] ||
            !caseMetadata[calendaredCase.docketNumber].trialStatus)) ||
        (caseMetadata[calendaredCase.docketNumber] &&
          trueFilters.includes(
            caseMetadata[calendaredCase.docketNumber].trialStatus,
          )),
    )
    .map(formatCase)
    .map(formatCaseName)
    .sort(compareCasesByDocketNumber);

  const casesShownCount = formattedCases.length;

  if (sort === 'practitioner') {
    formattedCases = formattedCases.sort(compareCasesByPractitioner);
  }

  if (sortOrder === 'desc') {
    formattedCases = formattedCases.slice().reverse();
  }

  const trialStatusOptions = TRIAL_STATUS_TYPES.map(value => ({
    key: camelCase(value),
    value,
  }));

  return {
    casesShownCount,
    formattedCases,
    title: trialSession.title || 'Birmingham, Alabama',
    trialStatusOptions,
  };
};
