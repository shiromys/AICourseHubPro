"""Newsletter: audience segments and weekly batches

Revision ID: d4f6a8c0e1b3
Revises: c3e5a7b9d1f2
Create Date: 2026-10-30 00:00:00.000000

Adds three columns to newsletter_issues. Existing issues become segment 'all'
(everyone), exactly how they behaved before. Safe on a live table.
"""
from alembic import op
import sqlalchemy as sa


revision = 'd4f6a8c0e1b3'
down_revision = 'c3e5a7b9d1f2'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('newsletter_issues', sa.Column('segment', sa.String(length=30), nullable=False, server_default='all'))
    op.add_column('newsletter_issues', sa.Column('batch_key', sa.String(length=12), nullable=True))
    op.add_column('newsletter_issues', sa.Column('auto_generated', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.create_index('ix_newsletter_issues_batch_key', 'newsletter_issues', ['batch_key'])


def downgrade():
    op.drop_index('ix_newsletter_issues_batch_key', table_name='newsletter_issues')
    op.drop_column('newsletter_issues', 'auto_generated')
    op.drop_column('newsletter_issues', 'batch_key')
    op.drop_column('newsletter_issues', 'segment')
