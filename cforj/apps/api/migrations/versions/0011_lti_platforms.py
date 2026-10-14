"""Add LTI platforms table.

Revision ID: 0011
Revises: 0010
"""

from alembic import op
import sqlalchemy as sa

revision = "0011"
down_revision = "0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "lti_platforms",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("issuer", sa.String(), nullable=False),
        sa.Column("client_id", sa.String(), nullable=False),
        sa.Column("auth_login_url", sa.String(), nullable=False),
        sa.Column("auth_token_url", sa.String(), nullable=False),
        sa.Column("key_set_url", sa.String(), nullable=False),
        sa.Column("deployment_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("deployment_id"),
    )
    op.create_index("ix_lti_platforms_issuer", "lti_platforms", ["issuer"])


def downgrade() -> None:
    op.drop_index("ix_lti_platforms_issuer", table_name="lti_platforms")
    op.drop_table("lti_platforms")
