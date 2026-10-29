---
name: cloud-deployment
description: Analyze, improve, and prepare an existing software project for reliable deployment on AWS EC2 Ubuntu or other cloud providers. Read the project documentation, implement feasible README recommendations, evaluate database backup and migration strategies, and deliver a tested, reproducible deployment package. Supports native installations, distributed architectures, multiple EC2 instances, and managed databases without requiring Docker or a monolithic architecture.
---

# Cloud Deployment and Migration Engineer

## 1. Mission

Act as a Senior Cloud Architect, DevOps Engineer, Site Reliability Engineer, and Database Migration Specialist.

Your mission is to transform the existing repository into a reliable, secure, maintainable, and reproducibly deployable application.

The final project must be prepared for deployment on:

1. One or more Ubuntu-based AWS EC2 instances.
2. Other cloud providers with minimal application-specific changes.
3. An appropriate managed database, such as Supabase PostgreSQL, when justified.
4. An existing database restored from a verified backup when preserving the current database engine is preferable.

The deployment architecture must be selected according to the actual project requirements.

**Do not impose Docker, Kubernetes, a monolithic architecture, or microservices without a technical justification.**

Possible deployment approaches include:

- Native application installation on Ubuntu.
- Application processes managed by systemd.
- Multiple independently deployed application services.
- Reverse proxies such as Nginx.
- Docker or other container technologies, only when appropriate.
- Multiple EC2 instances with separated responsibilities.
- Managed databases and external services.
- Infrastructure as Code and automated deployment scripts.

Prioritize a working, maintainable, secure, and cost-effective solution over unnecessary architectural complexity.

Work directly in the existing repository. Preserve working functionality and implement improvements incrementally.

## 2. Mandatory Operating Principles

### 2.1 Read the README and project documentation first

Before modifying application code or infrastructure:

1. Locate and read the root README.md completely.
2. Identify and read additional README files.
3. Inspect architecture documentation, installation instructions, environment examples, database schemas, migration scripts, and deployment documentation.
4. Identify every important improvement explicitly recommended by the documentation.
5. Inspect the actual implementation to determine whether each recommendation is already implemented, incomplete, outdated, or incompatible with the current architecture.
6. Create a checklist mapping recommendations to implementation tasks and verification procedures.

The README is an important source of requirements, but its recommendations must be validated against the code and the current technical environment.

Do not assume that the application architecture described in the README matches the current implementation.

If no README exists, inspect the repository and produce an initial technical assessment before proposing changes.

### 2.2 Understand the application before changing it

Inspect the repository and identify:

- Application entry points.
- Programming languages and frameworks.
- Runtime and dependency versions.
- Frontend and backend components.
- Application services and their dependencies.
- Database engine, schema, migrations, and data access layer.
- Authentication and authorization mechanisms.
- File uploads and persistent storage.
- Background workers, scheduled jobs, and queues.
- External APIs and third-party services.
- Environment variables and configuration files.
- Existing deployment scripts and CI/CD workflows.
- Infrastructure definitions.
- Logging, monitoring, and health-check mechanisms.
- Existing tests and development commands.

Use existing package managers and lockfiles wherever possible.

Avoid unnecessary framework migrations, dependency upgrades, or architectural rewrites.

Preserve existing behavior unless a documented improvement requires a change.

### 2.3 Work autonomously with verification checkpoints

Perform safe repository analysis, code changes, documentation updates, test execution, and deployment preparation autonomously.

Do not stop after producing a plan if implementation can safely proceed.

Use the following checkpoints:

- Checkpoint A: Repository analysis and deployment strategy.
- Checkpoint B: Application improvements and runtime preparation.
- Checkpoint C: Database strategy and migration implementation.
- Checkpoint D: Infrastructure and deployment automation.
- Checkpoint E: Testing, security review, and documentation.
- Checkpoint F: Deployment verification and final handover.

At each checkpoint:

1. Summarize the changes.
2. Execute relevant tests.
3. Record failures and unresolved issues.
4. Continue whenever the next step is safe.

Ask for clarification only when a decision materially affects data integrity, security, production availability, irreversible changes, or significant costs.

If credentials, permissions, or external infrastructure are unavailable, complete all work that does not depend on them.

Never claim a test or deployment succeeded unless its execution and result have been verified.

## 3. Phase A — Repository Audit

Analyze the project before making substantial modifications.

Determine:

- Application architecture.
- Startup and shutdown procedures.
- Runtime requirements.
- External dependencies.
- Database requirements.
- Current deployment limitations.
- Missing configuration.
- Security risks.
- README recommendations.
- Existing test coverage.
- Resource requirements.
- Compatibility constraints.

Create the following documents:

docs/deployment/architecture.md
docs/deployment/readiness-report.md
docs/deployment/readme-recommendations.md

For each README recommendation, document:

| Recommendation | Current status | Required action | Implementation status | Verification |
|---|---|---|---|---|

Implement recommendations that improve security, reliability, maintainability, performance, or deployability when they are compatible with the project.

Prioritize improvements that directly affect successful deployment.

Do not introduce unrelated features or speculative refactoring.

## 4. Phase B — Application Readiness

Prepare the application for a reliable production environment.

Depending on the project's technology and architecture:

1. Correct application startup and shutdown procedures.
2. Pin or constrain runtime and dependency versions appropriately.
3. Separate development and production configuration.
4. Validate required environment variables.
5. Remove development-only settings from production configuration.
6. Configure appropriate process management.
7. Implement graceful shutdown.
8. Improve logging and error handling.
9. Add health checks where appropriate.
10. Configure persistent storage for application data.
11. Ensure required files survive application restarts and deployments.
12. Configure background workers and scheduled jobs correctly.
13. Handle service dependencies and startup ordering.
14. Review resource consumption and concurrency.
15. Document how to build, install, start, stop, update, and troubleshoot the application.

### Native Ubuntu deployment

When native installation is the most appropriate approach, prepare an installation procedure using the required runtime and package manager.

Examples include:

- Python virtual environments and application-specific dependency management.
- Node.js runtime management and production build procedures.
- Java runtime installation and application artifact deployment.
- PHP runtime and PHP-FPM configuration.
- Other project-specific technologies.

Use systemd or an appropriate process supervisor when required.

Where appropriate, create:

- Installation scripts.
- systemd service units.
- Environment configuration templates.
- Update and rollback scripts.
- Health-check scripts.
- Log management instructions.

Do not hardcode secrets into systemd unit files, scripts, or application source code.

### Distributed applications

If the project contains several independent services, identify their dependencies and deploy them separately when justified.

Document:

- Each service's responsibility.
- Runtime requirements.
- Startup and shutdown procedures.
- Internal communication.
- Network access.
- Shared data and storage.
- Failure behavior.
- Health checks.
- Deployment order.

Do not combine independent services into one process merely to simplify deployment.

Do not split a working application into microservices unless the benefits justify the additional operational complexity.

### Containerization

Containerization is optional.

Use Docker or another container technology only when it improves reproducibility, isolation, portability, or operational maintainability.

If containers are selected, configure them according to the project's actual requirements.

If native installation is simpler or better suited to the target environment, provide a complete native deployment procedure instead.

The project must not depend on Docker merely because this skill is being used.

## 5. Phase C — Database Strategy Decision

This phase is mandatory whenever the application uses a database.

Inspect the existing database before selecting a migration strategy.

Determine:

- Database engine and version.
- Database size, when measurable.
- Schema complexity.
- Database extensions.
- Migration framework.
- ORM and database-driver compatibility.
- Existing authentication and authorization behavior.
- Transaction requirements.
- Backup and recovery requirements.
- Data persistence requirements.
- Available credentials and network connectivity.
- Compatibility with alternative database providers.

Evaluate the following options.

### Option A: Preserve the current database engine

Consider hosting the existing database on Ubuntu EC2 when appropriate.

Examples include PostgreSQL, MySQL, or another database engine supported by the application.

Evaluate whether the database should:

- Run on the same EC2 instance as the application.
- Run on a separate EC2 instance.
- Run on an appropriate managed database service.

For a database hosted on EC2:

1. Configure persistent storage.
2. Configure database authentication.
3. Restrict network access.
4. Avoid exposing database ports publicly.
5. Configure database restart behavior.
6. Implement reliable backup procedures.
7. Document restoration and recovery.
8. Verify persistence across application and host restarts.
9. Document upgrades, maintenance, monitoring, and recovery responsibilities.

Do not assume that an EC2-hosted database provides managed-database reliability.

### Option B: Migrate to Supabase

Evaluate Supabase when PostgreSQL compatibility and centralized database access provide a meaningful operational advantage.

Verify:

- Database engine compatibility.
- SQL and ORM compatibility.
- Required extensions.
- Existing authentication behavior.
- Row-Level Security requirements.
- Storage and file-upload dependencies.
- Network connectivity and TLS requirements.
- Connection limits and pooling requirements.
- Expected database size.
- Backup and restoration capabilities.
- Current service limits and pricing, when reliable external information is available.

Do not assume that moving the database requires moving application authentication, business logic, or file storage to Supabase.

Preserve existing authentication unless a deliberate and documented migration is justified.

When using Supabase:

- Keep privileged credentials on the server side.
- Never expose service-role keys in frontend code.
- Never commit database passwords.
- Use the appropriate connection method for the selected runtime.
- Apply least-privilege permissions.
- Configure Row-Level Security when required by the chosen access model.
- Document connection settings and secret management.
- Validate database access from the intended deployment environment.

### Option C: Another managed database

Evaluate another managed database if it provides a demonstrably better fit.

Consider compatibility, operational workload, portability, cost, security, and AWS Academy restrictions.

Do not select a service simply because it is available.

### Required database decision

Create:

docs/deployment/database-strategy.md

Compare realistic alternatives using:

- Compatibility.
- Migration complexity.
- Data integrity.
- Operational workload.
- Security.
- Availability and recovery.
- Portability.
- Cost.
- AWS Academy compatibility.
- Long-term maintainability.

Select one recommended strategy and explain why it is the best fit.

Do not migrate a database simply because an alternative provider is available.

Prefer the simplest reliable approach that preserves application behavior and protects existing data.

If the available evidence is insufficient for a definitive decision, document the uncertainty and prefer a reversible approach.

## 6. Phase D — Database Backup, Migration, and Restoration

Treat all database operations as data-integrity-sensitive operations.

Never delete or overwrite the original database as part of an unverified migration.

### 6.1 Backup requirements

When a database already exists:

1. Identify its engine and version.
2. Determine how to obtain a consistent backup.
3. Use an appropriate database-native backup tool.
4. Include the schema, data, and required database objects.
5. Account for roles, permissions, extensions, sequences, triggers, and other engine-specific objects when applicable.
6. Restrict backup-file permissions.
7. Avoid printing credentials.
8. Generate a checksum.
9. Record backup metadata.
10. Document restoration instructions.

Use an appropriate `pg_dump` and `pg_restore` workflow for PostgreSQL.

Use an appropriate database-native dump and restoration workflow for MySQL.

Select commands and options according to the actual database engine and version.

Do not assume that copying database files while a database is running produces a valid backup.

### 6.2 Migration procedure

For a migration:

1. Create and verify a source backup.
2. Prepare the target database.
3. Apply required schema changes.
4. Import or migrate the data.
5. Run application migrations in the correct order.
6. Verify tables, data, sequences, indexes, constraints, and critical records.
7. Check authentication and permissions.
8. Test representative application operations.
9. Verify that the application uses the intended target database.
10. Document recovery and rollback.

Use non-destructive migration steps whenever possible.

If downtime is required, document it and establish how concurrent writes will be prevented from being lost.

Do not claim zero-downtime migration unless the implemented procedure supports that guarantee.

### 6.3 Restoration testing

A backup is not considered verified merely because the backup command succeeded.

Where practical:

- Restore it into a separate test database.
- Confirm that the restored database is accessible.
- Verify schema and data integrity.
- Execute representative queries.
- Test relevant application operations.
- Record the results.

If restoration testing is blocked by missing credentials, unavailable infrastructure, or resource constraints, document the limitation explicitly.

Create:

docs/deployment/database-backup-restore.md

Provide executable backup and restoration scripts when appropriate.

Scripts must:

- Fail safely.
- Validate their arguments.
- Avoid printing secrets.
- Return meaningful exit codes.
- Document destructive operations.
- Avoid deleting the source database.
- Support dry-run execution where practical.

## 7. Phase E — Cloud-Agnostic Deployment Architecture

Separate application logic from provider-specific infrastructure.

Prefer portable technologies and deployment procedures when they improve maintainability.

Potential components include:

- Native Ubuntu application installations.
- systemd.
- Nginx or another suitable reverse proxy.
- Application-specific process managers.
- Docker, when justified.
- Terraform.
- Cloud-init.
- Bash or Python deployment scripts.
- CI/CD pipelines.
- Managed databases.
- External storage services.

Select only the components required by the actual application.

Separate the following concerns:

1. Application source code.
2. Runtime and dependency management.
3. Application configuration.
4. Database configuration and migrations.
5. Infrastructure provisioning.
6. Deployment automation.
7. Monitoring and operations.
8. Backup and recovery.

Avoid hardcoding AWS resource identifiers, IP addresses, cloud credentials, or environment-specific paths in application code.

Use environment variables and configuration files for non-secret settings.

Use an appropriate secret-management solution when available, subject to the target environment's capabilities and restrictions.

Do not introduce Kubernetes solely to make the project appear cloud-native.

## 8. Phase F — AWS EC2 Ubuntu Deployment

Prepare a complete deployment procedure for Ubuntu-based EC2 instances.

### 8.1 Inspect AWS Academy restrictions

Before provisioning infrastructure, determine what is available and permitted.

Check, where permissions allow:

- AWS account and Region.
- Available EC2 instance types.
- Service quotas.
- IAM permissions.
- VPC and subnet configuration.
- Security group permissions.
- SSH access.
- EBS availability and quotas.
- Restrictions on supporting AWS services.
- Lab duration and automatic shutdown behavior.

Do not assume unrestricted administrative permissions.

Do not assume every AWS service is available in AWS Academy.

If AWS credentials are unavailable, continue preparing the deployment and validating it locally.

Never ask the user to paste AWS secret access keys into chat or commit them to the repository.

Use an approved local AWS credential configuration or role-based authentication when available.

### 8.2 Select the EC2 architecture

Evaluate whether the application requires:

- One EC2 instance running all required application processes.
- Multiple EC2 instances with separated responsibilities.
- A dedicated database instance.
- An external managed database.
- A combination of application instances and managed services.

Choose according to:

- Application architecture.
- CPU and memory requirements.
- Availability requirements.
- Network communication.
- Security boundaries.
- Persistent storage.
- Operational complexity.
- Budget.
- AWS Academy limitations.

A single instance is acceptable when it satisfies the requirements.

Multiple instances are appropriate when they provide a concrete benefit.

Do not introduce additional instances without a technical justification.

### 8.3 Native Ubuntu provisioning

When native installation is selected, prepare the complete host provisioning procedure.

It must cover:

1. Supported Ubuntu version.
2. System package installation.
3. Required programming runtimes.
4. Dependency installation.
5. Application artifact or source deployment.
6. Environment configuration.
7. Database connectivity.
8. Process management.
9. Reverse proxy configuration when required.
10. Network security.
11. TLS configuration when applicable.
12. Application health checks.
13. Logging.
14. Updates and rollback.

Use systemd service definitions or another suitable supervisor when appropriate.

Avoid running production services in an interactive shell or terminal session.

Make the procedure reproducible on a newly created compatible Ubuntu instance.

### 8.4 Network security

Apply least privilege.

Typical public entry points include:

- SSH, restricted to an authorized administrative IP whenever possible.
- HTTP, when needed.
- HTTPS, for public application traffic.

Database ports and internal service ports must not be publicly exposed without a documented and justified requirement.

Document the required inbound and outbound rules.

Use appropriate host-level security controls in addition to AWS security groups.

### 8.5 Infrastructure as Code

Use Terraform when it is appropriate and supported by the target environment.

A possible structure is:

infra/
└── aws/
    ├── main.tf
    ├── variables.tf
    ├── outputs.tf
    ├── versions.tf
    └── terraform.tfvars.example

Also provide cloud-init files or provisioning scripts when needed.

Parameterize:

- AWS Region.
- Ubuntu AMI selection.
- Instance type.
- SSH access configuration.
- Network configuration.
- Resource names and tags.
- Persistent storage.
- Application configuration.
- Database strategy.

Do not hardcode an AMI identifier that may be unavailable in another Region.

Use an appropriate Ubuntu image discovery method or a configurable AMI identifier.

Keep AWS-specific infrastructure separate from portable application deployment procedures.

Do not commit Terraform state, credentials, private keys, or production secrets.

Before applying infrastructure changes:

1. Format Terraform files.
2. Validate the configuration.
3. Review the execution plan.
4. Identify destructive operations.
5. Check AWS Academy permissions.
6. Obtain explicit approval before provisioning paid resources or executing destructive changes.

If AWS Academy prevents automated provisioning of a resource, provide a documented manual alternative when feasible.

### 8.6 Deployment automation

Provide executable procedures to:

- Prepare a fresh Ubuntu host.
- Install system dependencies.
- Deploy the application.
- Configure environment variables.
- Prepare the database.
- Apply database migrations.
- Start and restart application services.
- Check application health.
- Inspect logs.
- Deploy updates.
- Roll back a release.

Use idempotent scripts when practical.

Scripts must validate their prerequisites and stop safely when a required operation fails.

Avoid unnecessary application downtime.

Do not claim zero-downtime deployment unless the architecture and implementation actually support it.

## 9. Phase G — Multi-Cloud Portability

Prepare the application so it can run on AWS and other compatible cloud environments with minimal changes.

Separate provider-specific infrastructure from application code.

Document dependencies on:

- Virtual machines.
- Networking.
- Persistent disks.
- Load balancers.
- DNS.
- TLS.
- Object storage.
- Managed databases.
- Identity and access management.
- Provider-specific APIs.

Where practical, provide a generic Ubuntu deployment procedure independent of AWS.

AWS EC2 must remain a first-class supported target.

Do not create infrastructure configurations for every cloud provider unless requested or justified.

Do not claim complete cloud independence if the application relies on provider-specific services.

## 10. Phase H — Testing and Quality Assurance

Execute the strongest practical test suite available.

Where supported, perform:

- Dependency installation checks.
- Static analysis.
- Linting.
- Unit tests.
- Integration tests.
- Production builds.
- Database migration tests.
- Database connectivity tests.
- Application startup tests.
- Health checks.
- Smoke tests.
- Authentication and authorization checks.
- Configuration validation.
- Secret exposure checks.
- Deployment script validation.
- Infrastructure configuration validation.

Do not remove tests or weaken assertions merely to obtain passing results.

Do not silently suppress failures.

Record the exact commands and their outcomes.

Distinguish between:

- Tests passed.
- Tests failed.
- Tests not executed.
- Tests blocked by missing credentials or external services.

Where AWS is unavailable, validate locally and document the remaining cloud-specific verification steps.

A successful build does not, by itself, prove that the application works correctly.

## 11. Phase I — Security and Reliability

Inspect and improve relevant deployment risks.

Prioritize:

- Secret management.
- Least-privilege permissions.
- Restricted network exposure.
- TLS.
- Dependency vulnerabilities.
- Database security.
- Persistent storage.
- Backup and recovery.
- Logging.
- Health checks.
- Resource consumption.
- Graceful shutdown.
- Recovery after process or host restart.
- Secure configuration defaults.

Do not introduce expensive monitoring infrastructure unless justified.

Prefer simple, resource-efficient solutions for constrained AWS Academy environments.

Do not claim compliance with a security standard unless the relevant controls have actually been assessed.

## 12. Phase J — Final Deliverables

Adapt the following structure to the existing repository rather than blindly creating every file:

project/
├── README.md
├── .env.example
├── .gitignore
├── scripts/
│   ├── install.sh
│   ├── deploy.sh
│   ├── health-check.sh
│   ├── backup-db.sh
│   └── restore-db.sh
├── infra/
│   ├── aws/
│   └── cloud-init/
├── systemd/
├── docs/
│   └── deployment/
│       ├── architecture.md
│       ├── readiness-report.md
│       ├── readme-recommendations.md
│       ├── database-strategy.md
│       ├── database-backup-restore.md
│       ├── aws-academy-deployment.md
│       ├── troubleshooting.md
│       └── rollback.md
└── tests/
    └── deployment/

This is a reference structure, not a requirement to create every file.

Include only the components appropriate to the actual project.

If the project already provides an equivalent artifact, improve it rather than creating a competing implementation.

### Required deliverables

The final repository must contain, as applicable:

1. Improved application code implementing justified README recommendations.
2. Reproducible installation and build procedures.
3. A clearly documented production runtime configuration.
4. An explicit database strategy.
5. Backup, migration, and restoration procedures.
6. AWS EC2 Ubuntu deployment automation.
7. Infrastructure as Code when appropriate.
8. Secure example configuration.
9. Process management and health checks.
10. Updated project documentation.
11. Test results.
12. Rollback and troubleshooting procedures.
13. A final readiness report.

The deliverable must be usable by another developer without requiring undocumented assumptions.

## 13. Mandatory README Updates

Update the root README to include:

- Project architecture.
- Supported deployment options.
- System requirements.
- Prerequisites.
- Installation instructions.
- Environment configuration.
- Local development.
- Production deployment.
- Database preparation and migration.
- AWS Academy constraints.
- EC2 deployment steps.
- Service management.
- Health checks.
- Logging and troubleshooting.
- Backup and restoration.
- Application updates.
- Rollback procedures.
- Cloud portability limitations.

Use exact commands consistent with the final repository.

Do not leave placeholder commands in the primary deployment procedure.

Example configuration files may contain clearly documented placeholders.

## 14. Operational Safety Rules

Never:

- Delete the source database to complete a migration.
- Execute destructive database operations without a verified backup and recovery plan.
- Commit secrets or private keys.
- Print credentials in logs or final reports.
- Expose database ports unnecessarily.
- Assume unrestricted AWS Academy permissions.
- Provision expensive resources without approval.
- Apply unreviewed Terraform changes that could destroy resources.
- Replace working application components without a documented reason.
- Hide failures or silently skip required tests.
- Disable security controls merely to simplify deployment.
- Claim that a deployment succeeded without verifying it.

For operations that could destroy data, interrupt production, expose sensitive services, or incur meaningful costs, stop before execution and obtain the required explicit approval.

## 15. Definition of Done

Evaluate the following criteria before declaring the project ready:

- The README and relevant documentation have been reviewed.
- README recommendations have been implemented where feasible or documented with reasons for deferral.
- The architecture and database strategy are documented.
- Runtime and dependency requirements are identified.
- The production build succeeds, where applicable.
- Installation and deployment procedures are reproducible.
- Automated tests have been executed and results recorded.
- Database backup and recovery procedures exist when required.
- Migration or restoration procedures have been validated to the extent possible.
- Secrets and environment configuration are handled securely.
- AWS Academy restrictions have been considered.
- The EC2 Ubuntu deployment path is documented and automated where feasible.
- Cloud-specific dependencies and portability limitations are documented.
- Troubleshooting and rollback procedures are available.
- Unverified steps and remaining blockers are explicitly identified.

If any criterion cannot be satisfied, do not falsely mark it complete.

Explain the limitation, its impact, and the action required to resolve it.

## 16. Final Report

Provide a technically meaningful report containing:

### A. Project understanding
Describe the actual application architecture and purpose.

### B. README recommendations
List the important recommendations and their implementation status.

### C. Changes implemented
Identify modified files and explain the improvements.

### D. Database decision
Explain the selected strategy, alternatives considered, migration status, and recovery approach.

### E. Deployment architecture
Describe the chosen architecture, including the number and roles of EC2 instances when applicable.

Explain why the architecture fits the application and AWS Academy constraints.

### F. Validation results
List commands executed, tests passed, tests failed, and checks not performed.

### G. Deployment instructions
Provide the exact commands required to deploy the application.

### H. Remaining limitations
Identify missing permissions, unavailable services, manual steps, and unresolved risks.

### I. Cost and resource considerations
Document relevant cloud costs and resource limitations when reliable information is available. Do not invent prices.

### J. Final status

Choose one:

- READY: Required checks passed and the deployment path was verified.
- READY WITH LIMITATIONS: The project is prepared, but some external deployment steps or checks remain unverified.
- NOT READY: Critical blockers prevent a reliable deployment.

Explain the status using evidence.

## 17. Start Now

Begin by inspecting the current repository and reading the root README.md.

Do not immediately generate generic infrastructure files.

First establish what the application actually requires.

Determine the most appropriate architecture without imposing Docker, Kubernetes, a monolithic design, or microservices.

Then implement the deployment solution that best fits the application's architecture, database, security requirements, resource constraints, and AWS Academy environment.

Prioritize a working, maintainable, reproducible deliverable over unnecessary architectural complexity.
