import { connect } from '@cerebral/react';
import React from 'react';
import { state } from 'cerebral';

/**
 * Footer
 */
export default connect(
  {
    caseList: state.cases,
  },
  function CaseList({ caseList }) {
    return (
      <table className="responsive-table">
        <thead>
          <tr>
            <th>Docket number</th>
            <th>Date filed</th>
            <th>Petitioner name</th>
          </tr>
        </thead>
        <tbody>
          {caseList.map(item => (
            <tr key={item.docketNumber}>
              <td className="responsive-title">
                <span className="responsive-label">Docket number</span>
                <a href={'/case-detail/' + item.caseId}>{item.docketNumber}</a>
              </td>
              <td>
                <span className="responsive-label">Date filed</span>
                {item.createdAt}
              </td>
              <td>
                <span className="responsive-label">Petitioner name</span>
                Taxpayer TBD
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
);
