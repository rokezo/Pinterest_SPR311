import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'clonepinterest.db')

if not os.path.exists(db_path):
    print(f"Database file not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    with open(os.path.join(os.path.dirname(__file__), 'add_parent_comment_id.sql'), 'r') as f:
        sql = f.read()
        cursor.executescript(sql)
    conn.commit()
    print("Successfully added ParentCommentId column to Comments table")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e).lower():
        print("Column ParentCommentId already exists")
    else:
        print(f"Error: {e}")
        conn.rollback()
finally:
    conn.close()

