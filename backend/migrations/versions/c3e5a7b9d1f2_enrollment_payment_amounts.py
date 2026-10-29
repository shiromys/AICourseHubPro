"""Enrollments: record what was actually paid

Revision ID: c3e5a7b9d1f2
Revises: b2d4f6a8c0e1
Create Date: 2026-10-29 00:00:00.000000

Adds nullable columns only (plus one boolean with a default) - safe on a live table.
Backfill for rows that already exist (clearly marked amount_estimated = true):
  * stripe_session_id shared by 2+ enrollments  -> 'stripe_bundle', $159 split evenly
  * stripe_session_id on a single enrollment    -> 'stripe', the course's list price
  * no stripe_session_id                        -> 'unverified', amount left empty
Unverified rows are NOT counted as revenue until an admin sets the amount in
Admin > Revenue & Sales (they could be admin grants or purchases made before receipts were stored).
"""
from alembic import op
import sqlalchemy as sa


revision = 'c3e5a7b9d1f2'
down_revision = 'b2d4f6a8c0e1'
branch_labels = None
depends_on = None

BUNDLE_PRICE_CENTS = 15900


def upgrade():
    op.add_column('enrollments', sa.Column('amount_paid_cents', sa.Integer(), nullable=True))
    op.add_column('enrollments', sa.Column('currency', sa.String(length=10), nullable=True))
    op.add_column('enrollments', sa.Column('payment_source', sa.String(length=20), nullable=True))
    op.add_column('enrollments', sa.Column('amount_estimated', sa.Boolean(), nullable=False, server_default=sa.text('false')))

    # Bundles: several enrollments share one Stripe session.
    op.execute(f"""
        UPDATE enrollments e SET
            payment_source = 'stripe_bundle',
            currency = 'USD',
            amount_estimated = true,
            amount_paid_cents = ROUND({BUNDLE_PRICE_CENTS}::numeric / g.cnt)::int
        FROM (SELECT stripe_session_id, COUNT(*) AS cnt FROM enrollments
              WHERE stripe_session_id IS NOT NULL GROUP BY stripe_session_id HAVING COUNT(*) > 1) g
        WHERE e.stripe_session_id = g.stripe_session_id
    """)
    # Single-course purchases.
    op.execute("""
        UPDATE enrollments e SET
            payment_source = 'stripe',
            currency = 'USD',
            amount_estimated = true,
            amount_paid_cents = ROUND(COALESCE(c.price, 0) * 100)::int
        FROM courses c
        WHERE c.id = e.course_id AND e.stripe_session_id IS NOT NULL AND e.payment_source IS NULL
    """)
    # No receipt on file.
    op.execute("UPDATE enrollments SET payment_source = 'unverified' WHERE payment_source IS NULL")


def downgrade():
    for c in ('amount_estimated', 'payment_source', 'currency', 'amount_paid_cents'):
        op.drop_column('enrollments', c)
