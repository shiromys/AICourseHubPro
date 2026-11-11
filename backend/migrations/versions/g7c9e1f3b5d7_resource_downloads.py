"""Resource library: record template downloads

Revision ID: g7c9e1f3b5d7
Revises: f6b8d0e2a4c6
Create Date: 2026-11-11 00:00:00.000000

Adds one new table (nothing existing is changed): resource_downloads.
"""
from alembic import op
import sqlalchemy as sa


revision = 'g7c9e1f3b5d7'
down_revision = 'f6b8d0e2a4c6'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'resource_downloads',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('email', sa.String(length=120), nullable=False),
        sa.Column('slug', sa.String(length=120), nullable=False),
        sa.Column('file_name', sa.String(length=120), nullable=False),
        sa.Column('newsletter_opt_in', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_resource_downloads_email', 'resource_downloads', ['email'])
    op.create_index('ix_resource_downloads_slug', 'resource_downloads', ['slug'])


def downgrade():
    op.drop_index('ix_resource_downloads_slug', table_name='resource_downloads')
    op.drop_index('ix_resource_downloads_email', table_name='resource_downloads')
    op.drop_table('resource_downloads')
