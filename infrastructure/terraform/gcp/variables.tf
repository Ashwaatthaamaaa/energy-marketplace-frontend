# infrastructure/terraform/gcp/variables.tf

variable "gcp_project_id" {
  description = "Your GCP project ID"
  type        = string
  # No default - Provide this value (e.g., via terraform.tfvars or environment variable TF_VAR_gcp_project_id)
  # <<< REPLACE WITH YOUR GCP PROJECT ID >>>
}

variable "gcp_region" {
  description = "GCP region for resources"
  type        = string
  default     = "us-west1" # <<< REPLACE WITH YOUR PREFERRED GCP REGION IF DIFFERENT >>>
}

variable "gcp_zone" {
  description = "GCP zone within the region"
  type        = string
  default     = "us-west1-a" # <<< REPLACE WITH A ZONE IN YOUR CHOSEN REGION IF DIFFERENT >>>
}

variable "ssh_user" {
   description = "Username for SSH access on the VM"
   type        = string
   default     = "sk5633" # <<< REPLACE WITH YOUR DESIRED LINUX USERNAME (e.g., "sk5633") >>>
}

variable "ssh_pub_key_path" {
   description = "Path to your public SSH key file on your local machine"
   type        = string
   default     = "~/.ssh/gcp_ansible_key.pub" # <<< REPLACE WITH ACTUAL PATH (e.g., "~/.ssh/gcp_ansible_key.pub") >>>
}

variable "my_public_ip" {
  description = "Your current public IP address for firewall rules (e.g., '1.2.3.4/32' or '2402::/128')"
  type        = string
  # No default - Provide this value (e.g., via terraform.tfvars)
  # <<< REPLACE WITH YOUR PUBLIC IP (IPv4/32 or IPv6/128) >>>
}

variable "vm_machine_type" {
  description = "Machine type for the VM"
  type        = string
  default     = "e2-micro" # Matches the user JSON example
}