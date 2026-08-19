"""Add password_reset_tokens table

Revision ID: 0002_password_reset_tokens
Revises: 0001_initial
Create Date: 2026-03-10
"""
from alembic import op
import sqlalchemy as sa

revision = '0002_password_reset_tokens'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'password_reset_tokens',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('token', sa.String(), nullable=False, unique=True, index=True),
        sa.Column('used', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('password_reset_tokens')
