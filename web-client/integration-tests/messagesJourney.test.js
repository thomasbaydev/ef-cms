import { docketClerkAddsDocketEntryFromMessage } from './journey/docketClerkAddsDocketEntryFromMessage';
import { docketClerkAppliesSignatureFromMessage } from './journey/docketClerkAppliesSignatureFromMessage';
import { docketClerkCompletesMessageThread } from './journey/docketClerkCompletesMessageThread';
import { docketClerkEditsOrderFromMessage } from './journey/docketClerkEditsOrderFromMessage';
import { docketClerkEditsSignatureFromMessage } from './journey/docketClerkEditsSignatureFromMessage';
import { docketClerkViewsCompletedMessagesOnCaseDetail } from './journey/docketClerkViewsCompletedMessagesOnCaseDetail';
import { docketClerkViewsForwardedMessageInInbox } from './journey/docketClerkViewsForwardedMessageInInbox';
import { fakeFile, loginAs, setupTest, uploadPetition } from './helpers';
import { petitionsClerk1CreatesNoticeFromMessageDetail } from './journey/petitionsClerk1CreatesNoticeFromMessageDetail';
import { petitionsClerk1RepliesToMessage } from './journey/petitionsClerk1RepliesToMessage';
import { petitionsClerk1ViewsMessageDetail } from './journey/petitionsClerk1ViewsMessageDetail';
import { petitionsClerk1ViewsMessageInbox } from './journey/petitionsClerk1ViewsMessageInbox';
import { petitionsClerkCreatesNewMessageOnCase } from './journey/petitionsClerkCreatesNewMessageOnCase';
import { petitionsClerkCreatesNewMessageOnCaseWithMaxAttachments } from './journey/petitionsClerkCreatesNewMessageOnCaseWithMaxAttachments';
import { petitionsClerkCreatesOrderFromMessage } from './journey/petitionsClerkCreatesOrderFromMessage';
import { petitionsClerkForwardsMessageToDocketClerk } from './journey/petitionsClerkForwardsMessageToDocketClerk';
import { petitionsClerkViewsInProgressMessagesOnCaseDetail } from './journey/petitionsClerkViewsInProgressMessagesOnCaseDetail';
import { petitionsClerkViewsReplyInInbox } from './journey/petitionsClerkViewsReplyInInbox';
import { petitionsClerkViewsSentMessagesBox } from './journey/petitionsClerkViewsSentMessagesBox';

const test = setupTest({
  useCases: {
    loadPDFForSigningInteractor: () => Promise.resolve(null),
  },
});

describe('messages journey', () => {
  beforeAll(() => {
    jest.setTimeout(40000);
    global.window.pdfjsObj = {
      getData: () => Promise.resolve(new Uint8Array(fakeFile)),
    };
  });

  loginAs(test, 'petitioner@example.com');
  it('Create test case to send messages', async () => {
    const caseDetail = await uploadPetition(test);
    expect(caseDetail.docketNumber).toBeDefined();
    test.docketNumber = caseDetail.docketNumber;
    test.documentId = caseDetail.documents[0].documentId;
    test.caseId = caseDetail.caseId;
  });

  loginAs(test, 'petitionsclerk@example.com');
  petitionsClerkCreatesNewMessageOnCaseWithMaxAttachments(test);
  petitionsClerkCreatesNewMessageOnCase(test);
  petitionsClerkViewsSentMessagesBox(test);

  loginAs(test, 'petitionsclerk1@example.com');
  petitionsClerk1ViewsMessageInbox(test);
  petitionsClerk1ViewsMessageDetail(test);
  petitionsClerk1RepliesToMessage(test);

  loginAs(test, 'petitionsclerk@example.com');
  petitionsClerkViewsReplyInInbox(test);
  petitionsClerkCreatesOrderFromMessage(test);
  petitionsClerkForwardsMessageToDocketClerk(test);
  petitionsClerkViewsInProgressMessagesOnCaseDetail(test);

  loginAs(test, 'docketclerk@example.com');
  docketClerkViewsForwardedMessageInInbox(test);
  docketClerkEditsOrderFromMessage(test);
  docketClerkAppliesSignatureFromMessage(test);
  docketClerkEditsSignatureFromMessage(test);
  docketClerkAddsDocketEntryFromMessage(test);
  docketClerkCompletesMessageThread(test);
  docketClerkViewsCompletedMessagesOnCaseDetail(test);

  loginAs(test, 'petitionsclerk1@example.com');
  petitionsClerkCreatesNewMessageOnCaseWithMaxAttachments(test);
  petitionsClerkCreatesNewMessageOnCase(test);
  petitionsClerk1ViewsMessageInbox(test);
  petitionsClerk1ViewsMessageDetail(test);
  petitionsClerk1CreatesNoticeFromMessageDetail(test);
});
