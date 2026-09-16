"""add course_versions table

Revision ID: 0004
Revises: 0003
Create Date: 2026-03-14
"""
from alembic import op
import sqlalchemy as sa

revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'course_versions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('course_id', sa.String(), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('label', sa.String(), nullable=True),
        sa.Column('content', sa.JSON(), nullable=False),
        sa.Column('screen_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('size_bytes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_auto', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_course_versions_course_id', 'course_versions', ['course_id'])


def downgrade() -> None:
    op.drop_index('ix_course_versions_course_id', table_name='course_versions')
    op.drop_table('course_versions')
