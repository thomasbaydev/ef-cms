import { omit } from 'lodash';
import { state } from 'cerebral';

export const aggregateStatisticsErrors = ({ errors, get }) => {
  let newErrorStatistics;

  Object.keys(errors).forEach(key => {
    if (/statistics\[\d+\]/.test(errors[key])) {
      delete errors[key];
    }
  });
  if (errors.statistics) {
    newErrorStatistics = [];
    const formStatistics = get(state.form.statistics);

    formStatistics.forEach((formStatistic, index) => {
      const errorStatistic = errors.statistics.find(s => s.index === index);
      if (errorStatistic) {
        if (formStatistic.yearOrPeriod === 'Year') {
          newErrorStatistics.push({
            enterAllValues:
              'Enter year, deficiency amount, and total penalties',
            index,
          });
        } else {
          newErrorStatistics.push({
            enterAllValues:
              'Enter period, deficiency amount, and total penalties',
            index,
          });
        }
      } else {
        newErrorStatistics.push({});
      }
    });

    errors.statistics = newErrorStatistics;
  }
  return errors;
};

export const aggregatePetitionerErrors = ({ errors }) => {
  if (errors?.petitioners) {
    errors.petitioners.forEach(e => {
      if (e.index === 0) {
        errors.contactPrimary = omit(e, 'index');
      } else {
        errors.contactSecondary = omit(e, 'index');
      }
    });
    delete errors.petitioners;
  }
  return errors;
};

/**
 * validates the petition.
 *
 * @param {object} providers the providers object
 * @param {object} providers.applicationContext the application context needed for getting the validatePetition use case
 * @param {object} providers.get the cerebral get function used for getting state.form
 * @param {object} providers.path the cerebral path which contains the next path in the sequence (path of success or error)
 * @param {object} providers.props the cerebral props object
 * @returns {object} the next path based on if validation was successful or error
 */
export const validatePetitionFromPaperAction = ({
  applicationContext,
  get,
  path,
  props,
}) => {
  const { petitionPaymentDate, petitionPaymentWaivedDate, receivedAt } = props;

  const form = get(state.form);

  let errors = applicationContext
    .getUseCases()
    .validatePetitionFromPaperInteractor({
      applicationContext,
      petition: {
        ...form,
        petitionPaymentDate,
        petitionPaymentWaivedDate,
        receivedAt,
      },
    });

  if (!errors) {
    return path.success();
  } else {
    const errorDisplayMap = {
      statistics: 'Statistics',
    };

    errors = aggregateStatisticsErrors({ errors, get });

    errors = aggregatePetitionerErrors({ errors });

    return path.error({
      alertError: {
        title: 'Errors were found. Please correct your form and resubmit.',
      },
      errorDisplayMap,
      errors,
    });
  }
};
