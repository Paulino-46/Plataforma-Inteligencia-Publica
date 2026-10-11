.PHONY: docker-up docker-down docker-clean docker-build docker-logs docker-dev db-migrate db-migrate-local db-seed db-seed-local npm-install pip-install

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-clean:
	docker compose down -v

docker-build:
	docker compose build --no-cache

docker-logs:
	docker compose logs -f

docker-dev:
	docker compose up --build


db-migrate:
	docker compose exec backend python scripts/migrate.py

db-migrate-local:
	cd backend-fast && python scripts/migrate.py

db-seed:
	docker compose exec backend python scripts/seed_data.py

db-seed-local:
	cd backend-fast && python scripts/seed_data.py

npm-install:
	@if [ -z "$(pkg)" ]; then \
		docker compose exec frontend npm install --no-audit --no-fund; \
	else \
		docker compose exec frontend npm install $(pkg) --no-audit --no-fund; \
	fi

pip-install:
	@if [ -z "$(pkg)" ]; then \
		docker compose exec backend pip install -r requirements.txt; \
	else \
		docker compose exec backend pip install $(pkg); \
	fi