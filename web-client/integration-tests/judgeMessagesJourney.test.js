import { judgeViewsCaseDetail } from './journey/judgeViewsCaseDetail';
import { judgeViewsDashboardMessages } from './journey/judgeViewsDashboardMessages';
import { loginAs, setupTest, uploadPetition } from './helpers';
import { userSendsMessageToJudge } from './journey/userSendsMessageToJudge';

const test = setupTest();

describe('Judge messages journey', () => {
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

  const message1Subject = `message 1 ${Date.now()}`;
  const message2Subject = `message 2 ${Date.now()}`;

  loginAs(test, 'petitionsclerk@example.com');
  userSendsMessageToJudge(test, message1Subject);

  loginAs(test, 'docketclerk@example.com');
  userSendsMessageToJudge(test, message2Subject);

  loginAs(test, 'judgeColvin@example.com');
  judgeViewsDashboardMessages(test, [message1Subject, message2Subject]);
  judgeViewsCaseDetail(test);
});
