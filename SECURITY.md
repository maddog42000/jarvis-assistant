# Security Policy

## Protecting credentials

Please do not commit API keys, OAuth secrets, database URLs, signing credentials, or real values from local environment files. Use deployment secret storage for backend credentials and local untracked environment files for development.

If a credential is exposed, revoke or rotate it with the relevant provider immediately. Removing it from the latest commit is not enough if it was already pushed, because it may remain in Git history or caches.

## Reporting a vulnerability

For a private report, contact the repository owner through GitHub's private vulnerability reporting feature if it is enabled for this repository. Do not publish working credentials, personal data, or exploit details in a public issue.

## Deployment checklist

Before publicly deploying the server-side assistant endpoint, review authentication, durable rate limiting across instances, upstream spending limits, request logging/redaction, and abuse monitoring.
