# Data Model: Docker Deployment

## Container Configuration Entity

**Fields**:
- `image_name`: String - Docker image identifier
- `container_name`: String - Runtime container identifier
- `port_mapping`: Object - Host to container port mapping
- `volume_mounts`: Array - Persistent storage configurations
- `environment_vars`: Object - Runtime environment configuration
- `health_check`: Object - Container health monitoring configuration

**Validation Rules**:
- Image name must follow Docker naming conventions
- Port mappings must not conflict with host services
- Volume paths must be absolute
- Environment variables must be valid for Next.js

**State Transitions**:
1. Built → Ready for export
2. Exported → Ready for deployment
3. Deployed → Running
4. Running → Stopped
5. Stopped → Running (restart)

## Deployment Configuration Entity

**Fields**:
- `target_host`: String - Ubuntu server hostname/IP
- `docker_version`: String - Required Docker version
- `storage_location`: String - Host path for persistent data
- `network_config`: Object - Local network configuration
- `backup_strategy`: Object - Data backup configuration

**Validation Rules**:
- Target host must be accessible
- Docker version must support required features
- Storage location must have sufficient space
- Network ports must be available

## Build Artifact Entity

**Fields**:
- `dockerfile_path`: String - Path to Dockerfile
- `docker_compose_path`: String - Path to compose file (optional)
- `build_context`: String - Docker build context directory
- `image_tag`: String - Version/tag for built image
- `build_args`: Object - Build-time variables

**Validation Rules**:
- Dockerfile must exist and be valid
- Build context must contain required files
- Image tags must follow semantic versioning
- Build args must not contain secrets

## CSV Storage Entity

**Fields**:
- `upload_directory`: String - Container path for CSV files
- `volume_name`: String - Docker volume identifier
- `host_path`: String - Host filesystem path
- `retention_policy`: Object - File cleanup configuration
- `backup_enabled`: Boolean - Automatic backup flag

**Validation Rules**:
- Upload directory must be writable by container user
- Volume names must be unique
- Host paths must exist and be accessible
- Retention policies must be valid durations