"""Add account_setup_complete flag

Revision ID: 56ca649f1f68
Revises: 2401f4b2098d
Create Date: 2026-08-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '56ca649f1f68'
down_revision = '2401f4b2098d'
branch_labels = None
depends_on = None


def upgrade():
    # server_default='true' is required here (not just the Python-level model
    # default) because this is a NOT NULL column and production's `users`
    # table already has real rows — Postgres needs a value to backfill them
    # with at the moment the column is added, or the migration fails.
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('account_setup_complete', sa.Boolean(), nullable=False, server_default='true'))

    # Drop the server default after backfilling existing rows — new rows go
    # through the app (models.py sets it explicitly), so we don't need the
    # database to keep defaulting it going forward.
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('account_setup_complete', server_default=None)


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('account_setup_complete')
