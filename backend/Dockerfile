FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    netcat-openbsd \
    curl \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

COPY . .


RUN chmod +x /app/entrypoint.sh

# tạo user non-root
RUN useradd --create-home appuser \
 && chown -R appuser:appuser /app
USER appuser


EXPOSE 8000

CMD ["./entrypoint.sh"]
