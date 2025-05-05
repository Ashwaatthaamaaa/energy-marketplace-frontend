# Migration to GKE Autopilot: Summary

## Overview of Changes

This document outlines the changes made to migrate the `energy-marketplace-frontend` application from a single GCE VM deployment managed by Ansible to a Google Kubernetes Engine (GKE) Autopilot deployment.

## 1. Infrastructure Changes (Terraform)

### Modified `infrastructure/terraform/gcp/main.tf`:
- Removed the `google_compute_instance.marketplace_vm` resource.
- Added a `google_container_cluster.marketplace_cluster` resource configured for Autopilot mode.
- Kept essential firewall rules and updated them to work with GKE:
  - `default-allow-ssh` (for administrative access)
  - `default-allow-http-https` (for accessing web services)
- Removed the `default-allow-monitoring` rule as monitoring will be handled differently in Kubernetes.

### Modified `infrastructure/terraform/gcp/outputs.tf`:
- Removed VM-specific outputs (`marketplace_vm_external_ip`, `marketplace_vm_internal_ip`).
- Added GKE-specific outputs:
  - `gke_cluster_name`
  - `gke_cluster_endpoint`
  - `gke_cluster_location`
  - `gke_master_version`
  - `gke_connect_command`

## 2. Kubernetes Manifests

Created two new Kubernetes manifest files:

### `kubernetes/deployment.yaml`:
- Defines a Kubernetes Deployment for the frontend application.
- Sets 2 replicas for high availability.
- Configures resource requests/limits appropriate for Autopilot.
- Includes readiness and liveness probes for health checking.

### `kubernetes/service.yaml`:
- Defines a Kubernetes Service of type LoadBalancer.
- Exposes the application on port 80.
- Routes traffic to the matching deployment pods.

## 3. CI/CD Workflow Changes

Modified `.github/workflows/cd.yml`:

### `check-or-provision-infra` job:
- Changed from checking for a VM's existence to checking for a GKE cluster.
- Updated Terraform provisioning path and outputs.

### Replaced `ansible-deploy` job with `kubernetes-deploy` job:
- Added steps to:
  - Set up and authenticate to GCP and GKE.
  - Update the Kubernetes manifests with the correct image tag.
  - Deploy the application using kubectl.
  - Wait for the deployment to complete and verify it.
  - Display the LoadBalancer IP for access to the application.

## 4. Ansible Role Analysis

### Redundant Roles for Frontend Deployment:
- `nginx`: No longer needed as nginx runs inside the container.
- `nodejs`: Not needed as the container includes all runtime dependencies.
- `frontend-app`: Deployment is now handled by Kubernetes manifests.

### Monitoring Role Suggestions:
- `prometheus`, `grafana`, `node_exporter`: These could be deployed to Kubernetes using Helm charts or operator patterns.
- Alternatively, consider using Google Cloud Operations (formerly Stackdriver) for a managed monitoring solution.

## 5. Dockerfile Analysis

The existing Dockerfile remains suitable for the GKE deployment without changes because:
- It follows the multi-stage build pattern for optimized container size.
- It properly exposes port 80 for web traffic.
- The nginx configuration is copied into the container.
- It has a proper CMD directive for container startup.

## Benefits of the Migration

1. **Scalability**: GKE Autopilot automatically scales based on workload demands.
2. **Reliability**: Multiple replicas provide high availability.
3. **Simplification**: No need to manage VM infrastructure or configure servers with Ansible.
4. **Security**: Reduced attack surface with no SSH access to manage.
5. **Cost efficiency**: Pay only for resources you actually use with Autopilot's serverless model.

## Next Steps

1. Consider adding a proper ingress controller for more advanced routing.
2. Implement Kubernetes-native monitoring solutions.
3. Set up horizontal pod autoscaling for more granular scaling control.
4. Implement a proper staging environment with separate Kubernetes namespaces.
5. Consider implementing Continuous Deployment using Kubernetes-native tools like Argo CD or Flux. 