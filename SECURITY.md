# Security policy

## Supported versions

Ajora is pre-1.0. Security fixes are made on the active `dev` branch and the
latest published release. Older minor releases may not receive patches.

## Reporting a vulnerability

Do not open a public issue for a vulnerability or include exploit details in a
pull request.

Use GitHub's private vulnerability reporting flow when it is available on the
repository:

1. Open the repository's **Security** tab.
2. Select **Report a vulnerability**.
3. Include affected versions, impact, reproduction steps, and any suggested
   mitigation.

If private reporting is not available, contact the maintainer
[@habasefa](https://github.com/habasefa) privately using the contact method on
their GitHub profile.

Please include:

- the Ajora version and commit;
- runtime and platform versions;
- a minimal reproduction;
- the security impact and prerequisites;
- whether the issue has been disclosed elsewhere.

Do not test against accounts, data, or infrastructure you do not own or have
permission to use.

## What to expect

The maintainer will acknowledge a report as soon as practical, validate the
impact, coordinate a fix, and publish an advisory when appropriate. Response
times are best-effort for this pre-1.0 project.

## Scope reminders

Ajora is a client library. It does not provide a runtime, authorization
service, model provider, or secure storage. Applications are responsible for:

- short-lived authentication tokens;
- runtime-side authorization and rate limits;
- protecting secrets from public mobile bundles;
- sanitizing model output before rendering or executing it;
- validating tool calls and file uploads on trusted servers;
- treating agent context and attachment URLs as potentially sensitive.

Reports about third-party dependencies should also follow the relevant
upstream security process.
