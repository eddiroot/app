# GENERAL SECURITY GUIDELINES

---

## Access Control
- **[Pre]** Use role-based access control (RBAC) — assign permissions to roles, not individuals.  
- **[Pre+Post]** Follow least privilege — grant only the minimum access needed.  
- **[Pre]** Never hardcode credentials or tokens in source code.  
- **[Pre+Post]** Use SSO or MFA for admin/staff logins whenever possible.  
- **[Post]** Rotate and audit API keys, credentials, and secrets regularly (e.g., every 90 days or at deployment).  

---

## Data Protection
- **[Pre+Post]** Encrypt sensitive data at rest (AES-256) and in transit (TLS 1.2+).  
- **[Pre]** Use strong password hashing (e.g., argon2).  
- **[Pre]** Validate all inputs and encode outputs to prevent injection attacks.  
- **[Post]** Avoid logging or exposing PII (personally identifiable information).  
- **[Pre]** Collect only necessary data (data minimization).  

---

## Secure Development
- **[Pre]** Follow the secure development process, including security reviews before release.  
- **[Pre]** Adhere to a secure coding standard (e.g., OWASP, CERT).  
- **[Pre]** Run static code analysis (SAST) in CI/CD pipelines.  
- **[Pre]** Conduct code reviews using the security checklist.  
- **[Pre]** Track security requirements alongside functional requirements.  

---

## Security Testing
- **[Post]** Perform penetration tests at least annually or after major changes.  
- **[Post]** Conduct vulnerability scans regularly (weekly/monthly).  
- **[Post]** Remediate critical security issues within set deadlines (e.g., 7 days).  
- **[Pre]** Add security-focused unit/integration tests.  
- **[Pre+Post]** Scan dependencies for known vulnerabilities (e.g., npm audit, pip-audit).  

---

## Change Management
- **[Pre]** Ensure all code changes are tracked in version control.  
- **[Pre]** Require peer review and approval for pull requests.  
- **[Pre+Post]** Maintain a change log of important updates, especially security changes.  
- **[Pre]** Test all changes in a non-production environment before deployment.  

---

## Documentation
- **[Pre+Post]** Maintain documentation of API contracts, data flows, and trust boundaries.  
- **[Pre+Post]** Keep technical documentation for authentication, logging, and encryption.  
- **[Pre+Post]** Link features to relevant security policies in wikis or PRs.  
- **[Pre]** All developers must acknowledge and follow the Secure Coding Policy.  

---

## Incident & Breach Response
- **[Post]** Follow the incident escalation process.  
- **[Post]** Use structured logging for incidents (no raw stack traces exposed to users).  
- **[Pre+Post]** Include unique request IDs in logs for traceability.  
- **[Post]** Configure alerts for key security events (failed logins, privilege changes).  

---

## Audit & Evidence
- **[Pre+Post]** Retain evidence of reviews, approvals, and test results in Jira/GitLab.  
- **[Pre+Post]** (Optional) Reference security controls in commit messages or PRs.  
- **[Post]** Archive logs, analysis results, and deployment records for audits.  

---

**NOTE:** Refer to pre-deployment guidelines for the time being! Each of the following are mapped directly to ISO27001 controls, and with proof of adherence to these controls, along with the proper documentation, we should be eligible to gain ISO27001 certification down the track.
