import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "nets.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    c = conn.cursor()
    c.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            persona TEXT NOT NULL,
            display_name TEXT NOT NULL,
            flashpay_balance REAL NOT NULL,
            is_traveling INTEGER NOT NULL DEFAULT 0,
            current_location TEXT NOT NULL DEFAULT 'Singapore'
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            merchant TEXT NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            location TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS user_pools (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            icon TEXT NOT NULL DEFAULT '💰',
            purpose_tag TEXT,
            owner_user_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (owner_user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS pool_members (
            id TEXT PRIMARY KEY,
            pool_id TEXT NOT NULL,
            display_name TEXT NOT NULL,
            phone TEXT,
            is_self INTEGER NOT NULL DEFAULT 0,
            joined_at TEXT NOT NULL,
            FOREIGN KEY (pool_id) REFERENCES user_pools(id)
        );

        CREATE TABLE IF NOT EXISTS pool_expenses (
            id TEXT PRIMARY KEY,
            pool_id TEXT NOT NULL,
            payer_member_id TEXT NOT NULL,
            amount REAL NOT NULL,
            description TEXT NOT NULL,
            split_type TEXT NOT NULL DEFAULT 'equal',
            created_at TEXT NOT NULL,
            FOREIGN KEY (pool_id) REFERENCES user_pools(id),
            FOREIGN KEY (payer_member_id) REFERENCES pool_members(id)
        );

        CREATE TABLE IF NOT EXISTS expense_splits (
            id TEXT PRIMARY KEY,
            expense_id TEXT NOT NULL,
            member_id TEXT NOT NULL,
            amount_owed REAL NOT NULL,
            FOREIGN KEY (expense_id) REFERENCES pool_expenses(id),
            FOREIGN KEY (member_id) REFERENCES pool_members(id)
        );

        CREATE TABLE IF NOT EXISTS pool_settlements (
            id TEXT PRIMARY KEY,
            pool_id TEXT NOT NULL,
            from_member_id TEXT NOT NULL,
            to_member_id TEXT NOT NULL,
            amount REAL NOT NULL,
            note TEXT,
            settled_at TEXT NOT NULL,
            FOREIGN KEY (pool_id) REFERENCES user_pools(id),
            FOREIGN KEY (from_member_id) REFERENCES pool_members(id),
            FOREIGN KEY (to_member_id) REFERENCES pool_members(id)
        );

        CREATE TABLE IF NOT EXISTS pool_invites (
            id TEXT PRIMARY KEY,
            pool_id TEXT NOT NULL,
            code TEXT UNIQUE NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (pool_id) REFERENCES user_pools(id)
        );

        CREATE TABLE IF NOT EXISTS pool_contributions (
            id TEXT PRIMARY KEY,
            pool_id TEXT NOT NULL,
            member_id TEXT NOT NULL,
            amount REAL NOT NULL,
            note TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (pool_id) REFERENCES user_pools(id),
            FOREIGN KEY (member_id) REFERENCES pool_members(id)
        );

        CREATE TABLE IF NOT EXISTS trips (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            destination TEXT NOT NULL,
            country TEXT NOT NULL,
            currency TEXT NOT NULL DEFAULT 'SGD',
            symbol TEXT NOT NULL DEFAULT 'S$',
            flag TEXT NOT NULL DEFAULT '🌏',
            fx_rate REAL NOT NULL DEFAULT 1.0,
            networks TEXT NOT NULL DEFAULT '[]',
            started_at TEXT NOT NULL,
            ended_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    """)
    conn.commit()
    conn.close()
