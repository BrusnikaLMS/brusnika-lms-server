"""add screen_comments, white_label_configs, org_sso_configs, audit_logs

Revision ID: 0006
Revises: 0005
Create Date: 2026-03-16
"""
from alembic import op
import sqlalchemy as sa

revision = '0006'
down_revision = '0005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'screen_comments',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('course_id', sa.String(), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('screen_id', sa.String(), nullable=False, index=True),
        sa.Column('author_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('resolved', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    )

    op.create_table(
        'white_label_configs',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('owner_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True),
        sa.Column('app_name', sa.String(), nullable=False, server_default='cforj'),
        sa.Column('logo_url', sa.String(), nullable=True),
        sa.Column('primary_color', sa.String(), nullable=False, server_default='#34d399'),
        sa.Column('remove_branding', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('custom_domain', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    )

    op.create_table(
        'org_sso_configs',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('owner_id', sa.String(), sa.ForeignKey('users.id'), nullable=False, unique=True, index=True),
        sa.Column('provider', sa.String(), nullable=False, server_default='saml'),
        sa.Column('entity_id', sa.String(), nullable=False, server_default=''),
        sa.Column('sso_url', sa.String(), nullable=False, server_default=''),
        sa.Column('certificate', sa.Text(), nullable=False, server_default=''),
        sa.Column('enabled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    )

    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('owner_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('actor_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('resource_type', sa.String(), nullable=False),
        sa.Column('resource_id', sa.String(), nullable=True),
        sa.Column('resource_name', sa.String(), nullable=True),
        sa.Column('meta', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    )


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('org_sso_configs')
    op.drop_table('white_label_configs')
    op.drop_table('screen_comments')
