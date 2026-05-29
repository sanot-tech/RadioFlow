# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. Please report them via private disclosure:

1. **Open a draft advisory**: https://github.com/sanot-tech/RadioFlow/security/advisories
2. **Or email**: [@sanot-tech](https://github.com/sanot-tech) via GitHub DM

Do NOT report security vulnerabilities in public issues.

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Affected versions
- Potential impact
- Suggested remediation (if known)

### Response Timeline

- **Acknowledgement**: within 48 hours
- **Triage**: within 5 business days
- **Fix**: within 14 days for critical issues
- **Disclosure**: coordinated public disclosure after fix

## Security Practices

- Dependency scanning via Dependabot (automated)
- CodeQL analysis on every push
- TypeScript strict mode enabled
- CSP headers configured
- No secrets committed to repository
