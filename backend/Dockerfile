# backend/Dockerfile
FROM python:3.12-slim

# Установка рабочей директории
WORKDIR /app

# Установка переменных окружения
# PYTHONDONTWRITEBYTECODE 1: Запрещает Python писать .pyc файлы на диск
# PYTHONUNBUFFERED 1: Гарантирует, что вывод Python будет отправлен сразу в терминал
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Установка системных зависимостей (если потребуется для сборки пакетов)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Копирование requirements.txt и установка зависимостей
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Копирование всего исходного кода
COPY . .

# Команда запуска будет переопределена в docker-compose, 
# но по умолчанию запускаем uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
