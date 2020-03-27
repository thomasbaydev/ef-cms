import { applicationContextForClient as applicationContext } from '../../../../../shared/src/business/test/createTestApplicationContext.js';
import { deleteUserCaseNoteAction } from './deleteUserCaseNoteAction';
import { presenter } from '../../presenter';

import { runAction } from 'cerebral/test';

describe('deleteUserCaseNoteAction', () => {
  beforeEach(() => {
    presenter.providers.applicationContext = applicationContext;
  });

  it('deletes a case note', async () => {
    const result = await runAction(deleteUserCaseNoteAction, {
      modules: {
        presenter,
      },
      props: {
        caseId: 'case-id-123',
        trialSessionId: 'trial-session-id-123',
      },
    });

    expect(result.output).toMatchObject({
      userNote: {
        caseId: 'case-id-123',
        trialSessionId: 'trial-session-id-123',
      },
    });
    expect(
      applicationContext.getUseCases().deleteUserCaseNoteInteractor,
    ).toHaveBeenCalled();
  });
});
