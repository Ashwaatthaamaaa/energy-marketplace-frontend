# infrastructure/terraform/gcp/main.tf

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# --- Firewall Rules for Default Network ---

# Keeping this rule for administrative access
resource "google_compute_firewall" "default_allow_ssh" {
  name      = "default-allow-ssh"
  network   = "default" # Use the default GCP network
  direction = "INGRESS"
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
  # IMPORTANT: Restrict source_ranges to YOUR IP for security!
  source_ranges = [var.my_public_ip] # <<< USES YOUR IP VARIABLE >>>
}

# Keeping this rule for HTTP/HTTPS access to GKE services
resource "google_compute_firewall" "default_allow_http_https" {
  name      = "default-allow-http-https"
  network   = "default"
  direction = "INGRESS"
  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }
  source_ranges = ["0.0.0.0/0"] # Allow public web access
  target_tags = ["http-server", "https-server", "gke-node"]
}

resource "google_compute_firewall" "default_allow_monitoring" {
  name      = "default-allow-monitoring"
  network   = "default"
  direction = "INGRESS"
  allow {
    protocol = "tcp"
    # Prometheus, Grafana, Node Exporter
    ports = ["9090", "3000", "9100"]
  }
  # IMPORTANT: Restrict source_ranges to YOUR IP for security!
  source_ranges = [var.my_public_ip] # <<< USES YOUR IP VARIABLE >>>
  # Apply to VMs tagged for monitoring access
  target_tags = ["monitoring-ports"]
}

# --- GKE Autopilot Cluster ---

resource "google_container_cluster" "marketplace_cluster" {
  name     = "marketplace-cluster"
  location = var.gcp_region

  # Enable Autopilot mode
  enable_autopilot = true

  # Network configuration (using default network)
  network    = "default"
  subnetwork = "default"

  # IP allocation policy required for Autopilot clusters
  ip_allocation_policy {
    # Will automatically create secondary ranges
  }

  # Release channel for the cluster (REGULAR is recommended for production)
  release_channel {
    channel = "REGULAR"
  }

  # Enable workload identity for better security
  workload_identity_config {
    workload_pool = "${var.gcp_project_id}.svc.id.goog"
  }
}