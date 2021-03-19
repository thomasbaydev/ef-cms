import { clearErrorAlertsAction } from '../actions/clearErrorAlertsAction';
import { clearSelectedWorkItemsAction } from '../actions/clearSelectedWorkItemsAction';
import { closeMobileMenuAction } from '../actions/closeMobileMenuAction';
import { getConstants } from '../../getConstants';
import { getInboxMessagesForUserAction } from '../actions/getInboxMessagesForUserAction';
import { getJudgeForCurrentUserAction } from '../actions/getJudgeForCurrentUserAction';
import { getOpenAndClosedCasesByUserAction } from '../actions/caseConsolidation/getOpenAndClosedCasesByUserAction';
import { getTrialSessionsAction } from '../actions/TrialSession/getTrialSessionsAction';
import { getUserAction } from '../actions/getUserAction';
import { isLoggedInAction } from '../actions/isLoggedInAction';
import { navigateToMessagesAction } from '../actions/navigateToMessagesAction';
import { navigateToSectionDocumentQCAction } from '../actions/navigateToSectionDocumentQCAction';
import { redirectToCognitoAction } from '../actions/redirectToCognitoAction';
import { runPathForUserRoleAction } from '../actions/runPathForUserRoleAction';
import { setCasesAction } from '../actions/setCasesAction';
import { setCurrentPageAction } from '../actions/setCurrentPageAction';
import { setDefaultCaseTypeToDisplayAction } from '../actions/setDefaultCaseTypeToDisplayAction';
import { setJudgeUserAction } from '../actions/setJudgeUserAction';
import { setMessageInboxPropsAction } from '../actions/setMessageInboxPropsAction';
import { setMessagesAction } from '../actions/setMessagesAction';
import { setTrialSessionsAction } from '../actions/TrialSession/setTrialSessionsAction';
import { setUserAction } from '../actions/setUserAction';
import { startWebSocketConnectionAction } from '../actions/webSocketConnection/startWebSocketConnectionAction';
import { takePathForRoles } from './takePathForRoles';

const { USER_ROLES } = getConstants();

const proceedToMessages = [navigateToMessagesAction];

const getMessages = [getInboxMessagesForUserAction, setMessagesAction];

const goToDashboard = [
  setCurrentPageAction('Interstitial'),
  closeMobileMenuAction,
  getUserAction,
  setUserAction,
  clearSelectedWorkItemsAction,
  clearErrorAlertsAction,
  runPathForUserRoleAction,
  {
    ...takePathForRoles(
      [
        USER_ROLES.adc,
        USER_ROLES.admin,
        USER_ROLES.admissionsClerk,
        USER_ROLES.clerkOfCourt,
        USER_ROLES.docketClerk,
        USER_ROLES.floater,
        USER_ROLES.petitionsClerk,
        USER_ROLES.reportersOffice,
        USER_ROLES.trialClerk,
      ],
      proceedToMessages,
    ),
    chambers: [
      setMessageInboxPropsAction,
      getMessages,
      getJudgeForCurrentUserAction,
      setJudgeUserAction,
      getTrialSessionsAction,
      setTrialSessionsAction,
      setCurrentPageAction('DashboardChambers'),
    ],
    general: [navigateToSectionDocumentQCAction],
    inactivePractitioner: [setCurrentPageAction('DashboardInactive')],
    irsPractitioner: [
      startWebSocketConnectionAction,
      {
        error: [
          setDefaultCaseTypeToDisplayAction,
          getOpenAndClosedCasesByUserAction,
          setCasesAction,
          setCurrentPageAction('DashboardRespondent'),
        ],
        success: [
          setDefaultCaseTypeToDisplayAction,
          getOpenAndClosedCasesByUserAction,
          setCasesAction,
          setCurrentPageAction('DashboardRespondent'),
        ],
      },
    ],
    irsSuperuser: [setCurrentPageAction('DashboardIrsSuperuser')],
    judge: [
      setMessageInboxPropsAction,
      getMessages,
      getTrialSessionsAction,
      setTrialSessionsAction,
      setCurrentPageAction('DashboardJudge'),
    ],
    petitioner: [
      setDefaultCaseTypeToDisplayAction,
      getOpenAndClosedCasesByUserAction,
      setCasesAction,
      setCurrentPageAction('DashboardPetitioner'),
    ],
    privatePractitioner: [
      startWebSocketConnectionAction,
      {
        error: [
          setDefaultCaseTypeToDisplayAction,
          getOpenAndClosedCasesByUserAction,
          setCasesAction,
          setCurrentPageAction('DashboardPractitioner'),
        ],
        success: [
          setDefaultCaseTypeToDisplayAction,
          getOpenAndClosedCasesByUserAction,
          setCasesAction,
          setCurrentPageAction('DashboardPractitioner'),
        ],
      },
    ],
  },
];

export const gotoDashboardSequence = [
  isLoggedInAction,
  {
    isLoggedIn: [goToDashboard],
    unauthorized: [redirectToCognitoAction],
  },
];
