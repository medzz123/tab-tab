variable "TAG" {
  default = "latest"
}
variable "GCP_PROJECT_ID" {}
variable "GCP_REGION" {}
variable "ARTIFACT_REGISTRY_REPO" {}
variable "DATABASE_URL" {}

target "_base" {
  args = {
    DATABASE_URL           = DATABASE_URL
  }
  provenance = false
  sbom       = false
  context    = "."
}

group "default" {
  targets = [
    "api",
    "cron-runner",
    "events-api",
    "open-banking",
    "servicer-report",
    "webhook"
  ]
}

function "image_tag" {
  params = [app_name]
  result = "${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${ARTIFACT_REGISTRY_REPO}/${app_name}:${TAG}"
}

target "api" {
  inherits   = ["_base"]
  dockerfile = "apps/api/Dockerfile"
  tags       = [image_tag("api")]
}