import { connect } from '@cerebral/react';
import { state } from 'cerebral';
import React from 'react';

export const CaseMessagesIndividualInbox = connect(
  { formattedMessages: state.formattedMessages },
  function CaseMessagesIndividualInbox({ formattedMessages }) {
    return (
      <>
        <table className="usa-table work-queue subsection">
          <thead>
            <tr>
              <th>Docket</th>
              <th>Received</th>
              <th>Message</th>
              <th>Case Status</th>
              <th>From</th>
              <th>Section</th>
              <th>Attachments</th>
            </tr>
          </thead>
          <tbody>
            {formattedMessages.map((message, idx) => {
              return (
                <tr key={idx}>
                  <td>Docket</td>
                  <td>{message.createdAtFormatted}</td>
                  <td>{message.message}</td>
                  <td>{message.caseStatus}</td>
                  <td>{message.from}</td>
                  <td>{message.fromSection}</td>
                  <td></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {formattedMessages.length === 0 && <div>There are no messages.</div>}
      </>
    );
  },
);
