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

resource "google_compute_firewall" "default_allow_http_https" {
  name      = "default-allow-http-https"
  network   = "default"
  direction = "INGRESS"
  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }
  source_ranges = ["0.0.0.0/0"] # Allow public web access
  # Apply to VMs with http-server OR https-server tag (matches your JSON)
  target_tags = ["http-server", "https-server"]
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

# --- Single Compute Instance ---

resource "google_compute_instance" "marketplace_vm" {
  name = "marketplace-server-01" # Feel free to change the VM name
  # Machine type from your JSON example, made configurable via variable
  machine_type = var.vm_machine_type # e.g., "e2-micro"
  zone = var.gcp_zone

  # Combine tags from your JSON and needed for monitoring firewall rule
  tags = ["http-server", "https-server", "monitoring-ports"]

  boot_disk {
    initialize_params {
      # Image matching your JSON example
      image = "ubuntu-os-cloud/ubuntu-2004-lts"
    }
  }

  network_interface {
    # Use the default network
    network = "default"
    access_config {
      // Empty block assigns an ephemeral public IP
    }
  }

  # Configures SSH access
  metadata = {
    # <<< ENSURE var.ssh_user and var.ssh_pub_key_path in variables.tf (or .tfvars) ARE CORRECT >>>
    ssh-keys = "${var.ssh_user}:${file(var.ssh_pub_key_path)}"
  }

  # Shielded VM config based on your JSON example
  shielded_instance_config {
    enable_secure_boot          = false
    enable_vtpm                 = true
    enable_integrity_monitoring = true
  }

  # Scheduling options based on your JSON example
  scheduling {
    on_host_maintenance = "MIGRATE"
    automatic_restart   = true
  }

  allow_stopping_for_update = true
}