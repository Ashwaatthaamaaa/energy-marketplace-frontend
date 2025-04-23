# infrastructure/terraform/gcp/terraform.tfvars

# --- Required Values ---
gcp_project_id = "deep-tracer-456420-i0"  # <<< REPLACE
my_public_ip   = "45.119.28.27/32" # <<< REPLACE (e.g., "103.55.21.87/32")

# --- Values likely needing change from defaults ---
ssh_user         = "sk5633"
ssh_pub_key_path = "~/.ssh/gcp_ansible_key.pub"

# --- Optional overrides (only if you want different from variables.tf defaults) ---
# gcp_region = "us-central1"
# gcp_zone   = "us-central1-a"