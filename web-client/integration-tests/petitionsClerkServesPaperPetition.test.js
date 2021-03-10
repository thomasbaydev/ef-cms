import { createNewMessageOnCase } from './journey/createNewMessageOnCase';
import { fakeFile, loginAs, setupTest, uploadPetition } from './helpers';
import { petitionsClerk1ServesPetitionFromMessageDetail } from './journey/petitionsClerk1ServesPetitionFromMessageDetail';
import { petitionsClerk1ViewsMessageDetail } from './journey/petitionsClerk1ViewsMessageDetail';
import { petitionsClerk1ViewsMessageInbox } from './journey/petitionsClerk1ViewsMessageInbox';
import { petitionsClerkCreatesNewCaseFromPaper } from './journey/petitionsClerkCreatesNewCaseFromPaper';
import { petitionsClerkServesPetitionFromDocumentView } from './journey/petitionsClerkServesPetitionFromDocumentView';

const test = setupTest();
test.draftOrders = [];

describe('Petitions Clerk Serves Paper Petition From Message Detail & Document View', () => {
  beforeAll(() => {
    jest.setTimeout(40000);
  });

  afterAll(() => {
    test.closeSocket();
  });

  loginAs(test, 'petitionsclerk@example.com');
  petitionsClerkCreatesNewCaseFromPaper(test, fakeFile);
  createNewMessageOnCase(test);

  loginAs(test, 'petitionsclerk1@example.com');
  petitionsClerk1ViewsMessageInbox(test);
  petitionsClerk1ViewsMessageDetail(test);
  petitionsClerk1ServesPetitionFromMessageDetail(test);

  loginAs(test, 'petitioner@example.com');
  it('Create case', async () => {
    const caseDetail = await uploadPetition(test);
    expect(caseDetail.docketNumber).toBeDefined();
    test.docketNumber = caseDetail.docketNumber;
  });

  loginAs(test, 'petitionsclerk@example.com');
  petitionsClerkServesPetitionFromDocumentView(test);
});
