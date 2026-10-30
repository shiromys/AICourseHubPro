"""Server-side grading: attempt records and simulation sessions

Revision ID: e5a7b9d1f2c4
Revises: d4f6a8c0e1b3
Create Date: 2026-10-31 00:00:00.000000

Creates two NEW tables only; no existing table is changed. Safe on a live database.
"""
from alembic import op
import sqlalchemy as sa


revision = 'e5a7b9d1f2c4'
down_revision = 'd4f6a8c0e1b3'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'lesson_attempts',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('course_id', sa.Integer(), sa.ForeignKey('courses.id'), nullable=False),
        sa.Column('module_idx', sa.Integer(), nullable=False),
        sa.Column('lesson_idx', sa.Integer(), nullable=False),
        sa.Column('kind', sa.String(length=12), nullable=False),
        sa.Column('score', sa.Float(), nullable=False),
        sa.Column('correct', sa.Integer(), nullable=True),
        sa.Column('total', sa.Integer(), nullable=True),
        sa.Column('passed', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('answers', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_lesson_attempts_user_id', 'lesson_attempts', ['user_id'])
    op.create_index('ix_lesson_attempts_created_at', 'lesson_attempts', ['created_at'])
    op.create_table(
        'roleplay_sessions',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('course_id', sa.Integer(), sa.ForeignKey('courses.id'), nullable=False),
        sa.Column('module_idx', sa.Integer(), nullable=False),
        sa.Column('lesson_idx', sa.Integer(), nullable=False),
        sa.Column('messages', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=10), nullable=False, server_default='open'),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('feedback', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_roleplay_sessions_user_id', 'roleplay_sessions', ['user_id'])
    op.create_index('ix_roleplay_sessions_created_at', 'roleplay_sessions', ['created_at'])


def downgrade():
    op.drop_table('roleplay_sessions')
    op.drop_table('lesson_attempts')
