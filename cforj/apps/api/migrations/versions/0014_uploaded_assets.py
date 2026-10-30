"""Add uploaded_assets table for tracking file uploads with size.

Revision ID: 0014
Revises: 0013
"""

from alembic import op
import sqlalchemy as sa

revision = "0014"
down_revision = "0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "uploaded_assets",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("owner_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
        sa.Column("key", sa.String(), nullable=False, unique=True),
        sa.Column("url", sa.String(), nullable=False),
        sa.Column("original_name", sa.String(), nullable=True),
        sa.Column("mime_type", sa.String(), nullable=True),
        sa.Column("size_bytes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("ix_uploaded_assets_owner_id", "uploaded_assets", ["owner_id"])
    op.create_index("ix_uploaded_assets_key", "uploaded_assets", ["key"])


def downgrade() -> None:
    op.drop_index("ix_uploaded_assets_key", table_name="uploaded_assets")
    op.drop_index("ix_uploaded_assets_owner_id", table_name="uploaded_assets")
    op.drop_table("uploaded_assets")
