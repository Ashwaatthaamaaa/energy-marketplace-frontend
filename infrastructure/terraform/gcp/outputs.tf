# infrastructure/terraform/gcp/outputs.tf

output "gke_cluster_name" {
  description = "Name of the GKE Autopilot cluster"
  value       = google_container_cluster.marketplace_cluster.name
}

output "gke_cluster_endpoint" {
  description = "Endpoint of the GKE Autopilot cluster"
  value       = google_container_cluster.marketplace_cluster.endpoint
}

output "gke_cluster_location" {
  description = "Location of the GKE Autopilot cluster"
  value       = google_container_cluster.marketplace_cluster.location
}

output "gke_master_version" {
  description = "Kubernetes version of the GKE Autopilot cluster"
  value       = google_container_cluster.marketplace_cluster.master_version
}

output "gke_connect_command" {
  description = "Command to connect to the GKE cluster"
  value       = "gcloud container clusters get-credentials ${google_container_cluster.marketplace_cluster.name} --region ${google_container_cluster.marketplace_cluster.location} --project ${var.gcp_project_id}"
}