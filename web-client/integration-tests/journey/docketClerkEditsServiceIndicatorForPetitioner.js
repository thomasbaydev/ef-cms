import { SERVICE_INDICATOR_TYPES } from '../../../shared/src/business/entities/EntityConstants';
import { contactPrimaryFromState } from '../helpers';

export const docketClerkEditsServiceIndicatorForPetitioner = (
  test,
  expectedServiceIndicator = null,
) => {
  return it('docket clerk edits service indicator for a petitioner', async () => {
    await test.runSequence('gotoEditPetitionerInformationSequence', {
      docketNumber: test.docketNumber,
    });

    expect(test.getState('form.contactPrimary.serviceIndicator')).toEqual(
      expectedServiceIndicator || SERVICE_INDICATOR_TYPES.SI_NONE,
    );

    await test.runSequence('updateFormValueSequence', {
      key: 'contactPrimary.serviceIndicator',
      value: SERVICE_INDICATOR_TYPES.SI_ELECTRONIC,
    });

    if (!expectedServiceIndicator) {
      await test.runSequence('updatePetitionerInformationFormSequence');
      expect(test.getState('validationErrors')).toMatchObject({
        contactPrimary: {
          serviceIndicator: expect.anything(),
        },
      });

      const contactPrimary = contactPrimaryFromState(test);

      expect(contactPrimary.serviceIndicator).toEqual(
        SERVICE_INDICATOR_TYPES.SI_NONE,
      );
    }

    await test.runSequence('updateFormValueSequence', {
      key: 'contactPrimary.serviceIndicator',
      value: SERVICE_INDICATOR_TYPES.SI_PAPER,
    });

    await test.runSequence('updatePetitionerInformationFormSequence');

    const contactPrimary = contactPrimaryFromState(test);

    expect(contactPrimary.serviceIndicator).toEqual(
      SERVICE_INDICATOR_TYPES.SI_PAPER,
    );
  });
};
