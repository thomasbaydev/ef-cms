import { docketClerkCreatesATrialSession } from './journey/docketClerkCreatesATrialSession';
import { docketClerkRemovesCaseFromTrial } from './journey/docketClerkRemovesCaseFromTrial';
import { docketClerkViewsSectionInboxHighPriority } from './journey/docketClerkViewsSectionInboxHighPriority';
import { docketClerkViewsSectionInboxNotHighPriority } from './journey/docketClerkViewsSectionInboxNotHighPriority';
import { docketClerkViewsTrialSessionList } from './journey/docketClerkViewsTrialSessionList';
import {
  fakeFile,
  loginAs,
  refreshElasticsearchIndex,
  setupTest,
  uploadPetition,
  wait,
} from './helpers';
import { petitionerFilesDocumentForCase } from './journey/petitionerFilesDocumentForCase';
import { petitionsClerkSetsATrialSessionsSchedule } from './journey/petitionsClerkSetsATrialSessionsSchedule';

const test = setupTest();

describe('petitioner files document', () => {
  beforeAll(() => {
    jest.setTimeout(30000);
  });

  afterAll(() => {
    test.closeSocket();
  });

  loginAs(test, 'petitioner@example.com');
  it('Create case', async () => {
    const caseDetail = await uploadPetition(test);
    expect(caseDetail.docketNumber).toBeDefined();
    test.docketNumber = caseDetail.docketNumber;
  });

  const trialLocation = `Jacksonville, Florida, ${Date.now()}`;

  loginAs(test, 'docketclerk@example.com');
  docketClerkCreatesATrialSession(test, { trialLocation });
  docketClerkViewsTrialSessionList(test);

  loginAs(test, 'petitionsclerk@example.com');
  petitionsClerkSetsATrialSessionsSchedule(test);
  it('manually add the case to the session', async () => {
    await test.runSequence('gotoCaseDetailSequence', {
      docketNumber: test.docketNumber,
    });
    await test.runSequence('openAddToTrialModalSequence');
    await test.runSequence('updateModalValueSequence', {
      key: 'trialSessionId',
      value: test.trialSessionId,
    });

    await test.runSequence('addCaseToTrialSessionSequence');
    await wait(1000);
  });

  loginAs(test, 'petitioner@example.com');
  petitionerFilesDocumentForCase(test, fakeFile);

  loginAs(test, 'docketclerk@example.com');
  docketClerkViewsSectionInboxHighPriority(test);
  docketClerkRemovesCaseFromTrial(test);

  it('refresh elasticsearch index', async () => {
    await refreshElasticsearchIndex();
  });

  docketClerkViewsSectionInboxNotHighPriority(test);
});
