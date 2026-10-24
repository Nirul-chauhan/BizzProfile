"""Start the embedded PostgreSQL (no Docker) and point .env at it.

Usage: python scripts/start_db.py
"""

import os
import re
import sys

import psycopg2
import pgserver

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PGDATA = os.path.join(BACKEND_DIR, ".pgdata")
ENV_FILE = os.path.join(BACKEND_DIR, ".env")
DB_NAME = "bizzprofile"


def update_env(url: str) -> None:
    with open(ENV_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    new_line = f"DATABASE_URL={url}"
    if re.search(r"^DATABASE_URL=.*$", content, flags=re.MULTILINE):
        content = re.sub(r"^DATABASE_URL=.*$", new_line, content, flags=re.MULTILINE)
    else:
        content = new_line + "\n" + content
    with open(ENV_FILE, "w", encoding="utf-8") as f:
        f.write(content)


def main() -> int:
    server = pgserver.get_server(PGDATA, cleanup_mode=None)

    info = server.get_postmaster_info()
    host, port = info.hostname or "127.0.0.1", info.port

    conn = psycopg2.connect(host=host, port=port, user="postgres", dbname="postgres")
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (DB_NAME,))
    if cur.fetchone() is None:
        cur.execute(f'CREATE DATABASE "{DB_NAME}"')
        print(f"Created database {DB_NAME}")
    conn.close()

    url = f"postgresql://postgres:@{host}:{port}/{DB_NAME}"
    update_env(url)
    print(f"PostgreSQL running at {url}")
    print(f".env DATABASE_URL updated -> {ENV_FILE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
