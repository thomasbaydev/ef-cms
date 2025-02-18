import { MOCK_CASE } from '../../../../../shared/src/test/mockCase';
import { applicationContextForClient as applicationContext } from '../../../../../shared/src/business/test/createTestApplicationContext';
import { presenter } from '../../presenter-mock';
import { runAction } from 'cerebral/test';
import { submitRespondentCaseAssociationRequestAction } from './submitRespondentCaseAssociationRequestAction';

describe('submitRespondentCaseAssociationRequestAction', () => {
  const { USER_ROLES } = applicationContext.getConstants();
  const mockDocketNumber = '105-20';

  presenter.providers.applicationContext = applicationContext;

  it('should not call submitCaseAssociationRequestInteractor when the logged in user is not an IRS practitioner', async () => {
    applicationContext.getCurrentUser.mockReturnValue({
      role: USER_ROLES.docketClerk,
    });

    await runAction(submitRespondentCaseAssociationRequestAction, {
      modules: { presenter },
      state: {
        caseDetail: {
          docketNumber: mockDocketNumber,
        },
      },
    });

    expect(
      applicationContext.getUseCases().submitCaseAssociationRequestInteractor,
    ).not.toHaveBeenCalled();
  });

  it('should call submitCaseAssociationRequestInteractor when the logged in user is not an IRS practitioner', async () => {
    applicationContext.getCurrentUser.mockReturnValue({
      role: USER_ROLES.irsPractitioner,
    });

    await runAction(submitRespondentCaseAssociationRequestAction, {
      modules: { presenter },
      state: {
        caseDetail: {
          docketNumber: mockDocketNumber,
        },
      },
    });

    expect(
      applicationContext.getUseCases().submitCaseAssociationRequestInteractor,
    ).toHaveBeenCalled();
  });

  it('should return the updated case as props', async () => {
    applicationContext
      .getUseCases()
      .submitCaseAssociationRequestInteractor.mockResolvedValue(MOCK_CASE);

    applicationContext.getCurrentUser.mockReturnValue({
      role: USER_ROLES.irsPractitioner,
    });

    const { output } = await runAction(
      submitRespondentCaseAssociationRequestAction,
      {
        modules: { presenter },
        state: {
          caseDetail: {
            docketNumber: mockDocketNumber,
          },
        },
      },
    );

    expect(output).toEqual(expect.objectContaining(MOCK_CASE));
  });
});
