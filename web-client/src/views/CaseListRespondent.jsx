import { Button } from '../ustc-ui/Button/Button';
import { CaseListRowExternal } from './CaseListRowExternal';
import { CaseSearchBox } from './CaseSearchBox';
import { Mobile, NonMobile } from '../ustc-ui/Responsive/Responsive';
import { Tab, Tabs } from '../ustc-ui/Tabs/Tabs';
import { connect } from '@cerebral/react';
import { sequences, state } from 'cerebral';
import React, { useEffect } from 'react';

export const CaseListRespondent = connect(
  {
    caseType: state.openClosedCases.caseType,
    clearOpenClosedCasesCurrentPageSequence:
      sequences.clearOpenClosedCasesCurrentPageSequence,
    closedTab: state.constants.EXTERNAL_USER_DASHBOARD_TABS.CLOSED,
    dashboardExternalHelper: state.dashboardExternalHelper,
    externalUserCasesHelper: state.externalUserCasesHelper,
    openTab: state.constants.EXTERNAL_USER_DASHBOARD_TABS.OPEN,
    setCaseTypeToDisplaySequence: sequences.setCaseTypeToDisplaySequence,
    showMoreClosedCasesSequence: sequences.showMoreClosedCasesSequence,
    showMoreOpenCasesSequence: sequences.showMoreOpenCasesSequence,
  },
  function CaseListRespondent({
    caseType,
    clearOpenClosedCasesCurrentPageSequence,
    closedTab,
    dashboardExternalHelper,
    externalUserCasesHelper,
    openTab,
    setCaseTypeToDisplaySequence,
    showMoreClosedCasesSequence,
    showMoreOpenCasesSequence,
  }) {
    useEffect(() => {
      return () => {
        clearOpenClosedCasesCurrentPageSequence();
      };
    }, []);

    const renderTable = (
      cases = [],
      showLoadMore,
      showMoreResultsSequence,
      tabName,
    ) => (
      <>
        {cases.length == 0 && <p>You have no {tabName.toLowerCase()} cases.</p>}
        {cases.length > 0 && (
          <table
            className="usa-table responsive-table dashboard"
            id="case-list"
          >
            <thead>
              <tr>
                <th>
                  <span className="usa-sr-only">Lead Case Indicator</span>
                </th>
                <th>Docket number</th>
                <th>Case title</th>
                <th>Date filed</th>
              </tr>
            </thead>
            <tbody>
              {cases.map(item => (
                <CaseListRowExternal
                  onlyLinkIfRequestedUserAssociated
                  formattedCase={item}
                  key={item.docketNumber}
                />
              ))}
            </tbody>
          </table>
        )}
        {showLoadMore && (
          <Button
            secondary
            className="margin-bottom-20"
            onClick={() => {
              showMoreResultsSequence();
            }}
          >
            Load More
          </Button>
        )}
      </>
    );

    return (
      <>
        <NonMobile>
          <div className="grid-container padding-x-0">
            <div className="grid-row grid-gap">
              <div className="grid-col-8">
                <Tabs
                  bind="currentViewMetadata.caseList.tab"
                  className="classic-horizontal-header3 no-border-bottom"
                  defaultActiveTab={openTab}
                >
                  <Tab
                    id="tab-open"
                    tabName="Open"
                    title={`Open Cases (${externalUserCasesHelper.openCasesCount})`}
                  >
                    {renderTable(
                      externalUserCasesHelper.openCaseResults,
                      externalUserCasesHelper.showLoadMoreOpenCases,
                      showMoreOpenCasesSequence,
                      openTab,
                    )}
                  </Tab>
                  <Tab
                    id="tab-closed"
                    tabName="Closed"
                    title={`Closed Cases (${externalUserCasesHelper.closedCasesCount})`}
                  >
                    {renderTable(
                      externalUserCasesHelper.closedCaseResults,
                      externalUserCasesHelper.showLoadMoreClosedCases,
                      showMoreClosedCasesSequence,
                      closedTab,
                    )}
                  </Tab>
                </Tabs>
              </div>
              <div className="grid-col-4">
                {dashboardExternalHelper.showCaseSearch && <CaseSearchBox />}
              </div>
            </div>
          </div>
        </NonMobile>
        <Mobile>
          <div className="grid-container padding-x-0">
            <div className="grid-row">
              <select
                aria-label="additional case info"
                className="usa-select"
                id="mobile-case-type-tab-selector"
                onChange={e => {
                  setCaseTypeToDisplaySequence({ tabName: e.target.value });
                }}
              >
                <option value={openTab}>
                  Open Cases ({externalUserCasesHelper.openCasesCount})
                </option>
                <option value={closedTab}>
                  Closed Cases ({externalUserCasesHelper.closedCasesCount})
                </option>
              </select>
            </div>
            <div className="grid-row margin-top-1">
              {caseType === closedTab &&
                renderTable(
                  externalUserCasesHelper.closedCaseResults,
                  externalUserCasesHelper.showLoadMoreClosedCases,
                  showMoreClosedCasesSequence,
                  closedTab,
                )}
              {caseType === openTab &&
                renderTable(
                  externalUserCasesHelper.openCaseResults,
                  externalUserCasesHelper.showLoadMoreOpenCases,
                  showMoreOpenCasesSequence,
                  openTab,
                )}
            </div>
            <div className="grid-row display-block">
              {dashboardExternalHelper.showCaseSearch && <CaseSearchBox />}
            </div>
          </div>
        </Mobile>
      </>
    );
  },
);
