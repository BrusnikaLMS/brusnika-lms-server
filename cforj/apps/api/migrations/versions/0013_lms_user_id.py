"""Add lms_user_id column to courses table.

Revision ID: 0013
Revises: 0012
"""

from alembic import op
import sqlalchemy as sa

revision = "0013"
down_revision = "0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("courses", sa.Column("lms_user_id", sa.String(), nullable=True))
    op.create_index("ix_courses_lms_user_id", "courses", ["lms_user_id"])


def downgrade() -> None:
    op.drop_index("ix_courses_lms_user_id", table_name="courses")
    op.drop_column("courses", "lms_user_id")
