# Operator Role Separation Standard

## Internal roles

- `SUPER_ADMIN`
- `OPERATOR`
- `REVIEWER`
- `COUNSEL`
- `FINANCE`
- `SPONSOR`
- `RESPONDENT`

## Boundaries

`SUPER_ADMIN`
- full oversight and delivery authority

`OPERATOR`
- review briefs
- approve / withhold
- move delivery state
- see internal warnings

`REVIEWER`
- review evidence
- inspect internal brief
- may not record delivery review decisions

`COUNSEL`
- may work assigned counsel cases
- may not create arbitrary counsel workflows
- may not approve delivery

`FINANCE`
- billing visibility only

`SPONSOR`
- client-safe only

`RESPONDENT`
- no sponsor or control-room access

## Current enforcement

- review-cycle preview requires oversight review permission
- delivery actions require oversight delivery permission
- counsel route requires counsel workflow permission
- counsel users are restricted to assigned workflows on the internal route
