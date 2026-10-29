"""Flagged payments: amount, customer email and the recorded management decision

Revision ID: b2d4f6a8c0e1
Revises: a1c3e5f7b9d2
Create Date: 2026-10-29 00:00:00.000000

Adds columns only (all nullable) - safe on a live table, nothing is rewritten or removed.
Rows resolved before this change keep resolved=true and simply show no recorded outcome.
"""
from alembic import op
import sqlalchemy as sa


revision = 'b2d4f6a8c0e1'
down_revision = 'a1c3e5f7b9d2'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('flagged_payments', sa.Column('amount_cents', sa.Integer(), nullable=True))
    op.add_column('flagged_payments', sa.Column('currency', sa.String(length=10), nullable=True))
    op.add_column('flagged_payments', sa.Column('customer_email', sa.String(length=255), nullable=True))
    op.add_column('flagged_payments', sa.Column('outcome', sa.String(length=30), nullable=True))
    op.add_column('flagged_payments', sa.Column('resolution_note', sa.Text(), nullable=True))
    op.add_column('flagged_payments', sa.Column('resolved_by', sa.String(length=255), nullable=True))
    # Existing rows: fill the customer email from the account they were flagged against.
    op.execute("""
        UPDATE flagged_payments fp SET customer_email = u.email
        FROM users u WHERE u.id = fp.user_id AND fp.customer_email IS NULL
    """)


def downgrade():
    for c in ('resolved_by', 'resolution_note', 'outcome', 'customer_email', 'currency', 'amount_cents'):
        op.drop_column('flagged_payments', c)
