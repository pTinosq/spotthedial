default:
    @just --list

install:
    pnpm install

dev:
    pnpm dev

build:
    pnpm build

start:
    pnpm start

lint:
    pnpm lint

typecheck:
    pnpm exec tsc --noEmit

check: lint typecheck
