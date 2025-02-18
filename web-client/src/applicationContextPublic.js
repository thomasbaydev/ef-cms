import {
  CASE_CAPTION_POSTFIX,
  CASE_SEARCH_PAGE_SIZE,
  COUNTRY_TYPES,
  DOCKET_NUMBER_SUFFIXES,
  DOCUMENT_PROCESSING_STATUS_OPTIONS,
  EVENT_CODES_VISIBLE_TO_PUBLIC,
  INITIAL_DOCUMENT_TYPES,
  MAX_SEARCH_RESULTS,
  OBJECTIONS_OPTIONS_MAP,
  OPINION_EVENT_CODES_WITH_BENCH_OPINION,
  ORDER_EVENT_CODES,
  ROLES,
  STIPULATED_DECISION_EVENT_CODE,
  TODAYS_ORDERS_SORTS,
  TODAYS_ORDERS_SORT_DEFAULT,
  TRANSCRIPT_EVENT_CODE,
  US_STATES,
  US_STATES_OTHER,
} from '../../shared/src/business/entities/EntityConstants';
import {
  Case,
  getContactPrimary,
  getContactSecondary,
} from '../../shared/src/business/entities/cases/Case';
import { casePublicSearchInteractor } from '../../shared/src/proxies/casePublicSearchProxy';
import { compareCasesByDocketNumber } from '../../shared/src/business/utilities/getFormattedTrialSessionDetails';
import {
  createISODateString,
  formatDateString,
} from '../../shared/src/business/utilities/DateHandler';
import {
  formatDocketEntry,
  sortDocketEntries,
} from '../../shared/src/business/utilities/getFormattedCaseDetail';
import { generatePublicDocketRecordPdfInteractor } from '../../shared/src/proxies/public/generatePublicDocketRecordPdfProxy';
import { getCaseForPublicDocketSearchInteractor } from '../../shared/src/proxies/public/getCaseForPublicDocketNumberSearchProxy';
import {
  getCognitoLoginUrl,
  getPublicSiteUrl,
} from '../../shared/src/sharedAppContext.js';
import { getDocumentDownloadUrlInteractor } from '../../shared/src/proxies/getDocumentDownloadUrlProxy';
import { getHealthCheckInteractor } from '../../shared/src/proxies/health/getHealthCheckProxy';
import { getJudgeLastName } from '../../shared/src/business/utilities/getFormattedJudgeName';
import { getPublicCaseInteractor } from '../../shared/src/proxies/getPublicCaseProxy';
import { getPublicJudgesInteractor } from '../../shared/src/proxies/public/getPublicJudgesProxy';
import { getTodaysOpinionsInteractor } from '../../shared/src/proxies/public/getTodaysOpinionsProxy';
import { getTodaysOrdersInteractor } from '../../shared/src/proxies/public/getTodaysOrdersProxy';
import { opinionPublicSearchInteractor } from '../../shared/src/proxies/opinionPublicSearchProxy';
import { orderPublicSearchInteractor } from '../../shared/src/proxies/orderPublicSearchProxy';
import { tryCatchDecorator } from './tryCatchDecorator';
import { validateCaseAdvancedSearchInteractor } from '../../shared/src/business/useCases/validateCaseAdvancedSearchInteractor';
import { validateOpinionAdvancedSearchInteractor } from '../../shared/src/business/useCases/validateOpinionAdvancedSearchInteractor';
import { validateOrderAdvancedSearchInteractor } from '../../shared/src/business/useCases/validateOrderAdvancedSearchInteractor';
import axios from 'axios';
import deepFreeze from 'deep-freeze';

const ADVANCED_SEARCH_TABS = {
  CASE: 'case',
  OPINION: 'opinion',
  ORDER: 'order',
};

const allUseCases = {
  casePublicSearchInteractor,
  generatePublicDocketRecordPdfInteractor,
  getCaseForPublicDocketSearchInteractor,
  getCaseInteractor: getPublicCaseInteractor,
  getDocumentDownloadUrlInteractor,
  getHealthCheckInteractor,
  getPublicJudgesInteractor,
  getTodaysOpinionsInteractor,
  getTodaysOrdersInteractor,
  opinionPublicSearchInteractor,
  orderPublicSearchInteractor,
  validateCaseAdvancedSearchInteractor,
  validateOpinionAdvancedSearchInteractor,
  validateOrderAdvancedSearchInteractor,
};
tryCatchDecorator(allUseCases);

const frozenConstants = deepFreeze({
  ADVANCED_SEARCH_TABS,
  CASE_CAPTION_POSTFIX,
  CASE_SEARCH_PAGE_SIZE,
  COUNTRY_TYPES,
  DOCKET_NUMBER_SUFFIXES,
  DOCUMENT_PROCESSING_STATUS_OPTIONS,
  EVENT_CODES_VISIBLE_TO_PUBLIC,
  INITIAL_DOCUMENT_TYPES,
  MAX_SEARCH_RESULTS,
  OBJECTIONS_OPTIONS_MAP,
  OPINION_EVENT_CODES_WITH_BENCH_OPINION,
  ORDER_EVENT_CODES,
  STIPULATED_DECISION_EVENT_CODE,
  TODAYS_ORDERS_SORT_DEFAULT,
  TODAYS_ORDERS_SORTS,
  TRANSCRIPT_EVENT_CODE,
  US_STATES,
  US_STATES_OTHER,
  USER_ROLES: ROLES,
});

const applicationContextPublic = {
  getBaseUrl: () => {
    return process.env.API_URL || 'http://localhost:5000';
  },
  getCaseTitle: Case.getCaseTitle,
  getCognitoLoginUrl,
  getConstants: () => frozenConstants,
  getCurrentUser: () => ({}),
  getCurrentUserToken: () => null,
  getEnvironment: () => ({
    stage: process.env.STAGE || 'local',
  }),
  getHttpClient: () => axios,
  getLogger: () => ({
    error: () => {
      // eslint-disable-next-line no-console
      // console.error(value);
    },
    info: (key, value) => {
      // eslint-disable-next-line no-console
      console.info(key, JSON.stringify(value));
    },
    time: key => {
      // eslint-disable-next-line no-console
      console.time(key);
    },
    timeEnd: key => {
      // eslint-disable-next-line no-console
      console.timeEnd(key);
    },
  }),
  getPublicSiteUrl,
  getUseCases: () => allUseCases,
  getUtilities: () => {
    return {
      compareCasesByDocketNumber,
      createISODateString,
      formatDateString,
      formatDocketEntry,
      getContactPrimary,
      getContactSecondary,
      getJudgeLastName,
      sortDocketEntries,
    };
  },
};

export { applicationContextPublic };
