.PHONY: help build up down restart logs clean backup restore dev prod

# Переменные
COMPOSE := docker compose
COMPOSE_DEV := docker compose -f docker-compose.yml -f docker-compose.dev.yml
BACKUP_DIR := ./backups
TIMESTAMP := $(shell date +%Y%m%d_%H%M%S)

help: ## Показать это сообщение помощи
	@echo "Доступные команды:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Собрать Docker образ
	$(COMPOSE) build

up: ## Запустить контейнеры в production режиме
	$(COMPOSE) up -d

down: ## Остановить контейнеры
	$(COMPOSE) down

restart: ## Перезапустить контейнеры
	$(COMPOSE) restart

logs: ## Показать логи всех сервисов
	$(COMPOSE) logs -f

logs-h5p: ## Показать логи H5P приложения
	$(COMPOSE) logs -f h5p

logs-traefik: ## Показать логи Traefik
	$(COMPOSE) logs -f traefik

ps: ## Показать статус контейнеров
	$(COMPOSE) ps

clean: ## Остановить контейнеры и удалить volumes (ОСТОРОЖНО!)
	@echo "ВНИМАНИЕ: Это удалит все данные! Нажмите Ctrl+C для отмены."
	@sleep 5
	$(COMPOSE) down -v

rebuild: ## Пересобрать образ с нуля и перезапустить
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d

# Разработка
dev: ## Запустить в режиме разработки
	$(COMPOSE_DEV) up

dev-build: ## Собрать и запустить в режиме разработки
	$(COMPOSE_DEV) up --build

dev-down: ## Остановить dev контейнеры
	$(COMPOSE_DEV) down

# Резервное копирование
backup-prepare: ## Создать директорию для резервных копий
	@mkdir -p $(BACKUP_DIR)

backup-content: backup-prepare ## Резервная копия content
	@echo "Создание резервной копии content..."
	@docker run --rm -v h5p-content:/data -v $(PWD)/$(BACKUP_DIR):/backup alpine \
		tar czf /backup/h5p-content-$(TIMESTAMP).tar.gz -C /data .
	@echo "✓ Резервная копия создана: $(BACKUP_DIR)/h5p-content-$(TIMESTAMP).tar.gz"

backup-libraries: backup-prepare ## Резервная копия libraries
	@echo "Создание резервной копии libraries..."
	@docker run --rm -v h5p-libraries:/data -v $(PWD)/$(BACKUP_DIR):/backup alpine \
		tar czf /backup/h5p-libraries-$(TIMESTAMP).tar.gz -C /data .
	@echo "✓ Резервная копия создана: $(BACKUP_DIR)/h5p-libraries-$(TIMESTAMP).tar.gz"

backup-userdata: backup-prepare ## Резервная копия user-data
	@echo "Создание резервной копии user-data..."
	@docker run --rm -v h5p-user-data:/data -v $(PWD)/$(BACKUP_DIR):/backup alpine \
		tar czf /backup/h5p-user-data-$(TIMESTAMP).tar.gz -C /data .
	@echo "✓ Резервная копия создана: $(BACKUP_DIR)/h5p-user-data-$(TIMESTAMP).tar.gz"

backup-all: backup-content backup-libraries backup-userdata ## Полная резервная копия всех данных
	@echo "✓ Полная резервная копия создана"

# Восстановление (использование: make restore-content FILE=backup.tar.gz)
restore-content: ## Восстановить content из резервной копии
	@if [ -z "$(FILE)" ]; then echo "Ошибка: укажите FILE=path/to/backup.tar.gz"; exit 1; fi
	@echo "Восстановление content из $(FILE)..."
	@docker run --rm -v h5p-content:/data -v $(PWD)/$(BACKUP_DIR):/backup alpine \
		sh -c "cd /data && tar xzf /backup/$(FILE)"
	@echo "✓ Content восстановлен"

restore-libraries: ## Восстановить libraries из резервной копии
	@if [ -z "$(FILE)" ]; then echo "Ошибка: укажите FILE=path/to/backup.tar.gz"; exit 1; fi
	@echo "Восстановление libraries из $(FILE)..."
	@docker run --rm -v h5p-libraries:/data -v $(PWD)/$(BACKUP_DIR):/backup alpine \
		sh -c "cd /data && tar xzf /backup/$(FILE)"
	@echo "✓ Libraries восстановлены"

restore-userdata: ## Восстановить user-data из резервной копии
	@if [ -z "$(FILE)" ]; then echo "Ошибка: укажите FILE=path/to/backup.tar.gz"; exit 1; fi
	@echo "Восстановление user-data из $(FILE)..."
	@docker run --rm -v h5p-user-data:/data -v $(PWD)/$(BACKUP_DIR):/backup alpine \
		sh -c "cd /data && tar xzf /backup/$(FILE)"
	@echo "✓ User-data восстановлены"

# Информация о системе
volumes: ## Показать Docker volumes
	@docker volume ls | grep h5p

inspect: ## Показать детальную информацию о контейнере H5P
	@docker inspect h5p-app

shell: ## Открыть shell в контейнере H5P
	@docker exec -it h5p-app sh

# Утилиты
validate: ## Проверить конфигурацию docker-compose
	$(COMPOSE) config

prune: ## Очистить неиспользуемые Docker ресурсы
	docker system prune -f
	docker volume prune -f

stats: ## Показать статистику использования ресурсов
	docker stats h5p-app h5p-traefik
