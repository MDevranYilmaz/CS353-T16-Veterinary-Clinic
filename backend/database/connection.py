import logging
import mysql.connector
from mysql.connector import pooling
from config import get_config

logger = logging.getLogger(__name__)

_pool: pooling.MySQLConnectionPool | None = None


def init_pool():
    global _pool
    cfg = get_config()
    _pool = pooling.MySQLConnectionPool(
        pool_name="vetclinic_pool",
        pool_size=cfg.DB_POOL_SIZE,
        pool_reset_session=True,
        host=cfg.DB_HOST,
        port=cfg.DB_PORT,
        database=cfg.DB_NAME,
        user=cfg.DB_USER,
        password=cfg.DB_PASSWORD,
        charset="utf8mb4",
        collation="utf8mb4_unicode_ci",
        autocommit=False,
    )
    logger.info("MySQL connection pool initialised (size=%d)", cfg.DB_POOL_SIZE)


def get_connection() -> mysql.connector.MySQLConnection:
    if _pool is None:
        init_pool()
    return _pool.get_connection()


class DBContext:
    """Context manager that yields a (conn, cursor) pair and auto-commits / rolls back."""

    def __init__(self, dictionary=True):
        self._dictionary = dictionary
        self.conn = None
        self.cursor = None

    def __enter__(self):
        self.conn = get_connection()
        self.cursor = self.conn.cursor(dictionary=self._dictionary)
        return self.conn, self.cursor

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.conn.rollback()
            logger.error("DB transaction rolled back: %s", exc_val)
        else:
            self.conn.commit()
        self.cursor.close()
        self.conn.close()
        return False
