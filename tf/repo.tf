module repo {
  github = {
    token = var.github_token
  }

  source = "git@github.com:jsmrcaga/terraform-modules//github-repo?ref=v0.0.11"

  name = "action-docker-build-dependencies"
  description = "A simple action to build separate docker images for dependencies"

  topics = ["docker"]
}
