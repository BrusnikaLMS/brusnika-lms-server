"""add course_collaborators table

Revision ID: 0005
Revises: 0004
Create Date: 2026-03-16
"""
from alembic import op
import sqlalchemy as sa

revision = '0005'
down_revision = '0004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'course_collaborators',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('course_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('invited_email', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False, server_default='editor'),
        sa.Column('invite_token', sa.String(), nullable=True),
        sa.Column('accepted_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('invite_token'),
    )
    op.create_index('ix_course_collaborators_course_id', 'course_collaborators', ['course_id'])
    op.create_index('ix_course_collaborators_user_id', 'course_collaborators', ['user_id'])
    op.create_index('ix_course_collaborators_invited_email', 'course_collaborators', ['invited_email'])


def downgrade() -> None:
    op.drop_index('ix_course_collaborators_invited_email', table_name='course_collaborators')
    op.drop_index('ix_course_collaborators_user_id', table_name='course_collaborators')
    op.drop_index('ix_course_collaborators_course_id', table_name='course_collaborators')
    op.drop_table('course_collaborators')
