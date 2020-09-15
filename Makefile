develop:
	npx webpack-dev-server
start:
	npm run start:dev
install:
	npm install
build:
	NODE_ENV=production npx webpack
lint:
	npx eslint .
