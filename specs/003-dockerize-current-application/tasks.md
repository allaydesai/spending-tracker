# Tasks: Dockerize Application for Home Server Deployment

**Input**: Design documents from `/home/allay/dev/spending-tracker/specs/003-dockerize-current-application/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓), quickstart.md (✓)

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- All file paths are absolute from repository root

## Phase 3.1: Infrastructure Setup
- [x] T001 Create Docker infrastructure directory structure (`docker/`, `scripts/`, `docs/`)
- [x] T002 Configure Next.js for production containerization in `next.config.mjs`
- [x] T003 [P] Add simple health check endpoint at `/app/api/health/route.ts`

## Phase 3.2: Docker Configuration Validation ⚠️ INFRASTRUCTURE TESTING
**Focus: Validate Docker configurations work before deployment**
- [x] T004 [P] Create Dockerfile validation script in `scripts/validate-dockerfile.sh`
- [x] T005 [P] Create docker-compose validation script in `scripts/validate-compose.sh`
- [x] T006 [P] Create deployment environment validation in `scripts/validate-environment.sh`
- [x] T007 Create Docker build test script in `scripts/test-build.sh`
- [x] T008 Create container functionality test script in `scripts/test-container.sh`

## Phase 3.3: Docker Infrastructure Implementation
- [x] T009 Create production Dockerfile with multi-stage build at repository root
- [x] T010 Create docker-compose.yml for home server deployment at repository root
- [x] T011 Create .dockerignore file at repository root
- [x] T012 Implement health check API route at `/app/api/health/route.ts`
- [x] T013 [P] Create Docker build automation script in `scripts/build.sh`
- [x] T014 [P] Create image export script for server transfer in `scripts/export-image.sh`
- [x] T015 [P] Create server deployment script in `scripts/deploy-to-server.sh`

## Phase 3.4: Deployment Automation
- [x] T016 Create environment configuration template in `docker/env.template`
- [x] T017 Configure volume mounting for CSV persistence in docker-compose
- [x] T018 Set up port mapping and network configuration
- [x] T019 Add resource limits and security policies to containers
- [x] T020 Configure container restart and recovery policies
- [x] T021 [P] Create server setup script in `scripts/setup-server.sh`

## Phase 3.5: Documentation & Operations
- [x] T022 [P] Create step-by-step deployment guide in `docs/DEPLOYMENT.md`
- [x] T023 [P] Create troubleshooting guide in `docs/TROUBLESHOOTING.md`
- [x] T024 [P] Create server maintenance guide in `docs/MAINTENANCE.md`
- [x] T025 [P] Create backup automation script in `scripts/backup-data.sh`
- [x] T026 [P] Create restore procedure script in `scripts/restore-data.sh`
- [x] T027 [P] Create monitoring and health check scripts in `scripts/monitor.sh`
- [x] T028 [P] Validate complete deployment workflow end-to-end
- [x] T029 Create container update and migration procedures
- [x] T030 Final infrastructure validation and cleanup

## Dependencies
- Infrastructure setup (T001-T003) before validation (T004-T008)
- Validation scripts (T004-T008) before Docker implementation (T009-T015)
- Docker configs (T009-T012) before automation scripts (T013-T015)
- Core infrastructure (T009-T015) before deployment automation (T016-T021)
- Deployment automation complete before documentation (T022-T030)
- T009 (Dockerfile) blocks T010 (docker-compose), T013 (build script)
- T012 (health endpoint) blocks T008 (container testing)
- T013-T015 (automation scripts) can run in parallel once T009-T012 complete

## Parallel Example
```
# Launch validation scripts together (T004-T006):
Task: "Create Dockerfile validation script in scripts/validate-dockerfile.sh"
Task: "Create docker-compose validation script in scripts/validate-compose.sh"
Task: "Create deployment environment validation in scripts/validate-environment.sh"

# Launch automation scripts together (T013-T015):
Task: "Create Docker build automation script in scripts/build.sh"
Task: "Create image export script for server transfer in scripts/export-image.sh"
Task: "Create server deployment script in scripts/deploy-to-server.sh"

# Launch documentation together (T022-T027):
Task: "Create step-by-step deployment guide in docs/DEPLOYMENT.md"
Task: "Create troubleshooting guide in docs/TROUBLESHOOTING.md"
Task: "Create server maintenance guide in docs/MAINTENANCE.md"
Task: "Create backup automation script in scripts/backup-data.sh"
Task: "Create restore procedure script in scripts/restore-data.sh"
Task: "Create monitoring and health check scripts in scripts/monitor.sh"
```

## Infrastructure File Structure After Completion
```
/home/allay/dev/spending-tracker/
├── Dockerfile                           # T009 - Production container config
├── docker-compose.yml                   # T010 - Home server deployment
├── .dockerignore                        # T011 - Build optimization
├── app/api/health/route.ts              # T003, T012 - Container health check
├── docker/
│   └── env.template                     # T016 - Environment configuration
├── scripts/
│   ├── validate-dockerfile.sh           # T004 - Config validation
│   ├── validate-compose.sh              # T005 - Compose validation
│   ├── validate-environment.sh          # T006 - Environment validation
│   ├── test-build.sh                    # T007 - Build testing
│   ├── test-container.sh                # T008 - Container testing
│   ├── build.sh                         # T013 - Build automation
│   ├── export-image.sh                  # T014 - Image export
│   ├── deploy-to-server.sh              # T015 - Server deployment
│   ├── setup-server.sh                  # T021 - Server preparation
│   ├── backup-data.sh                   # T025 - Data backup
│   ├── restore-data.sh                  # T026 - Data restore
│   └── monitor.sh                       # T027 - Health monitoring
└── docs/
    ├── DEPLOYMENT.md                    # T022 - Deployment guide
    ├── TROUBLESHOOTING.md               # T023 - Problem resolution
    └── MAINTENANCE.md                   # T024 - Server maintenance
```

## Notes
- [P] tasks = different files, no dependencies
- Focus on infrastructure automation and deployment reliability
- Each script should be executable and well-documented
- Validate configurations before implementing containers
- Follow DevOps best practices: automation, monitoring, documentation
- Resource constraints: <512MB memory, container efficiency optimized
- Target: Simple home server deployment without orchestration complexity

## Infrastructure Validation Checklist
✅ All 3 contract schemas have validation scripts (T004-T006)
✅ All 4 data model entities covered in Docker configuration
✅ Validation scripts before Docker implementation (T004-T008 before T009-T015)
✅ Parallel tasks are truly independent (different files/scripts)
✅ Each task produces executable infrastructure artifact
✅ No [P] task modifies same file as another [P] task
✅ Quickstart deployment scenarios covered in automation scripts
✅ Infrastructure focuses on containerization, not application logic