"""Initial schema: users, courses, course_completions

Revision ID: 0001_initial
Revises:
Create Date: 2026-03-10
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('email', sa.String(), nullable=False, unique=True, index=True),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('plan', sa.String(), nullable=False, server_default='community'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        'courses',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('owner_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('thumbnail', sa.String(), nullable=True),
        sa.Column('content', JSON(), nullable=False),
        sa.Column('published', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_courses_owner_id', 'courses', ['owner_id'])

    op.create_table(
        'course_completions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('course_id', sa.String(), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('learner_id', sa.String(), nullable=True),
        sa.Column('learner_name', sa.String(), nullable=True),
        sa.Column('score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('max_score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('progress', JSON(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_completions_course_id', 'course_completions', ['course_id'])


def downgrade() -> None:
    op.drop_table('course_completions')
    op.drop_table('courses')
    op.drop_table('users')
