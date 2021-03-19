---
name: USTC Story Template
about: Document stories for the USTC project
title: ''
labels: ''
assignees: ''

---

## Pre-Conditions

## Acceptance Criteria

## Mobile Design/Considerations


## Security Considerations
 - [ ] Does this work make you nervous about privacy or security?
 - [ ] Does this work make major changes to the system?
 - [ ] Does this work implement new authentication or security controls?
 - [ ] Does this work create new methods of authentication, modify existing security controls, or explicitly implement any security or privacy features?


## Notes


## Tasks

## Definition of Done (Updated 2-23-21)
**Product Owner**
 - [ ]  Acceptance criteria have been met and validated on the Flexion mig env

**UX**
 - [ ] Business test scenarios to meet all acceptance criteria have been written
 - [ ] Usability has been validated
 - [ ] Wiki has been updated (if applicable) 
 - [ ] Story has been tested on a mobile device (for external users only)
 - [ ] Add scenario to testing document, if applicable (https://docs.google.com/spreadsheets/d/1FUHKC_YrT-PosaWD5gRVmsDzI1HS_U-8CyMIb-qX9EA/edit?usp=sharing)

**Engineering**
 - [ ] Automated test scripts have been written
 - [ ] Field level and page level validation errors (front-end and server-side) integrated and functioning
 - [ ] Verify that language for docket record for internal users and external users is identical
 - [ ] New screens have been added to pa11y scripts
 - [ ] All new functionality verified to work with keyboard and macOS voiceover https://www.apple.com/voiceover/info/guide/_1124.html 
 - [ ] READMEs, other appropriate docs, JSDocs and swagger/APIs fully updated
 - [ ] UI should be touch optimized and responsive for external only (functions on supported mobile devices and optimized for screen sizes as required)
 - [ ] Module dependencies are up-to-date and are at the latest resolvable version (npm update)
 - [ ] Errors in Sonarcloud are fixed https://sonarcloud.io/organizations/flexion-github/projects
 - [ ] Lambdas include CloudWatch logging of users, inputs and outputs
 - [ ] Interactors should validate entities before calling persistence methods
 - [ ] Code refactored for clarity and to remove any known technical debt
 - [ ] Rebuild entity documentation
 - [ ] Acceptance criteria for the story has been met
 - [ ] Deployed to the dev environment
 - [ ] Deployed to the Court's migration environment

 **Review Steps**
 1. Finish all other DOD
 2. Deploy to the dev environment
 3. Engineers add `Needs UX Review` label
 4. UX Review on dev environment (if feedback, implement and go back to step 2)
 5. UX add `Needs Migration Deploy` label
 6. Deploy to the Court's migration environment
 7. Engineers go through test scenarios on Court's migration environment
 8. Engineers add `Needs PO Review` label and move to Review/QA column
 9. PO review (if feedback, implement and go back to step 2)
