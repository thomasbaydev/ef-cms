const {
  applicationContext,
} = require('../../test/createTestApplicationContext');
const {
  validatePractitionerInteractor,
} = require('./validatePractitionerInteractor');
const { ROLES, US_STATES } = require('../../entities/EntityConstants');

describe('validatePractitionerInteractor', () => {
  it('returns the expected errors object on an empty practitioner', () => {
    const errors = validatePractitionerInteractor({
      applicationContext,
      practitioner: {},
    });

    expect(Object.keys(errors)).toEqual([
      'role',
      'userId',
      'admissionsDate',
      'admissionsStatus',
      'barNumber',
      'birthYear',
      'employer',
      'firstName',
      'lastName',
      'originalBarState',
      'practitionerType',
    ]);
  });

  it('returns null on no errors', () => {
    const errors = validatePractitionerInteractor({
      applicationContext,
      practitioner: {
        admissionsDate: '2019-03-01T21:40:46.415Z',
        admissionsStatus: 'Active',
        barNumber: 'PT7890',
        birthYear: '2009',
        employer: 'IRS',
        firstName: 'Test',
        lastName: 'Practitioner',
        originalBarState: US_STATES.TX,
        practitionerType: 'Attorney',
        role: ROLES.privatePractitioner,
        userId: '195e31b6-20f7-4fa4-980e-4236b771cced',
      },
    });

    expect(errors).toBeNull();
  });
});
