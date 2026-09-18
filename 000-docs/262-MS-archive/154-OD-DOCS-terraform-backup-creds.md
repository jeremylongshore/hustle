# Terraform Credentials

## Service Account Key Blocked

GCP organizational policy prevents service account key creation:
`constraints/iam.disableServiceAccountKeyCreation`

## Alternative: Application Default Credentials (ADC)

Use your user credentials for Terraform authentication (development only):

```bash
# Login with your user account
gcloud auth application-default login

# This creates credentials at:
# ~/.config/gcloud/application_default_credentials.json
```

## Update main.tf

Comment out the `credentials` line in `main.tf`:

```hcl
provider "google" {
  # credentials = file("${path.module}/.creds/terraform-sa-key.json")  # BLOCKED by org policy
  project     = var.project_id
  region      = var.region
  zone        = var.zone
}
```

Terraform will automatically use ADC when no credentials file is specified.

## For Production

Use Workload Identity Federation instead of service account keys:
https://cloud.google.com/iam/docs/workload-identity-federation

