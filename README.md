# Docker dependencies

This action is intended to build a Docker image separately from its dependencies using builkit.

Building images using this strategy can allow you to speed up your CI/CD pipeline
by avoiding building the same bootstrap image every time.

Caching this dependency image can also speedup your production build if done correctly.

This action will build the intermediary image and push it to a repository.
Next time this action runs, the image will be donwloaded instead (if the `intermediary_image_name` matches an existing image).

Then the action will only build/cache your intermediary image. Building the final image is still up to you.

## Usage

### Hashing

An important notion to understand is how this action decides if a new intermediary image is necessary.

If you're using this action your Dockerfile will have (at least) two `FROM` statements. This action will consider that the first FROM statement
is your intermediary image, and the next `FROM` statements depend on that image.

In order to get a value representing the need of a new image we need a hash of:
- all the files upon which the intermediary image depends (dependency locks, any scripts...)
- The first FROM statement of the Dockerfile (in case you change the 2nd image only, the intermediary does not need to be rebuilt)

The first hash is up to you, the developer. You can pass whatever value you want, and if no files are used, you can pass an empty string.
The second hash will be computed automatically by this action, it will read the `Dockerfile` from the first line and the first FROM statement until the next and hash the read part.

### tl;dr
```yaml
jobs:
	build_my_docker_image:
		- name: Build docker image and dependencies
		  uses: jsmrcaga/action-docker-build-dependencies
		  with:
		  	dockerfile_path: '.'
		  	docker_username: ${{ secrets.DOCKER_USERNAME }}
		  	docker_password: ${{ secrets.DOCKER_PASSWORD }}
		  	docker_registry: ghcr.io

		  	# Allow the action to read and compute intermediary hash from given hash and Dockerfile
		  	# Very useful if you change the "dependency" part of your Dockerfile
		  	compute_dockerfile_hash: true
		  	intermediary_hash: hash-of-my-dependencies
		  	intermediary_image_name: my-image

		  	# Url WITHOUT tag. The tag is the computed hash
		  	intermediary_image_url: https://ghcr.io/OWNER/my_intermediary_image
		  	intermediary_build_flags: --build-arg NODE_ENV="development"

		  	# Pushes the intermediary image in after your workflow runs
		  	should_push_intermediary_image: true
```

### Inputs

| Name | Required | Description |
|:----:|:--------:|:-----------:|
| `dockerfile_path` | No | The path to your Dockerfile's directory. Defaults to `.` |
| `docker_username` | No | Username to login to Docker registry |
| `docker_password` | No | Password to login to Docker registry |
| `docker_registry` | No | Registry to which to login. Defaults to "empty" which in turn defaults to Docker Hub |
| `compute_dockerfile_hash` | No | Defaults to `false`. If this action should compute a hash of the first part of your Dockerfile (from the 1st line until the 2nd `FROM`) |
| `intermediary_hash` | Yes | Should be the hash of any necessary files (ex: package.json, package-lock.json, requirements.txt ...) and will be used to compare if a new image is necessary or if the one in cache can be used. This will be rehashed with the Dockerfile hash if necessary. |
| `intermediary_image_name` | Yes | The name of the intermediary file as described in your Dockerfile. This will be used to build that image using `--target` |
| `intermediary_image_url` | Yes | This is the url without version used to find or publish the intermediary image. I personally use GitHub registry as a cache and upload my images where necessary (Docker Hub/ECR) |
| `intermediary_build_flags` | No | Any build flags you would like to append to the build command |
| `should_push_intermediary_image` | No | Defaults to `true`. If this action should push your intermediary image after your workflow runs |

The build command template looks like this:
```sh
	docker build 
		--pull
		--no-cache
		--target ${ inputs.intermediary_image_name }
		-t ${ inputs.intermediary_image_url }:${final_hash}
		${ inputs.intermediary_build_flags  }
		${ inputs.dockerfile_path }
```

### Example
```yaml
on:
	release:
		types: [published]

jobs:
	build_my_docker_image:
		runs-on: ubuntu-latest

		- name: Hash dependency files
		  id: deps_hash
		  echo: "::set-output name=dependency_hash::${{ hashFiles('package.json', 'package-lock.json') }}"

		- name: Build docker image and dependencies
		  uses: jsmrcaga/action-docker-build-dependencies
		  with:
			docker_username: ${{ secrets.DOCKER_USERNAME }}
			docker_password: ${{ secrets.DOCKER_PASSWORD }}
			docker_registry: ghcr.io

			intermediary_hash: ${{ steps.deps_hash.outputs.dependency_hash }}
			intermediary_image_name: my-project-deps
			intermediary_image_url: https://ghcr.io/jsmrcaga/my-repo-dependencies
			intermediary_build_flags: --build-arg NODE_ENV="development"
```

```dockerfile
# Automatic hash will begin here

ARG base_image=deps

# This is the name of the intermediary image you need to set on the workflow config
FROM node as deps

COPY ./package.json /myapp
COPY ./package-lock.json /myapp

npm i

# Automatic hash will end here

# Note the $base_image is the arg name
FROM $base_image

COPY . /myapp

CMD run my app
```
