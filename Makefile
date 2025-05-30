.PHONY: build dev run sync

build:
	npm run build

dev:
	npm run dev

run: build
	npm run preview

sync:
	npm ci
