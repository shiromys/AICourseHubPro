"""Add flagged_payments table

Revision ID: fbff09e03363
Revises: 8437f5eadc77
Create Date: 2026-08-06 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fbff09e03363'
down_revision = '8437f5eadc77'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'flagged_payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('stripe_session_id', sa.String(length=255), nullable=True),
        sa.Column('payment_intent_id', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('resolved', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id']),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('flagged_payments')
