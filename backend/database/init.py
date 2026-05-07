import logging
import mysql.connector
from mysql.connector import Error
from config import get_config
import os
import time

logger = logging.getLogger(__name__)

def execute_sql_file(conn, filepath):
    """Execute SQL file by reading and executing all SQL at once."""
    try:
        with open(filepath, 'r') as f:
            sql_content = f.read()

        cursor = conn.cursor()

        # Remove SQL comments (both -- and /* */ style)
        lines = []
        in_block_comment = False
        for line in sql_content.split('\n'):
            # Handle block comments
            if '/*' in line:
                in_block_comment = True
            if '*/' in line:
                in_block_comment = False
                continue

            if in_block_comment:
                continue

            # Remove line comments
            if '--' in line:
                line = line[:line.index('--')]

            lines.append(line)

        sql_content = '\n'.join(lines)

        # Split by semicolon and execute each statement
        statements = sql_content.split(';')
        for statement in statements:
            statement = statement.strip()
            # Skip empty statements and comment-only lines
            if not statement or statement.startswith('--'):
                continue

            try:
                cursor.execute(statement)
                conn.commit()
            except Error as e:
                logger.warning(f"Warning executing statement in {filepath}: {e}")
                logger.debug(f"Statement: {statement[:100]}...")
                conn.rollback()
                # Continue with next statement
                continue

        cursor.close()
        logger.info(f"Executed {filepath}")

    except FileNotFoundError:
        logger.error(f"File not found: {filepath}")
    except Exception as e:
        logger.error(f"Error executing {filepath}: {e}")


def init_database():
    """Initialize the database with schema, views, procedures, triggers, and seed data."""
    cfg = get_config()

    try:
        # First, create the database if it doesn't exist
        conn = mysql.connector.connect(
            host=cfg.DB_HOST,
            port=cfg.DB_PORT,
            user=cfg.DB_USER,
            password=cfg.DB_PASSWORD or "",
            charset="utf8mb4",
            autocommit=True
        )
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {cfg.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        cursor.close()
        conn.close()

        # Wait a moment for database creation
        time.sleep(1)

        # Connect to the created database
        conn = mysql.connector.connect(
            host=cfg.DB_HOST,
            port=cfg.DB_PORT,
            user=cfg.DB_USER,
            password=cfg.DB_PASSWORD or "",
            database=cfg.DB_NAME,
            charset="utf8mb4",
            autocommit=False
        )

        # Get the directory where this script is located
        db_dir = os.path.dirname(os.path.abspath(__file__))

        # Execute SQL files in order
        files_to_execute = [
            'schema.sql',
            'views.sql',
            'indexes.sql',
            'seed.sql'
        ]

        for filename in files_to_execute:
            filepath = os.path.join(db_dir, filename)
            if os.path.exists(filepath):
                logger.info(f"Executing {filename}...")
                execute_sql_file(conn, filepath)
            else:
                logger.warning(f"File not found: {filepath}")

        conn.close()
        logger.info("Database initialization completed successfully")
        return True

    except Error as e:
        logger.error(f"Database initialization error: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error during database initialization: {e}")
        return False
