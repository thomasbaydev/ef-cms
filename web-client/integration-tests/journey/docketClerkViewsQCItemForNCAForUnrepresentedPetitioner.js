import { formattedWorkQueue as formattedWorkQueueComputed } from '../../src/presenter/computeds/formattedWorkQueue';
import { runCompute } from 'cerebral/test';
import { withAppContextDecorator } from '../../src/withAppContext';

const formattedWorkQueue = withAppContextDecorator(formattedWorkQueueComputed);

export const docketClerkViewsQCItemForNCAForUnrepresentedPetitioner = test => {
  return it('Docket clerk views QC item for NCA for unrepresented petitioner', async () => {
    await test.runSequence('chooseWorkQueueSequence', {
      box: 'inbox',
      queue: 'section',
    });
    const workQueueFormatted = runCompute(formattedWorkQueue, {
      state: test.getState(),
    });

    const noticeOfChangeOfAddressQCItem = workQueueFormatted.find(
      workItem => workItem.docketNumber === test.docketNumber,
    );

    expect(noticeOfChangeOfAddressQCItem).toMatchObject({
      docketEntry: {
        documentType: 'Notice of Change of Address',
      },
    });
  });
};
