# infrastructure/terraform/gcp/outputs.tf

output "marketplace_vm_external_ip" {
  description = "External IP address of the marketplace VM"
  # Accesses the first network interface [0] and its first access config [0]
  # to get the assigned public IP (nat_ip).
  # This will show the ephemeral IP assigned by GCP.
  value = google_compute_instance.marketplace_vm.network_interface[0].access_config[0].nat_ip
}

output "marketplace_vm_internal_ip" {
  description = "Internal IP address of the marketplace VM"
  # Accesses the first network interface [0] to get the private IP.
  value = google_compute_instance.marketplace_vm.network_interface[0].network_ip
}